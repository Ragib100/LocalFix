import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedBackground from '../../components/AnimatedBackground';
import ViewDetailsModal from '../common/view_details';
import '../../styles/admin/review_problem.css';

function ReviewProblems() {
    const [proofSubmissions, setProofSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [showViewDetails, setShowViewDetails] = useState(false);

    useEffect(() => {
        const fetchPending = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/proofs/pending`, {
                    withCredentials: true
                });
                setProofSubmissions(res.data.proofs || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchPending();
    }, []);

    const handleViewDetails = (issueId) => {
        setSelectedIssueId(issueId);
        setShowViewDetails(true);
    };

    const handleAcceptProof = async (proofId) => {
        const feedback = window.prompt('Optional feedback for approval (visible to worker):', '');
        try {
            await axios.put(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/proofs/${proofId}/approve`, { feedback }, { withCredentials: true });
            setProofSubmissions(prev => prev.filter(s => s.proof_id !== proofId));
        } catch (e) {
            console.error(e);
            alert('Failed to approve proof');
        }
    };

    const handleRequestRevision = async (proofId) => {
        const feedback = prompt('Please provide feedback for rejection:');
        if (!feedback) return;
        try {
            await axios.put(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/proofs/${proofId}/reject`, { feedback }, { withCredentials: true });
            setProofSubmissions(prev => prev.filter(s => s.proof_id !== proofId));
        } catch (e) {
            console.error(e);
            alert('Failed to reject proof');
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            case 'revision_requested': return 'status-revision';
            default: return 'status-pending';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending Review';
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            case 'revision_requested': return 'Revision Requested';
            default: return 'Pending Review';
        }
    };

    return (
        <AnimatedBackground>
            <div className="review-problems-container">
                <div className="page-header">
                    <h1>Review Problem Solutions</h1>
                    <p className="page-subtitle">Review and verify worker-submitted proof of completed work</p>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading proof submissions...</p>
                    </div>
                ) : (
                    <div className="proof-submissions-grid">
                        {proofSubmissions.length === 0 ? (
                            <div className="no-submissions">
                                <div className="no-submissions-icon">📋</div>
                                <h3>No Proof Submissions</h3>
                                <p>There are no proof submissions to review at this time.</p>
                            </div>
                        ) : (
                            proofSubmissions.map((submission) => (
                                <div key={submission.proof_id} className="proof-submission-card">
                                    <div className="card-header">
                                        <div className="issue-info">
                                            <h3 className="issue-title">{submission.issue_title}</h3>
                                            <div className="issue-meta">
                                                <span className="issue-id">ID: #{submission.issue_id}</span>
                                                <span className="issue-category">{submission.issue_category}</span>
                                                <span className="issue-location">{submission.issue_location}</span>
                                            </div>
                                        </div>
                                        <div className={`verification-status ${getStatusClass(submission.verification_status)}`}>
                                            {getStatusText(submission.verification_status)}
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        <div className="worker-section">
                                            <div className="worker-details">
                                                <h4 className="worker-name">{submission.worker_name}</h4>
                                                <p className="worker-contact">{submission.worker_email}</p>
                                                <p className="worker-contact">{submission.worker_phone}</p>
                                            </div>
                                        </div>

                                        <div className="submission-details">
                                            <div className="submission-date">
                                                <span className="date-label">Submitted:</span>
                                                <span className="date-value">
                                                    {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>

                                            <div className="proof-content">
                                                <div className="proof-image">
                                                    <img 
                                                        src={`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/uploads/image/proofs/${submission.proof_photo.split('/').pop()}`}
                                                        alt="Proof of work"
                                                        onError={(e) => {
                                                            e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA2NUgxMTVWOTVIODVWNjVaIiBmaWxsPSIjRDVEOURGIi8+CjxwYXRoIGQ9Ik05MCA3MEgxMTBWOTBIOTBWNzBaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPgo=";
                                                        }}
                                                    />
                                                </div>
                                                <div className="proof-description">
                                                    <h5>Work Description:</h5>
                                                    <p>{submission.proof_description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button 
                                            className="btn btn-view-details"
                                            onClick={() => handleViewDetails(submission.issue_id)}
                                        >
                                            <span className="btn-icon">📖</span>
                                            View Details
                                        </button>
                                        
                                        {submission.verification_status === 'pending' && (
                                            <>
                                                <button 
                                                    className="btn btn-accept"
                                                    onClick={() => handleAcceptProof(submission.proof_id)}
                                                >
                                                    <span className="btn-icon">✅</span>
                                                    Approve
                                                </button>
                                                
                                                <button 
                                                    className="btn btn-revision"
                                                    onClick={() => handleRequestRevision(submission.proof_id)}
                                                >
                                                    <span className="btn-icon">🔄</span>
                                                    Request Revision
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* View Details Modal */}
                <ViewDetailsModal
                    isOpen={showViewDetails}
                    onClose={() => setShowViewDetails(false)}
                    issueId={selectedIssueId}
                />
            </div>
        </AnimatedBackground>
    );
}

export default ReviewProblems;