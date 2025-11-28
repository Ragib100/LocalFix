// client/src/utils/imageUtils.js

/**
 * Build the correct image URL for display
 * Handles both legacy local storage URLs and Supabase URLs
 * @param {string} imageUrl - The image URL from database
 * @param {string} defaultFolder - Default folder if not specified (default: 'issue_img')
 * @returns {string|null} Full URL for the image
 */
export const buildImageUrl = (imageUrl, defaultFolder = 'issue_img') => {
    if (!imageUrl) return null;
    
    // If it's already a full URL (Supabase or external), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    
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
    
    // If it's just a filename, use the default folder
    if (!imageUrl.includes('/')) {
        return `${API_BASE_URL}/api/uploads/image/${defaultFolder}/${imageUrl}`;
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

/**
 * Build profile image URL
 * @param {string} imgUrl - Profile image URL from database
 * @returns {string|null} Full URL for the profile image
 */
export const buildProfileImageUrl = (imgUrl) => {
    return buildImageUrl(imgUrl, 'profiles');
};

/**
 * Build issue image URL
 * @param {string} imgUrl - Issue image URL from database
 * @returns {string|null} Full URL for the issue image
 */
export const buildIssueImageUrl = (imgUrl) => {
    return buildImageUrl(imgUrl, 'issue_img');
};

/**
 * Build proof image URL
 * @param {string} imgUrl - Proof image URL from database
 * @returns {string|null} Full URL for the proof image
 */
export const buildProofImageUrl = (imgUrl) => {
    return buildImageUrl(imgUrl, 'proofs');
};

/**
 * Get a placeholder image data URL
 * @returns {string} Base64 encoded placeholder image
 */
export const getPlaceholderImage = () => {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA2NUgxMTVWOTVIODVWNjVaIiBmaWxsPSIjRDVEOURGIi8+CjxwYXRoIGQ9Ik05MCA3MEgxMTBWOTBIOTBWNzBaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPgo=";
};

/**
 * Handle image load error by setting placeholder
 * @param {Event} e - The error event
 */
export const handleImageError = (e) => {
    e.target.src = getPlaceholderImage();
};
