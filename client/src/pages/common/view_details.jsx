import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import '../../styles/common/view_details.css';

const ViewDetailsModal = ({ isOpen, onClose, issueId }) => {
	const [issue, setIssue] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [mapboxToken, setMapboxToken] = useState(null);
	const [imageError, setImageError] = useState(false);

	// Define API_BASE_URL
	const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

	useEffect(() => {
		if (isOpen && issueId) {
			// Reset state for new issue view
			setIssue(null);
			setImageError(false);
			fetchIssueDetails();
			fetchMapboxToken();
		}
	}, [isOpen, issueId]);

	// Ensure image error resets when the actual image URL changes
	useEffect(() => {
		if (!isOpen) return;
		setImageError(false);
	}, [issue?.IMAGE_URL, isOpen]);

	const fetchMapboxToken = async () => {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/config/mapbox-token`);
			setMapboxToken(response.data.token);
		} catch (err) {
			console.error('Error fetching Mapbox token:', err);
		}
	};

	const fetchIssueDetails = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await axios.get(`${API_BASE_URL}/api/issues/${issueId}`);
			setIssue(response.data.issue);
		} catch (err) {
			setError('Failed to fetch issue details');
			console.error('Error fetching issue details:', err);
		} finally {
			setLoading(false);
		}
	};

	const getStatusDisplayText = (status) => {
		const statusMap = {
			'submitted': 'Open for Applications',
			'applied': 'Applications Received',
			'accepted': 'Accepted',
			'assigned': 'Worker Assigned',
			'in_progress': 'Work in Progress',
			'under_review': 'Under Review',
			'resolved': 'Completed',
			'closed': 'Closed',
			'rejected': 'Rejected'
		};
		return statusMap[status?.toLowerCase()] || status;
	};

	const getStatusClass = (status) => {
		switch (status?.toLowerCase()) {
			case 'submitted':
				return 'status-submitted';
			case 'applied':
				return 'status-applied';
			case 'accepted':
				return 'status-accepted';
			case 'assigned':
				return 'status-assigned';
			case 'in_progress':
				return 'status-in-progress';
			case 'under_review':
				return 'status-under-review';
			case 'resolved':
				return 'status-resolved';
			case 'closed':
				return 'status-closed';
			case 'rejected':
				return 'status-rejected';
			default:
				return 'status-default';
		}
	};

	/**
	 * Build the correct image URL using the API endpoint
	 * @param {string} imageUrl - The image URL from database (could be filename or path)
	 * @returns {string} Full API URL for the image
	 */
	const buildImageUrl = (imageUrl) => {
		if (!imageUrl) return null;
		
		// If it's already a full URL, return as is
		if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
			return imageUrl;
		}
		
		// If it starts with /api/uploads, it's already the API path
		if (imageUrl.startsWith('/api/uploads/image/')) {
			return `${API_BASE_URL}${imageUrl}`;
		}
		
		// If it's a legacy path like /uploads/issue_img/filename.jpg
		if (imageUrl.startsWith('/uploads/')) {
			const pathParts = imageUrl.split('/');
			if (pathParts.length >= 4) {
				const folder = pathParts[2]; // issue_img, profiles, proofs
				const filename = pathParts[3]; // actual filename
				return `${API_BASE_URL}/api/uploads/image/${folder}/${filename}`;
			}
		}
		
		// If it's just a filename, assume it's in issue_img folder
		if (!imageUrl.includes('/')) {
			return `${API_BASE_URL}/api/uploads/image/issue_img/${imageUrl}`;
		}
		
		// Fallback: assume it's a path that needs to be converted to API format
		const pathParts = imageUrl.replace(/^\//, '').split('/');
		if (pathParts.length >= 2) {
			const folder = pathParts[pathParts.length - 2];
			const filename = pathParts[pathParts.length - 1];
			return `${API_BASE_URL}/api/uploads/image/${folder}/${filename}`;
		}
		
		return null;
	};

	const getPriorityClass = (priority) => {
		switch (priority?.toLowerCase()) {
			case 'urgent':
				return 'priority-urgent';
			case 'high':
				return 'priority-high';
			case 'medium':
				return 'priority-medium';
			case 'low':
				return 'priority-low';
			default:
				return 'priority-medium';
		}
	};

	// Function to get Mapbox static image URL
	const getMapboxEmbedUrl = (latitude, longitude) => {
		const lat = latitude || 23.8103; // Sample Dhaka coordinates
		const lng = longitude || 90.4125;
		const token = mapboxToken || 'pk.eyJ1IjoicmFnaWIxMDAiLCJhIjoiY205NzJ3bWV2MDNobDJqc2FubWxobThoMSJ9.n27eOtL6u0B5FmaIGhP_MA'; // fallback
		return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-marker+ff0000(${lng},${lat})/${lng},${lat},14/600x400?access_token=${token}`;
	};

	const handleMapClick = (latitude, longitude) => {
		// Open Mapbox in 3D view
		const lat = latitude || 23.8103;
		const lng = longitude || 90.4125;
		const mapboxUrl = `https://www.mapbox.com/map-feedback/#/${lng}/${lat}/15`;
		window.open(mapboxUrl, '_blank');
	};

	const handleImageError = () => {
		setImageError(true);
	};

	const handleImageLoad = () => {
		setImageError(false);
	};

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		// Cleanup on unmount
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	// Handle ESC key to close modal
	useEffect(() => {
		const handleEscKey = (event) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscKey);
		}

		return () => {
			document.removeEventListener('keydown', handleEscKey);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	// Render the modal at the document.body level to ensure it overlays the whole page
	return ReactDOM.createPortal(
		<div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Issue details dialog">
			<div className="modal-container" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2 className="modal-title">Issue Details</h2>
					<button className="modal-close" onClick={onClose} aria-label="Close modal">
						&times;
					</button>
				</div>

				<div className="modal-body">
					{loading && (
						<div className="loading-state">
							<div className="loading-spinner"></div>
							<p>Loading issue details...</p>
						</div>
					)}

					{error && (
						<div className="error-state">
							<p>{error}</p>
							<button onClick={fetchIssueDetails} className="retry-btn">
								Try Again
							</button>
						</div>
					)}

					{issue && !loading && (
						<div className="issue-details">
							<div className="detail-section">
								<div className="section-header">
									<h3>Basic Information</h3>
								</div>
								<div className="detail-grid">
									<div className="detail-item">
										<span className="detail-label">Issue ID:</span>
										<span className="detail-value">#{issue.ID}</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Title:</span>
										<span className="detail-value">{issue.TITLE}</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Category:</span>
										<span className="detail-value">{issue.CATEGORY}</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Priority:</span>
										<span className="detail-value">
											{issue.PRIORITY?.toUpperCase()}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Status:</span>
										<span className="detail-value">
											{getStatusDisplayText(issue.STATUS)}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Posted Date:</span>
										<span className="detail-value">
											{new Date(issue.CREATED_AT).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'long',
												day: 'numeric',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</span>
									</div>
								</div>
							</div>

							<div className="detail-section">
								<div className="section-header">
									<h3>Description</h3>
								</div>
								<div className="description-content">
									<p>{issue.DESCRIPTION || 'No description provided.'}</p>
								</div>
							</div>

							<div className="detail-section">
								<div className="section-header">
									<h3>Location Information</h3>
								</div>
								<div className="location-details">
									<div className="detail-item">
										<span className="detail-label">Address:</span>
										<span className="detail-value">{issue.LOCATION || 'Not specified'}</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Upazila:</span>
										<span className="detail-value">{issue.UPAZILA || 'Not specified'}</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">District:</span>
										<span className="detail-value">{issue.DISTRICT || 'Not specified'}</span>
									</div>
								</div>

								{/* Map Section */}
								<div className="map-section">
									<h4>Location Map (Click for 3D Navigation)</h4>
									<div className="map-container" 
										 onClick={() => handleMapClick(issue.LATITUDE, issue.LONGITUDE)}
										 style={{ cursor: 'pointer' }}
										 title="Click to open 3D navigation in Mapbox">
										<img 
											src={getMapboxEmbedUrl(issue.LATITUDE, issue.LONGITUDE)}
											alt="Issue Location Map"
											className="location-map"
											onError={(e) => {
												e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yODUgMTc1SDE1NVYyMjVIMjg1VjE3NVoiIGZpbGw9IiNENUQ5REYiLz4KPHBhdGggZD0iTTMxNSAxNzVIMjg1VjIyNUgzMTVWMTc1WiIgZmlsbD0iI0Q1RDlERiIvPgo8cGF0aCBkPSJNMzQ1IDE3NUgzMTVWMjI1SDM0NVYxNzVaIiBmaWxsPSIjRDVEOURGIi8+CjxwYXRoIGQ9Ik0zNzUgMTc1SDM0NVYyMjVIMzc1VjE3NVoiIGZpbGw9IiNENUQ5REYiLz4KPHRleHQgeD0iMzAwIiB5PSIyNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TWFwIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPgo=";
											}}
										/>
										<div className="map-overlay">
											<div className="navigation-hint">
												<span className="navigation-icon">🗺️</span>
												<span>Click for 3D Navigation</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Citizen Information */}
							{issue.CITIZEN_NAME && (
								<div className="detail-section">
									<div className="section-header">
										<h3>Posted By</h3>
									</div>
									<div className="citizen-info">
										<div className="detail-item">
											<span className="detail-label">Name:</span>
											<span className="detail-value">{issue.CITIZEN_NAME}</span>
										</div>
										{issue.CITIZEN_EMAIL && (
											<div className="detail-item">
												<span className="detail-label">Email:</span>
												<span className="detail-value">{issue.CITIZEN_EMAIL}</span>
											</div>
										)}
										{issue.CITIZEN_PHONE && (
											<div className="detail-item">
												<span className="detail-label">Phone:</span>
												<span className="detail-value">{issue.CITIZEN_PHONE}</span>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Image Section */}
							{issue.IMAGE_URL && (
								<div className="detail-section">
									<div className="section-header">
										<h3>Issue Image</h3>
									</div>
									<div className="image-container">
										{!imageError ? (
											<img 
												key={`${issue.ID}-${issue.IMAGE_URL}`}
												src={buildImageUrl(issue.IMAGE_URL)}
												alt="Issue"
												className="issue-image"
												onError={handleImageError}
												onLoad={handleImageLoad}
												loading="lazy"
												crossOrigin="anonymous"
											/>
										) : (
											<div className="image-error-placeholder">
												<div className="error-icon">📷</div>
												<p>Image could not be loaded</p>
												<small>Path: {issue.IMAGE_URL}</small>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				<div className="modal-footer">
					<button className="btn-secondary" onClick={onClose}>
						Close
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
};

export default ViewDetailsModal;