import React, { useEffect, useState } from "react";
import { useAuth } from '../../context/AuthContext';
import axios from "axios";
import ViewDetailsModal from './view_details';
import ApplyJobModal from '../worker/apply_job';
import AnimatedBackground from '../../components/AnimatedBackground';
import '../../styles/common/IssueList.css';

function IssueList() {
	const [issues, setIssues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [sort_by, setSortBy] = useState('date_desc');
	const [filterByStatus, setFilterByStatus] = useState('all');
	const [showModal, setShowModal] = useState(false);
	const [selectedIssueId, setSelectedIssueId] = useState(null);
	const [showApplyModal, setShowApplyModal] = useState(false);
	const [selectedIssueForApply, setSelectedIssueForApply] = useState(null);
	const { user } = useAuth();
	const user_type = user?.user_type;

	// Define available status options
	const statusOptions = [
		{ value: 'all', label: '📊 All Status' },
		{ value: 'submitted', label: '📝 Open for Applications' },
		{ value: 'applied', label: '📩 Applications Received' },
		{ value: 'assigned', label: '👤 Worker Assigned' },
		{ value: 'in_progress', label: '🔄 Work in Progress' },
		{ value: 'under_review', label: '🔍 Under Review' },
		{ value: 'resolved', label: '✅ Completed' },
		{ value: 'closed', label: '🔒 Closed' }
	];

	useEffect(() => {
		async function fetchIssues() {
			try {
				const res = await axios.get("/api/issues");
				setIssues(res.data.issues);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		}
		fetchIssues();
	}, []);

	const handleViewDetails = (issueId) => {
		setSelectedIssueId(issueId);
		setShowModal(true);
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setSelectedIssueId(null);
	};

	const handleApply = async (issueId) => {
		// Find the issue to get its title
		const issue = issues.find(issue => issue.ID === issueId);
		setSelectedIssueForApply(issue);
		setShowApplyModal(true);
	};

	const handleCloseApplyModal = () => {
		setShowApplyModal(false);
		setSelectedIssueForApply(null);
	};

	// Function to refresh issues after successful application
	const handleApplicationSuccess = () => {
		// Refresh the issues list
		const fetchIssues = async () => {
			try {
				const res = await axios.get("/api/issues");
				setIssues(res.data.issues);
			} catch (err) {
				console.error('Error refreshing issues:', err);
			}
		};
		fetchIssues();
		handleCloseApplyModal();
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

	const getStatusClass = (status) => {
		switch (status?.toLowerCase()) {
			case 'submitted':
				return 'status-submitted';
			case 'applied':
				return 'status-applied';
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
			default:
				return 'status-default';
		}
	};

	const getStatusDisplayText = (status) => {
		const statusMap = {
			'submitted': 'Open for Applications',
			'applied': 'Applications Received',
			'assigned': 'Worker Assigned',
			'in_progress': 'Work in Progress',
			'under_review': 'Under Review',
			'resolved': 'Completed',
			'closed': 'Closed'
		};
		return statusMap[status?.toLowerCase()] || status;
	};

	const truncateText = (text, maxLength = 40) => {
		if (!text) return '';
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength) + '...';
	};

	const handle_sort_by = (a, b) => {
		if (sort_by === 'date_desc') {
			return new Date(b.CREATED_AT) - new Date(a.CREATED_AT);
		} else if (sort_by === 'date_asc') {
			return new Date(a.CREATED_AT) - new Date(b.CREATED_AT);
		} else if (sort_by === 'priority_desc') {
			const prio = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
			return (prio[b.PRIORITY?.toLowerCase()] || 0) - (prio[a.PRIORITY?.toLowerCase()] || 0);
		} else if (sort_by === 'priority_asc') {
			const prio = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
			return (prio[a.PRIORITY?.toLowerCase()] || 0) - (prio[b.PRIORITY?.toLowerCase()] || 0);
		} else if (sort_by === 'status') {
			return a.STATUS.localeCompare(b.STATUS);
		}
		return 0;
	};

	// Helper function to check if worker can apply for an issue
	const canWorkerApply = (issue) => {
		return issue.STATUS?.toLowerCase() === 'submitted';
	};

	// Helper function to check if issue should show apply button
	const shouldShowApplyButton = (issue) => {
		return user_type === 'worker' && canWorkerApply(issue);
	};

	if (loading) {
		return (
			<div className="loading-container">
				Loading issues...
			</div>
		);
	}

	if (issues.length === 0) {
		return (
			<div className="issue-page">
				<div className="container">
					<div className="empty-state">
						<h3>No Issues Found</h3>
						<p>There are currently no issues reported.</p>
					</div>
				</div>
			</div>
		);
	}



	return (
		<AnimatedBackground>
			<div className="issue-page-container">
			<div className="filters-section">
				<div className="filters-header">
					<h2 className="page-title">Issue Management</h2>
					<div className="filters-count">
						<span className="total-count">
							{(() => {
								const filteredCount = issues.filter(issue => 
									filterByStatus === 'all' || issue.STATUS?.toLowerCase() === filterByStatus.toLowerCase()
								).length;
								return filterByStatus === 'all' 
									? `${issues.length} Total Issues`
									: `${filteredCount} of ${issues.length} Issues`;
							})()}
						</span>
					</div>
				</div>
				
				<div className="filters-container">
					<div className="filter-group">
						<label htmlFor="sort_by" className="filter-label">
							<i className="filter-icon">⚡</i>
							Sort By
						</label>
						<select
							name="sort_by"
							id="sort_by"
							value={sort_by}
							onChange={e => setSortBy(e.target.value)}
							className="filter-select"
						>
							<option value="date_desc">📅 Newest First</option>
							<option value="date_asc">📅 Oldest First</option>
							<option value="priority_desc">🔥 High Priority First</option>
							<option value="priority_asc">❄️ Low Priority First</option>
							<option value="status">📊 By Status</option>
						</select>
					</div>

					<div className="filter-group">
						<label htmlFor="filter_status" className="filter-label">
							<i className="filter-icon">🔍</i>
							Filter by Status
						</label>
						<select
							name="filter_status"
							id="filter_status"
							value={filterByStatus}
							onChange={e => setFilterByStatus(e.target.value)}
							className="filter-select"
							style={{ minWidth: '250px' }}
						>
							{statusOptions.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div className="filter-actions">
						<button 
							className="clear-filters-btn"
							onClick={() => {
								setSortBy('date_desc');
								setFilterByStatus('all');
							}}
							title="Reset all filters"
						>
							🔄 Reset
						</button>
					</div>
				</div>
			</div>

			<div className="issue-scrollpane">
				<div className="issues-grid">
					{(() => {
						const filteredIssues = issues
							.slice()
							.filter(issue => filterByStatus === 'all' || issue.STATUS?.toLowerCase() === filterByStatus.toLowerCase());

						if (filteredIssues.length === 0) {
							return (
								<div className="empty-state" style={{gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px'}}>
									<h3>No Issues Found</h3>
									<p>
										{filterByStatus === 'all' 
											? 'There are currently no issues reported.' 
											: 'No issues match the selected status filter. Try changing the filter or reset to view all issues.'
										}
									</p>
								</div>
							);
						}

						return filteredIssues
							.sort((a, b) => handle_sort_by(a, b))
							.map(issue => (
							<div className="issue-card" key={issue.ID}>
								<div className={`card-header ${getStatusClass(issue.STATUS)}`}>
									<h3 className="card-title">{issue.TITLE}</h3>
									<div className="card-badges">
										<span className="job-id">#{issue.ID}</span>
										<span className={`priority ${getPriorityClass(issue.PRIORITY)}`}>
											{issue.PRIORITY?.toUpperCase() || 'MEDIUM'}
										</span>
									</div>
								</div>

								<div className="card-body">
									<div className="info-row">
										<div className="info-item">
											<span className="label">Location</span>
											<span className="value">{issue.LOCATION}</span>
										</div>
									</div>

									<div className="info-row">
										<div className="info-item">
											<span className="label">Category</span>
											<span className="value">{issue.CATEGORY}</span>
										</div>
									</div>

									{issue.DESCRIPTION && (
										<div className="info-row">
											<div className="info-item">
												<span className="label">Description</span>
												<span className="value">{truncateText(issue.DESCRIPTION)}</span>
											</div>
										</div>
									)}

									<div className="info-row">
										<div className="info-item">
											<span className="label">Status</span>
											<span className={`value status-text ${getStatusClass(issue.STATUS)}`}>
												{getStatusDisplayText(issue.STATUS)}
											</span>
										</div>
									</div>

									{/* Show assigned worker info if available */}
									{issue.ASSIGNED_WORKER_ID && issue.ASSIGNED_WORKER_NAME && (
										<div className="info-row">
											<div className="info-item">
												<span className="label">Assigned Worker</span>
												<span className="value">{issue.ASSIGNED_WORKER_NAME}</span>
											</div>
										</div>
									)}

									{/* Show citizen info for all users */}
									{issue.CITIZEN_NAME && (
										<div className="info-row">
											<div className="info-item">
												<span className="label">Reported by</span>
												<span className="value">{issue.CITIZEN_NAME}</span>
											</div>
										</div>
									)}

									<div className="created-date">
										<span className="date-label">
											{['resolved', 'closed'].includes(issue.STATUS?.toLowerCase()) ? 'Completed' : 'Posted'}
										</span>
										<span className="date-value">
											{new Date(issue.CREATED_AT).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
												hour: '2-digit',
												minute: '2-digit'
											})}
										</span>
									</div>
								</div>

								<div className="card-footer">
									<button
										className="btn-details"
										onClick={() => handleViewDetails(issue.ID)}
									>
										View Details
									</button>

									{/* Only show apply button for workers on submitted issues */}
									{shouldShowApplyButton(issue) && (
										<button 
											className="btn-apply" 
											onClick={() => handleApply(issue.ID)}
											title="Apply for this job"
										>
											Apply
										</button>
									)}

									{/* Show status info for workers on non-applicable issues */}
									{user_type === 'worker' && !canWorkerApply(issue) && issue.STATUS?.toLowerCase() === 'applied' && (
										<span className="apply-status">
											Applications being reviewed
										</span>
									)}

									{user_type === 'worker' && !canWorkerApply(issue) && ['assigned', 'in_progress'].includes(issue.STATUS?.toLowerCase()) && (
										<span className="apply-status">
											Job assigned to worker
										</span>
									)}
								</div>
							</div>
						));
					})()}
				</div>
			</div>

			{/* View Details Modal */}
			<ViewDetailsModal 
				isOpen={showModal}
				onClose={handleCloseModal}
				issueId={selectedIssueId}
			/>

			{/* Apply Job Modal */}
			<ApplyJobModal
				isOpen={showApplyModal}
				onClose={handleCloseApplyModal}
				onSuccess={handleApplicationSuccess}
				issueId={selectedIssueForApply?.ID}
				issueTitle={selectedIssueForApply?.TITLE}
			/>
			</div>
		</AnimatedBackground>
	);
}

export default IssueList;