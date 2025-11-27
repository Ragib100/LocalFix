import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/citizen/postIssue.css";

// Assume you have an AuthContext or similar to get the user's token
// import { useAuth } from '../../context/AuthContext'; 

function PostIssue() {
	// const { token } = useAuth(); // Example of getting token from context

	const [formData, setFormData] = useState({
		title: "",
		description: "",
		category: "",
		priority: "medium",
		upazila: "",
		district: "",
		full_address: "",
		image: null,
	});
	const [imagePreview, setImagePreview] = useState(null);
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = React.useRef(null);
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState({});

	// --- Assuming your API server is running on port 5000 ---
	const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api`;


	const categories = [
		"Infrastructure",
		"Public Safety",
		"Environment",
		"Transportation",
		"Utilities",
		"Public Health",
		"Education",
		"Housing",
		"Parks & Recreation",
		"Other"
	];

	const priorities = [
		{ value: "low", label: "Low", color: "#28a745" },
		{ value: "medium", label: "Medium", color: "#ffc107" },
		{ value: "high", label: "High", color: "#fd7e14" },
		{ value: "urgent", label: "Urgent", color: "#dc3545" }
	];

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
		// Clear error when user starts typing
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ""
			}));
		}
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file && file.type.startsWith('image/')) {
			setFormData(prev => ({ ...prev, image: file }));
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setDragActive(true);
	};
	const handleDragLeave = (e) => {
		e.preventDefault();
		setDragActive(false);
	};
	const handleDrop = (e) => {
		e.preventDefault();
		setDragActive(false);
		const file = e.dataTransfer.files[0];
		if (file && file.type.startsWith('image/')) {
			setFormData(prev => ({ ...prev, image: file }));
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const handleRemoveImage = (e) => {
		e.stopPropagation();
		setFormData(prev => ({ ...prev, image: null }));
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.title.trim()) newErrors.title = "Issue title is required";
		if (!formData.description.trim()) newErrors.description = "Issue description is required";
		if (!formData.category) newErrors.category = "Please select a category";
		if (!formData.district.trim()) newErrors.district = "District is required";
		if (!formData.upazila.trim()) newErrors.upazila = "Upazila/Thana is required";
		if (!formData.full_address.trim()) newErrors.full_address = "Full address is required";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleClearForm = () => {
		setFormData({
			title: "",
			description: "",
			category: "",
			priority: "medium",
			upazila: "",
			district: "",
			full_address: "",
			image: null,
		});
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		setErrors({});
		setMessage("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) return;

		setIsSubmitting(true);
		setMessage(""); // Clear previous messages

		try {
			let imageUrl = "";

			// **STEP 1: Upload image if it exists**
			if (formData.image) {
				const imageFormData = new FormData();
				imageFormData.append('image', formData.image);

				try {
					const uploadRes = await axios.post(`${API_BASE_URL}/uploads/issue`, imageFormData);
					if (uploadRes.data.success) {
						imageUrl = uploadRes.data.fileUrl;
					} else {
						throw new Error(uploadRes.data.message || 'Image upload failed');
					}
				} catch (uploadError) {
					setMessage({ type: 'error', text: uploadError.response?.data?.message || "Error uploading image." });
					setIsSubmitting(false);
					return; // Stop submission if image upload fails
				}
			}

			// **STEP 2: Submit issue data (with optional imageUrl)**
			const issueData = {
				title: formData.title,
				description: formData.description,
				category: formData.category,
				priority: formData.priority,
				upazila: formData.upazila,
				district: formData.district,
				full_address: formData.full_address,
				image_url: imageUrl, // FIXED: Changed from 'imageUrl' to 'image_url' to match backend
			};

			const apiHeaders = {
				headers: {
					// 'Authorization': `Bearer ${token}` // Uncomment when AuthContext is integrated
				},
				withCredentials: true // Important for sending cookies if using cookie-based auth
			};

			const res = await axios.post(`${API_BASE_URL}/issues`, issueData, apiHeaders);

			setMessage({ type: 'success', text: res.data.message });
			// Reset form fields completely
			setFormData({
				title: "",
				description: "",
				category: "",
				priority: "medium",
				upazila: "",
				district: "",
				full_address: "",
				image: null,
			});
			setImagePreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			setErrors({});

		} catch (err) {
			setMessage({ type: 'error', text: err.response?.data?.message || "Error submitting issue. Please try again." });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="issue-page">
			{/* Animated Background Elements */}
			<div className="background-shapes">
				<div className="shape shape-1"></div>
				<div className="shape shape-2"></div>
				<div className="shape shape-3"></div>
			</div>

			{/* Sparkle Effects */}
			<div className="sparkles">
				<div className="sparkle sparkle-1">✨</div>
				<div className="sparkle sparkle-2">⭐</div>
				<div className="sparkle sparkle-3">💫</div>
				<div className="sparkle sparkle-4">✨</div>
				<div className="sparkle sparkle-5">⭐</div>
				<div className="sparkle sparkle-6">💫</div>
			</div>

			<div className="issue-container">
				<div className="form-header">
					<h2>Submit Your Issue</h2>
					<p>Please provide detailed information to help us address your concern quickly and effectively.</p>
				</div>

				{message && (
					<div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
						<div className="alert-icon">
							{message.type === 'error' ? '⚠️' : '✅'}
						</div>
						<span>{message.text}</span>
					</div>
				)}

				<form className="issue-form" onSubmit={handleSubmit}>
					{/* Personal Information section has been removed */}

					<div className="form-section">
						<h3>Issue Details</h3>
						<div className="form-row">
							<div className="form-group">
								<label htmlFor="category">Issue Category *</label>
								<select
									id="category"
									name="category"
									value={formData.category}
									onChange={handleInputChange}
									className={errors.category ? 'error' : ''}
									required
								>
									<option value="">Select a category</option>
									{categories.map(cat => (
										<option key={cat} value={cat}>{cat}</option>
									))}
								</select>
								{errors.category && <span className="error-text">{errors.category}</span>}
							</div>

							<div className="form-group">
								<label htmlFor="priority">Priority Level</label>
								<select
									id="priority"
									name="priority"
									value={formData.priority}
									onChange={handleInputChange}
								>
									{priorities.map(p => (
										<option key={p.value} value={p.value}>{p.label}</option>
									))}
								</select>
							</div>
						</div>

						<div className="form-group">
							<label htmlFor="title">Issue Title *</label>
							<input
								id="title"
								type="text"
								name="title"
								placeholder="Brief, descriptive title for your issue"
								value={formData.title}
								onChange={handleInputChange}
								className={errors.title ? 'error' : ''}
								required
							/>
							{errors.title && <span className="error-text">{errors.title}</span>}
						</div>

						<div className="form-row">
							<div className="form-group">
								<label htmlFor="district">District *</label>
								<input
									id="district"
									type="text"
									name="district"
									placeholder="e.g., Dhaka"
									value={formData.district}
									onChange={handleInputChange}
									className={errors.district ? 'error' : ''}
									required
								/>
								{errors.district && <span className="error-text">{errors.district}</span>}
							</div>
							<div className="form-group">
								<label htmlFor="upazila">Upazila / Thana *</label>
								<input
									id="upazila"
									type="text"
									name="upazila"
									placeholder="e.g., Gulshan"
									value={formData.upazila}
									onChange={handleInputChange}
									className={errors.upazila ? 'error' : ''}
									required
								/>
								{errors.upazila && <span className="error-text">{errors.upazila}</span>}
							</div>
						</div>

						<div className="form-group">
							<label htmlFor="full_address">Full Address of Issue *</label>
							<input
								id="full_address"
								type="text"
								name="full_address"
								placeholder="Street address, landmark, or area where issue is located"
								value={formData.full_address}
								onChange={handleInputChange}
								className={errors.full_address ? 'error' : ''}
								required
							/>
							{errors.full_address && <span className="error-text">{errors.full_address}</span>}
						</div>

						<div className="form-group">
							<label htmlFor="description">Detailed Description *</label>
							<textarea
								id="description"
								name="description"
								placeholder="Provide a detailed description of the issue. Include when you first noticed it, how it affects the community, and any other relevant information."
								value={formData.description}
								onChange={handleInputChange}
								className={errors.description ? 'error' : ''}
								required
								rows="6"
							></textarea>
							{errors.description && <span className="error-text">{errors.description}</span>}
							<small className="form-hint">Be as specific as possible to help us understand and resolve the issue</small>
						</div>

						<div className="form-group">
							<label>Upload Image (Optional)</label>
							<div
								className={`image-drop-zone${dragActive ? ' drag-active' : ''}`}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								onClick={() => fileInputRef.current && fileInputRef.current.click()}
								style={{ cursor: 'pointer', marginBottom: '1.5rem', background: '#f1f5f9', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}
							>
								{imagePreview ? (
									<>
										<img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px' }} />
										<button
											type="button"
											className="remove-image-btn"
											onClick={handleRemoveImage}
											style={{ marginTop: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 1.2rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.95rem' }}
										>
											Remove Image
										</button>
									</>
								) : (
									<span style={{ color: '#64748b' }}>
										Drag & drop an image here, or click to select
									</span>
								)}
								<input
									id="image"
									type="file"
									name="image"
									accept="image/*"
									ref={fileInputRef}
									style={{ display: 'none' }}
									onChange={handleFileChange}
								/>
							</div>
							<small className="form-hint">Choose an image that shows the issue</small>
						</div>
					</div>

					<div className="form-buttons">
						<button type="button" className="clear-btn" onClick={handleClearForm}>
							Clear All Fields
						</button>
						<button type="submit" className="submit-btn" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<span className="spinner"></span>
									Submitting...
								</>
							) : (
								'Submit Issue Report'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>

	);
}

export default PostIssue;