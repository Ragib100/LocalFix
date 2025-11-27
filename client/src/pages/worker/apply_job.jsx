import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../styles/worker/apply_job.css';

const ApplyJobModal = ({ isOpen, onClose, issueId, issueTitle }) => {
    const [estimatedCost, setEstimatedCost] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');
    const [timeUnit, setTimeUnit] = useState('days');
    const [proposalDescription, setProposalDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validation
        if (!estimatedCost || !estimatedTime || !proposalDescription.trim()) {
            setError('Please fill in all required fields including your proposal');
            return;
        }

        const costValue = parseFloat(estimatedCost);
        const timeValue = parseFloat(estimatedTime);

        if (isNaN(costValue) || costValue <= 0) {
            setError('Estimated cost must be a valid number greater than 0');
            return;
        }

        if (isNaN(timeValue) || timeValue <= 0) {
            setError('Estimated time must be a valid number greater than 0');
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare application data with proper field names matching database schema
            const applicationData = {
                estimated_cost: costValue,
                estimated_time: `${timeValue} ${timeUnit}`,
                proposal_description: proposalDescription.trim()
            };

            // API call to submit the application using the proper endpoint
            const response = await axios.post(
                `/api/issues/${issueId}/apply`,
                applicationData,
                {
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data) {
                // Show success message
                alert('Application submitted successfully!');
                onClose();
                
                // Reset form
                resetForm();
            }
            
        } catch (error) {
            console.error('Error submitting application:', error);
            
            // Handle different error scenarios
            if (error.response) {
                const { status, data } = error.response;
                console.error(status);
                switch (status) {
                    case 400:
                        setError(data.message || 'Invalid application data. Please check your inputs.');
                        break;
                    case 401:
                        setError('Authentication required. Please log in again.');
                        break;
                    case 403:
                        setError('You are not authorized to apply for this job.');
                        break;
                    case 409:
                        setError('You have already applied for this job.');
                        break;
                    case 404:
                        setError('Job not found or no longer available.');
                        break;
                    case 500:
                        setError('Server error. Please try again later.');
                        break;
                    default:
                        setError(data.message || 'An unexpected error occurred. Please try again.');
                }
            } else if (error.request) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setEstimatedCost('');
        setEstimatedTime('');
        setTimeUnit('days');
        setProposalDescription('');
        setError('');
    };

    const handleCancel = () => {
        resetForm();
        onClose();
    };

    const formatCurrency = (value) => {
        const numValue = parseFloat(value);
        return isNaN(numValue) ? '' : numValue.toFixed(2);
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow || 'unset';
            };
        }
    }, [isOpen]);

    // Handle ESC key to close modal
    useEffect(() => {
        if (!isOpen) return;
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                handleCancel();
            }
        };
        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isOpen]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div
            className="apply-job-overlay"
            onClick={(e) => e.target === e.currentTarget && handleCancel()}
            role="dialog"
            aria-modal="true"
            aria-label="Apply for job dialog"
            style={{
                /* keep inline fallbacks minimal in case CSS doesn't load */
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div
                className="apply-job-modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '720px',
                    margin: 0,
                    background: '#fff',
                    borderRadius: '10px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div className="apply-job-header">
                    <h2>Apply for Job</h2>
                    <button 
                        className="apply-job-close-btn" 
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <div className="apply-job-content" style={{ padding: '1rem 1.25rem', overflowY: 'auto' }}>
                    <div className="job-info">
                        <h3>Job: {issueTitle}</h3>
                        <p>Please provide your estimated cost, completion time, and a detailed proposal for this job.</p>
                    </div>

                    {error && (
                        <div className="error-message" style={{
                            color: '#dc3545',
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c6cb',
                            padding: '0.75rem',
                            borderRadius: '0.25rem',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="application-form">
                        <div className="form-group">
                            <label htmlFor="estimatedCost">
                                Estimated Cost (USD) <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="estimatedCost"
                                value={estimatedCost}
                                onChange={(e) => setEstimatedCost(e.target.value)}
                                onBlur={(e) => setEstimatedCost(formatCurrency(e.target.value))}
                                placeholder="Enter your estimated cost"
                                min="0"
                                step="0.01"
                                required
                                disabled={isSubmitting}
                            />
                            <small className="field-help">
                                Provide a competitive and realistic estimate for the work.
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="estimatedTime">
                                Estimated Time <span className="required">*</span>
                            </label>
                            <div className="time-input-group">
                                <input
                                    type="number"
                                    id="estimatedTime"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(e.target.value)}
                                    placeholder="Enter time"
                                    min="0.5"
                                    step="0.5"
                                    required
                                    disabled={isSubmitting}
                                />
                                <select
                                    value={timeUnit}
                                    onChange={(e) => setTimeUnit(e.target.value)}
                                    className="time-unit-select"
                                    disabled={isSubmitting}
                                >
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                    <option value="weeks">Weeks</option>
                                    <option value="months">Months</option>
                                </select>
                            </div>
                            <small className="field-help">
                                Realistic timeframe for completion including any dependencies.
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="proposalDescription">
                                Work Proposal <span className="required">*</span>
                            </label>
                            <textarea
                                id="proposalDescription"
                                value={proposalDescription}
                                onChange={(e) => setProposalDescription(e.target.value)}
                                placeholder="Describe your approach, relevant experience, tools/methods you'll use, timeline breakdown, and why you're the best choice for this job..."
                                rows={6}
                                required
                                disabled={isSubmitting}
                                className="proposal-textarea"
                            />
                            <small className="field-help">
                                Include your experience, methodology, and competitive advantages.
                            </small>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ApplyJobModal;