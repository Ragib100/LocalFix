import React, { useState, useRef } from 'react';
import '../../../styles/worker/submitProof.css';
import axios from "axios";

const Submit_proof = ({ isOpen, onClose, onSubmitSuccess, issueId }) => {
	const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
	const [dragActive, setDragActive] = useState(false);
	const [comment, setComment] = useState("");
	const [fadeOut, setFadeOut] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
	const fileInputRef = useRef(null);

	const handleClose = () => {
		setFadeOut(true);
		setTimeout(() => {
			setFadeOut(false);
            // Reset state on close
            setImageFile(null);
            setImagePreview(null);
            setComment('');
            setError(null);
			onClose();
		}, 300);
	};

    const handleFileChange = (file) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
	const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
	const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };
	const handleDrop = (e) => {
		e.preventDefault();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
	};
    
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile) {
            setError("An image proof is required.");
            return;
        }

        setSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('comment', comment);
        formData.append('issueId', issueId);
        
        try {
            await axios.post('http://localhost:5000/api/proofs', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onSubmitSuccess(); // Call success callback from parent
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit proof.');
            console.error("Proof submission error:", err);
        } finally {
            setSubmitting(false);
        }
    };

	if (!isOpen && !fadeOut) return null;

	return (
		<div className="modal-overlay">
			<div className={`modal-content${fadeOut ? ' fade-out' : ''}`}>
				<h2>Submit Proof</h2>
				<form onSubmit={handleFormSubmit}>
					<label>Upload Image Proof:</label>
					<div
						className={`image-drop-zone${dragActive ? ' drag-active' : ''}`}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current.click()}
					>
						{imagePreview ? (
							<>
								<img src={imagePreview} alt="Preview" className="image-preview" />
								<button
									type="button"
									className="remove-image-btn"
									onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
								>
									Remove Image
								</button>
							</>
						) : (
							<span className="drop-zone-prompt">
								Drag & drop an image here, or click to select
							</span>
						)}
						<input
							type="file"
							accept="image/*"
							ref={fileInputRef}
							style={{ display: 'none' }}
							onChange={(e) => handleFileChange(e.target.files[0])}
						/>
					</div>

					<label htmlFor="comment">Comment (optional):</label>
					<textarea
						id="comment"
						name="comment"
						rows={3}
						placeholder="Add any comments about the completed work..."
						value={comment}
						onChange={e => setComment(e.target.value)}
					/>

                    {error && <p className="error-text">{error}</p>}

					<div className="modal-actions">
						<button type="submit" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Proof'}
                        </button>
						<button type="button" onClick={handleClose} disabled={submitting}>Cancel</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Submit_proof;