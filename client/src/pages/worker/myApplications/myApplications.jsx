import React, { useState, useEffect, useCallback } from 'react';
import Submit_proof from './submitProof';
import AnimatedBackground from '../../../components/AnimatedBackground';
import '../../../styles/worker/myApplications.css';
import axios from "axios";

function MyApplications() {
    const [filter, setFilter] = useState('all');
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [is_submit_open, set_is_submit_open] = useState(false);
    const [selectedIssueId, setSelectedIssueId] = useState(null);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/worker/applications');
            setApplications(response.data.applications || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch applications.');
            console.error('Error fetching applications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleStartWork = async (issueId) => {
        try {
            await axios.put('/api/worker/start', { issueId });
            // Refresh data to show the change
            fetchApplications();
        } catch (error) {
            console.error('Error starting work:', error);
            alert(error.response?.data?.message || 'Could not start work.');
        }
    };

    const handleDeleteApplication = async (issueId) => {
        if (!window.confirm('Are you sure you want to delete this application?')) {
            return;
        }

        try {
            await axios.delete(`/api/worker/applications/${issueId}`);
            // Refresh data to show the change
            fetchApplications();
            alert('Application deleted successfully');
        } catch (error) {
            console.error('Error deleting application:', error);
            alert(error.response?.data?.message || 'Could not delete application.');
        }
    };

    const handleOpenModal = (issueId) => {
        setSelectedIssueId(issueId);
        set_is_submit_open(true);
    };

    const handleCloseModal = () => {
        set_is_submit_open(false);
        setSelectedIssueId(null);
    };

    const handleSubmitProofSuccess = () => {
        handleCloseModal();
        // Refresh the list to show the new 'under_review' status
        fetchApplications();
    };

    // Calculate counts dynamically - Modified to include application statuses
    const getCount = (status) => {
        if (status === 'applied') {
            // Count all applications that are in submitted, under_review, or rejected status
            return applications.filter(a => 
                a.applicationStatus && 
                ['submitted', 'under_review', 'rejected'].includes(a.applicationStatus)
            ).length;
        }
        return applications.filter(a => a.status === status).length;
    };
    
    // Filter applications based on selected filter - Modified for applied filter
    const filteredApplications = () => {
        if (filter === 'all') return applications;
        if (filter === 'applied') {
            // Show applications that are in submitted, under_review, or rejected status
            return applications.filter(a => 
                a.applicationStatus && 
                ['submitted', 'under_review', 'rejected'].includes(a.applicationStatus)
            );
        }
        return applications.filter(a => a.status === filter);
    };

    // Get application status display info
    const getApplicationStatusInfo = (app) => {
        if (!app.applicationStatus) return null;
        
        switch (app.applicationStatus) {
            case 'submitted':
                return {
                    message: 'Application submitted - Waiting for review',
                    icon: 'bx-time',
                    className: 'submitted-message'
                };
            case 'under_review':
                return {
                    message: 'Application under review',
                    icon: 'bx-search-alt',
                    className: 'review-message'
                };
            case 'rejected':
                return {
                    message: 'Application rejected',
                    icon: 'bx-x-circle',
                    className: 'rejected-message'
                };
            default:
                return null;
        }
    };

    if (loading) {
        return <div className="loading">Loading your applications...</div>;
    }
    
    if (error) {
        return <div className="error-message">Error: {error}</div>
    }

    return (
        <AnimatedBackground>
            <div className="my-applications-container">
            <div className="filter-buttons">
                <button className={`filter-button ${filter === 'all' ? 'selected' : ''}`} onClick={() => setFilter('all')}>All ({applications.length})</button>
                <button className={`filter-button ${filter === 'applied' ? 'selected' : ''}`} onClick={() => setFilter('applied')}>Applied ({getCount('applied')})</button>
                <button className={`filter-button ${filter === 'assigned' ? 'selected' : ''}`} onClick={() => setFilter('assigned')}>Assigned ({getCount('assigned')})</button>
                <button className={`filter-button ${filter === 'in_progress' ? 'selected' : ''}`} onClick={() => setFilter('in_progress')}>In Progress ({getCount('in_progress')})</button>
                <button className={`filter-button ${filter === 'under_review' ? 'selected' : ''}`} onClick={() => setFilter('under_review')}>Under Review ({getCount('under_review')})</button>
                <button className={`filter-button ${filter === 'resolved' ? 'selected' : ''}`} onClick={() => setFilter('resolved')}>Resolved ({getCount('resolved')})</button>
            </div>

            <div className="application-list">
                {filteredApplications().length === 0 ? (
                    <div className="no-applications">
                        <p>No applications found for the selected filter.</p>
                    </div>
                ) : (
                    filteredApplications().map(app => {
                        const statusInfo = getApplicationStatusInfo(app);
                        
                        return (
                            <div key={app.id} className="application-item">
                                <div className="application-content">
                                    <div className="application-header">
                                        <h2>{app.title}</h2>
                                    </div>
                                    
                                    <div className="basic-info-grid">
                                        <div className="info-item"><strong>Location:</strong> {app.location}</div>
                                        <div className="info-item"><strong>Category:</strong> {app.category}</div>
                                        <div className="info-item">
                                            <strong>Priority:</strong> 
                                            <span className={`priority-badge priority-${app.priority}`}>
                                                {app.priority}
                                            </span>
                                        </div>
                                        {app.appliedDate && <div className="info-item"><strong>Applied:</strong> {app.appliedDate}</div>}
                                        {app.assignedDate && <div className="info-item"><strong>Assigned:</strong> {app.assignedDate}</div>}
                                    </div>

                                    <div className="description-section">
                                        <strong>Description:</strong>
                                        <p>{app.description}</p>
                                    </div>

                                    {app.citizenName && (
                                        <div className="citizen-info">
                                            <strong>Citizen:</strong> {app.citizenName}
                                            {app.citizenContact && <span className="citizen-contact"> | {app.citizenContact}</span>}
                                        </div>
                                    )}

                                    {app.myProposal && (
                                        <div className="proposal worker-proposal">
                                            <strong>My Proposal:</strong>
                                            <p>{app.myProposal}</p>
                                        </div>
                                    )}

                                    {app.adminFeedback && (
                                        <div className="proposal admin-note">
                                            <strong>Admin Feedback:</strong>
                                            <p>{app.adminFeedback}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="action-buttons">
                                    {/* Show Start Work button only for 'assigned' status */}
                                    {app.status === 'assigned' && (
                                        <button className="action-btn start-work-btn" onClick={() => handleStartWork(app.id)}>
                                            <i className='bx bx-play-circle'></i> Start Work
                                        </button>
                                    )}
                                    
                                    {/* Show Submit Proof button only for 'in_progress' status */}
                                    {app.status === 'in_progress' && (
                                        <button className="action-btn submit-proof-btn" onClick={() => handleOpenModal(app.id)}>
                                            <i className='bx bx-camera'></i> Submit Proof
                                        </button>
                                    )}

                                    {/* Show Delete button for rejected applications */}
                                    {app.applicationStatus === 'rejected' && (
                                        <button className="action-btn delete-btn" onClick={() => handleDeleteApplication(app.id)}>
                                            <i className='bx bx-trash'></i> Delete Application
                                        </button>
                                    )}

                                    {/* Status messages for issue statuses */}
                                    {app.status === 'applied' && !statusInfo && <div className="waiting-message"><i className='bx bx-time'></i> Waiting for assignment</div>}
                                    {app.status === 'under_review' && <div className="review-message"><i className='bx bx-check-circle'></i> Proof submitted - Under review</div>}
                                    {app.status === 'resolved' && <div className="completed-message"><i className='bx bx-badge-check'></i> Work completed & verified</div>}
                                    
                                    {/* Status messages for application statuses */}
                                    {statusInfo && (
                                        <div className={statusInfo.className}>
                                            <i className={`bx ${statusInfo.icon}`}></i> {statusInfo.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {is_submit_open && (
                <Submit_proof
                    isOpen={is_submit_open}
                    onClose={handleCloseModal}
                    onSubmitSuccess={handleSubmitProofSuccess}
                    issueId={selectedIssueId}
                />
            )}
            </div>
        </AnimatedBackground>
    );
}

export default MyApplications;