import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import Change_password from '../auth/change_password';
import '../../styles/common/profile.css';

function Profile() {
    const { user, refreshUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const fileInputRef = useRef(null);
    const [show_popup, set_show_popup] = useState(false);
    
    // Initialize profile data from AuthContext user or with defaults
    const [profileData, setProfileData] = useState({
        userId: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        userType: '',
        status: 'Active',
        imgUrl: ''
    });

    // Original data to revert changes on cancel
    const [originalData, setOriginalData] = useState({});

    // Helper function to get the correct image URL - Fixed for upload routes
    // Fixed getImageUrl function for profile.jsx
const getImageUrl = (imgUrl) => {
    if (!imgUrl) return '';
    
    // If it's already a full URL, use it as is
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
        return imgUrl;
    }
    
    // Get the server URL - make sure this matches your backend
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    
    // Extract filename from path if it contains directory separators
    const filename = imgUrl.includes('/') ? imgUrl.split('/').pop() : imgUrl;
    
    // Use the API endpoint that matches your uploadRoutes.js structure
    // This corresponds to: router.get('/image/:folder/:filename', fileController.getImage);
    const apiUrl = `${serverUrl}/api/uploads/image/profiles/${filename}`;
    
    console.log('Image URL construction:', {
        original: imgUrl,
        filename: filename,
        constructed: apiUrl
    });
    
    return apiUrl;
};

    // Update profile data when user changes (from AuthContext)
    useEffect(() => {
        if (user) {
            const userData = {
                userId: user.user_id || '',
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                password: '', // Never populate password field
                userType: user.user_type || '',
                status: user.status || 'Active',
                imgUrl: user.img_url || ''
            };
            setProfileData(userData);
            setOriginalData(userData);
        }
    }, [user]);

    // Fetch fresh profile data from API
    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // The authToken cookie will be automatically included
            const response = await axios.get('/api/auth/profile');
            
            if (response.data.success) {
                const userData = response.data.user;
                const formattedData = {
                    userId: userData.user_id || '',
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    address: userData.address || '',
                    password: '', // Never populate password field
                    userType: userData.user_type || '',
                    status: userData.status || 'Active',
                    imgUrl: userData.img_url || ''
                };
                
                setProfileData(formattedData);
                setOriginalData(formattedData);
            } else {
                setError('Failed to fetch profile data');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError(error.response?.data?.message || 'Failed to fetch profile data');
        } finally {
            setLoading(false);
        }
    };

    // Handle profile image upload
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        try {
            setImageUploading(true);
            setError(null);
            setSuccess(null);

            const formData = new FormData();
            formData.append('image', file);

            const response = await axios.post('/api/auth/profile/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setSuccess('Profile picture updated successfully');
                // Update the profile data with the new image URL
                setProfileData(prev => ({ 
                    ...prev, 
                    imgUrl: response.data.user.img_url || response.data.fileUrl 
                }));
                await refreshUser();
            } else {
                setError(response.data.message || 'Failed to upload image');
            }
        } catch (error) {
            console.error('Image upload error:', error);
            setError(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setImageUploading(false);
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Handle profile image removal
    const handleImageRemove = async () => {
        if (!profileData.imgUrl) return;

        if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

        try {
            setImageUploading(true);
            setError(null);
            setSuccess(null);

            const response = await axios.delete('/api/auth/profile/image');

            if (response.data.success) {
                setSuccess('Profile picture removed successfully');
                setProfileData(prev => ({ ...prev, imgUrl: '' }));
                await refreshUser();
            } else {
                setError(response.data.message || 'Failed to remove image');
            }
        } catch (error) {
            console.error('Image removal error:', error);
            setError(error.response?.data?.message || 'Failed to remove image');
        } finally {
            setImageUploading(false);
        }
    };

    // Update profile data on the server
    const updateProfile = async (updatedData) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Prepare data for API (exclude password if empty, include only changed fields)
            const updatePayload = {
                name: updatedData.name,
                phone: updatedData.phone,
                address: updatedData.address,
            };

            // Only include password if it's been changed
            if (updatedData.password && updatedData.password.trim() !== '') {
                updatePayload.password = updatedData.password;
            }

            const response = await axios.put('/api/auth/profile', updatePayload);
            
            if (response.data.success) {
                setSuccess('Profile updated successfully');
                
                // Update local state with returned data
                const userData = response.data.user;
                setProfileData(prev => ({
                    ...prev,
                    name: userData.name,
                    phone: userData.phone,
                    address: userData.address,
                    password: '', // Clear password field
                    imgUrl: userData.img_url || prev.imgUrl
                }));
                
                // Refresh the user data in AuthContext
                await refreshUser();
                
                return { success: true };
            } else {
                setError(response.data.message || 'Failed to update profile');
                return { success: false };
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update profile';
            setError(errorMessage);
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear messages when user starts editing
        if (error) setError(null);
        if (success) setSuccess(null);
    };

    const handleSave = async () => {
        const result = await updateProfile(profileData);
        if (result.success) {
            setIsEditing(false);
            setOriginalData({ ...profileData, password: '' });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setProfileData(originalData);
        setError(null);
        setSuccess(null);
    };

    const handleRefresh = () => {
        fetchProfile();
    };

    const handle_delete_account = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await axios.delete('/api/auth/delete');
            if (response.data.success) {
                setSuccess('Account deleted successfully. You will be logged out.');
                // Optionally, redirect or clear user context after short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to delete account');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to delete account');
        } finally {
            setLoading(false);
        }
    }

    // Show loading spinner if initial load or if no user data
    if (loading && !user) {
        return (
            <div className="profile-container">
                <div className="loading-spinner">
                    <i className="bx bx-loader-alt bx-spin"></i>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    // Get the correct image URL for display - FIXED
    const displayImageUrl = getImageUrl(profileData.imgUrl);

    return (
        <>
            <div className="profile-container">
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
                    <div className="sparkle sparkle-3">✨</div>
                </div>
                
                <div className="wave-animation">
                    <svg className="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="shape-fill"></path>
                        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="shape-fill"></path>
                        <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="shape-fill"></path>
                    </svg>
                </div>

                {/* Hero Section */}
                <div className="profile-hero">
                    <div className="hero-background">
                        <div className="hero-overlay"></div>
                        <div className="hero-pattern"></div>
                    </div>
                    <div className="hero-content">
                        <div className="profile-avatar-section">
                            <div className="avatar-container">
                                {/* FIXED: Simplified avatar display logic */}
                                {displayImageUrl ? (
                                    <img 
                                        src={displayImageUrl} 
                                        alt="Profile" 
                                        className="avatar-image"
                                        onError={(e) => {
                                            console.error('Image failed to load:', displayImageUrl);
                                            e.target.style.display = 'none';
                                            const placeholder = e.target.parentNode.querySelector('.avatar-placeholder');
                                            if (placeholder) {
                                                placeholder.style.display = 'flex';
                                            }
                                        }}
                                        onLoad={() => {
                                            console.log('Image loaded successfully:', displayImageUrl);
                                        }}
                                    />
                                ) : null}
                                
                                {/* Show placeholder when no image or image fails to load */}
                                <div 
                                    className="avatar-placeholder" 
                                    style={{ display: displayImageUrl ? 'none' : 'flex' }}
                                >
                                    <i className="bx bx-user"></i>
                                </div>
                                
                                <div className="avatar-ring"></div>
                                
                                {/* Avatar Upload Controls */}
                                <div className="avatar-controls">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        className="avatar-upload-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={imageUploading}
                                        title="Upload profile picture"
                                    >
                                        <i className={`bx ${imageUploading ? 'bx-loader-alt bx-spin' : 'bx-camera'}`}></i>
                                    </button>
                                    {displayImageUrl && (
                                        <button
                                            className="avatar-remove-btn"
                                            onClick={handleImageRemove}
                                            disabled={imageUploading}
                                            title="Remove profile picture"
                                        >
                                            <i className="bx bx-trash"></i>
                                        </button>
                                    )}
                                </div>
                                
                                <div className="status-badge">
                                    <span className={`status ${profileData.status.toLowerCase()}`}>
                                        <i className="bx bx-check-circle"></i>
                                        {profileData.status}
                                    </span>
                                </div>
                            </div>
                            <div className="user-info">
                                <h1 className="user-name">{profileData.name || 'User Name'}</h1>
                                <p className="user-type">{
                                    profileData.userType === "admin" ? "Administrator" :
                                    profileData.userType === "citizen" ? "Citizen" : 
                                    profileData.userType === "worker" ? "Worker" : "User"
                                }</p>
                                <p className="user-id">ID: {profileData.userId}</p>
                            </div>
                        </div>
                        <div className="profile-actions">
                            {!isEditing ? (
                                <button 
                                    className="edit-btn modern-btn"
                                    onClick={() => setIsEditing(true)}
                                    disabled={loading}
                                >
                                    <i className="bx bx-edit"></i>
                                    <span>Edit Profile</span>
                                </button>
                            ) : (
                                <div className="edit-actions">
                                    <button 
                                        className="save-btn modern-btn"
                                        onClick={handleSave}
                                        disabled={loading}
                                    >
                                        <i className={`bx ${loading ? 'bx-loader-alt bx-spin' : 'bx-save'}`}></i>
                                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                                    </button>
                                    <button 
                                        className="cancel-btn modern-btn"
                                        onClick={handleCancel}
                                        disabled={loading}
                                    >
                                        <i className="bx bx-x"></i>
                                        <span>Cancel</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="alert alert-error">
                        <div className="alert-icon">
                            <i className="bx bx-error-circle"></i>
                        </div>
                        <div className="alert-content">
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        <div className="alert-icon">
                            <i className="bx bx-check-circle"></i>
                        </div>
                        <div className="alert-content">
                            <span>{success}</span>
                        </div>
                    </div>
                )}

                {/* Profile Content */}
                <div className="profile-content">
                    <div className="content-grid">
                        {/* Personal Information Card */}
                        <div className="info-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    <i className="bx bx-user-circle"></i>
                                </div>
                                <h3>Personal Information</h3>
                            </div>
                            <div className="card-content">
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label htmlFor="name">
                                            <i className="bx bx-user"></i>
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={profileData.name}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className={`modern-input ${!isEditing ? 'disabled' : ''}`}
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="email">
                                            <i className="bx bx-envelope"></i>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={profileData.email}
                                            disabled={true}
                                            className="modern-input disabled"
                                            placeholder="Enter your email"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="phone">
                                            <i className="bx bx-phone"></i>
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={profileData.phone}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className={`modern-input ${!isEditing ? 'disabled' : ''}`}
                                            placeholder="Enter your phone number"
                                        />
                                    </div>

                                    <div className="input-group full-width">
                                        <label htmlFor="address">
                                            <i className="bx bx-map"></i>
                                            Address
                                        </label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            value={profileData.address}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className={`modern-input textarea ${!isEditing ? 'disabled' : ''}`}
                                            placeholder="Enter your address"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Security Card */}
                        <div className="info-card">
                            <div className="card-header">
                                <div className="card-icon security">
                                    <i className="bx bx-shield-check"></i>
                                </div>
                                <h3>Account Security</h3>
                            </div>
                            <div className="card-content">
                                <div className="security-actions">
                                    <div className="security-item">
                                        <div className="security-info">
                                            <i className="bx bx-key"></i>
                                            <div>
                                                <h4>Change Password</h4>
                                                <p>Update your password to keep your account secure</p>
                                            </div>
                                        </div>
                                        <button
                                            className='security-btn change-password'
                                            onClick={() => set_show_popup(true)}
                                            disabled={loading}
                                        >
                                            <i className="bx bx-key"></i>
                                            Change
                                        </button>
                                    </div>

                                    <div className="security-item danger">
                                        <div className="security-info">
                                            <i className="bx bx-trash"></i>
                                            <div>
                                                <h4>Delete Account</h4>
                                                <p>Permanently delete your account and all data</p>
                                            </div>
                                        </div>
                                        <button
                                            className='security-btn delete-account'
                                            onClick={handle_delete_account}
                                            disabled={loading}
                                        >
                                            <i className="bx bx-trash"></i>
                                            {loading ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {show_popup && (
                <Change_password
                    email={profileData.email}
                    set_pop_up={set_show_popup}
                />
            )}
        </>
    );
}

export default Profile;