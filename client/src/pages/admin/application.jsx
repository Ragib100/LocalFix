import { useState, useEffect } from 'react';
import AnimatedBackground from '../../components/AnimatedBackground';
import '../../styles/admin/application.css';
import { useAuth } from '../../context/AuthContext';

function Application() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState({});
    const { user } = useAuth();
    
    const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

    // Function to fetch data from the API
    const loadApplications = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/issues/applications/pending`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data); // Debug log
            setApplications(data.applications || []);
            
        } catch (error) {
            console.error("Error loading applications:", error);
            setError(error.message || "Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadApplications();
        }
    }, [user]);

    const handleAcceptApplication = async (applicationId, jobId) => {
        const applicationFeedback = feedback[applicationId] || 'Your application has been approved.';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/issues/${jobId}/applications/${applicationId}/accept`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feedback: applicationFeedback })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to accept application');
            }

            alert("Application accepted! The page will now refresh.");
            await loadApplications(); // Wait for refresh to complete

        } catch (error) {
            console.error("Error accepting application:", error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleRejectApplication = async (applicationId, jobId) => {
        const applicationFeedback = feedback[applicationId] || 'Your application was not selected at this time.';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/issues/${jobId}/applications/${applicationId}/reject`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feedback: applicationFeedback })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to reject application');
            }
            
            alert("Application rejected!");
            await loadApplications(); // Wait for refresh to complete

        } catch (error) {
            console.error("Error rejecting application:", error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleFeedbackChange = (applicationId, feedbackText) => {
        setFeedback(prev => ({
            ...prev,
            [applicationId]: feedbackText
        }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Group applications by job
    const groupedApplications = applications.reduce((groups, app) => {
        const jobId = app.job_id;
        if (!groups[jobId]) {
            groups[jobId] = [];
        }
        groups[jobId].push(app);
        return groups;
    }, {});

    if (loading) {
        return (
            <div className="applications-container">
                <div className="loading">
                    <p>Loading applications...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="applications-container">
                <div className="error-message">
                    <h2>Error Loading Applications</h2>
                    <p>{error}</p>
                    <button onClick={loadApplications} className="retry-btn">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AnimatedBackground>
            <div className="applications-container">
            {Object.keys(groupedApplications).length === 0 ? (
                <div className="no-applications">
                    <p>No pending applications found.</p>
                </div>
            ) : (
                <div className="jobs-list">
                    {Object.entries(groupedApplications).map(([jobId, jobApplications]) => {
                        const firstApp = jobApplications[0];
                        return (
                            <div key={jobId} className="job-group">
                                <div className="job-header">
                                    <h2>{firstApp.job_title}</h2>
                                    <div className="job-details">
                                        <p><strong>Description:</strong> {firstApp.issue_description}</p>
                                        <p><strong>Location:</strong> {firstApp.location}</p>
                                        {firstApp.issue_image && (
                                            <div className="job-image">
                                                <img 
                                                    src={`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}${firstApp.issue_image}`} 
                                                    alt="Issue" 
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="applications-grid">
                                    {jobApplications.map((application) => (
                                        <div key={application.application_id} className={`application-card ${application.status}`}>
                                            <div className="application-header">
                                                <div className="worker-info">
                                                    <div className="worker-avatar">
                                                        {application.worker?.name?.charAt(0)?.toUpperCase() || 'W'}
                                                    </div>
                                                    <div className="worker-details">
                                                        <h3>{application.worker?.name || 'Unknown Worker'}</h3>
                                                        <p>ID: {application.worker?.id || 'N/A'}</p>
                                                        <p>Phone: {application.worker?.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="application-body">
                                                <div className="cost-time-info">
                                                    <div className="cost-info">
                                                        <label>Estimated Cost:</label>
                                                        <span className="cost-value">{formatCurrency(application.estimated_cost)}</span>
                                                    </div>
                                                    <div className="time-info">
                                                        <label>Estimated Time:</label>
                                                        <span className="time-value">{application.estimated_time}</span>
                                                    </div>
                                                </div>

                                                <div className="proposal-section">
                                                    <h4>Worker's Proposal:</h4>
                                                    <p>{application.proposal}</p>
                                                </div>

                                                <div className="application-meta">
                                                    <p className="applied-date">Applied: {formatDate(application.applied_at)}</p>
                                                </div>

                                                {application.feedback && (
                                                    <div className="feedback-section">
                                                        <h4>Admin Feedback:</h4>
                                                        <p>{application.feedback}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {application.status === "pending" && (
                                                <div className="application-actions">
                                                    <div className="feedback-input">
                                                        <label htmlFor={`feedback-${application.application_id}`}>
                                                            Feedback (Optional):
                                                        </label>
                                                        <textarea
                                                            id={`feedback-${application.application_id}`}
                                                            placeholder="Provide feedback for this application..."
                                                            value={feedback[application.application_id] || ''}
                                                            onChange={(e) => handleFeedbackChange(application.application_id, e.target.value)}
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <div className="action-buttons">
                                                        <button 
                                                            className="accept-btn"
                                                            onClick={() => handleAcceptApplication(application.application_id, application.job_id)}
                                                        >
                                                            Accept Application
                                                        </button>
                                                        <button 
                                                            className="reject-btn"
                                                            onClick={() => handleRejectApplication(application.application_id, application.job_id)}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            </div>
        </AnimatedBackground>
    );
}

export default Application;