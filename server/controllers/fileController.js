// server/controllers/fileController.js
const uploadService = require('../services/uploadService');
const path = require('path');

/**
 * File Controller - Handles file operations with Supabase Storage
 * Public buckets: profiles, issue-images
 * Private bucket: proofs (admin access only)
 */
class FileController {

    /**
     * Generic upload handler that uploads to Supabase
     * @param {string} folder - Upload folder type
     * @param {string} message - Success message
     */
    createUploadHandler(folder, message) {
        return async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'No file uploaded' 
                    });
                }

                const userId = req.user?.user_id;
                
                // Upload to Supabase
                const fileUrl = await uploadService.uploadToSupabase(folder, req.file, userId);

                res.json({
                    success: true,
                    message,
                    fileUrl: fileUrl,
                    filename: uploadService.extractFilenameFromUrl(fileUrl) || fileUrl
                });
            } catch (error) {
                console.error('Upload error:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Failed to upload file'
                });
            }
        };
    }

    /**
     * Upload issue image
     */
    uploadIssueImage = this.createUploadHandler('issue_img', 'Issue image uploaded successfully');

    /**
     * Upload profile image (backup route - main one is in auth)
     */
    uploadProfileImage = this.createUploadHandler('profiles', 'Profile picture uploaded successfully');

    /**
     * Upload proof image
     */
    uploadProofImage = this.createUploadHandler('proofs', 'Proof image uploaded successfully');

    /**
     * Serve/fetch image file - for Supabase, this redirects or returns signed URLs
     * PUBLIC buckets: Direct redirect to Supabase URL
     * PRIVATE bucket (proofs): Generate signed URL (admin only)
     */
    getImage = async (req, res) => {
        const { folder, filename } = req.params;
        
        // Validate folder
        if (!uploadService.isValidFolder(folder)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid folder specified'
            });
        }

        try {
            // For proofs (private bucket), check admin access and generate signed URL
            if (folder === 'proofs') {
                // Check if user is admin
                if (!req.user || req.user.user_type !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied. Admin privileges required.'
                    });
                }

                // Generate signed URL (valid for 1 hour)
                const signedUrl = await uploadService.getSignedUrl(filename, 3600);
                
                // Redirect to signed URL
                return res.redirect(signedUrl);
            }

            // For public buckets (profiles, issue_img), build public URL and redirect
            const publicUrl = uploadService.buildFileUrl(folder, filename);
            
            if (!publicUrl) {
                return res.status(404).json({
                    success: false,
                    message: 'Image not found'
                });
            }

            // Redirect to Supabase CDN URL
            res.redirect(publicUrl);
        } catch (error) {
            console.error('Error serving image:', error);
            res.status(500).json({
                success: false,
                message: 'Error serving image'
            });
        }
    };

    /**
     * Get image info/metadata from Supabase
     */
    getImageInfo = async (req, res) => {
        const { folder, filename } = req.params;
        
        if (!uploadService.isValidFolder(folder)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid folder specified'
            });
        }

        try {
            const fileStats = await uploadService.getFileStats(folder, filename);
            
            if (!fileStats) {
                return res.status(404).json({
                    success: false,
                    message: 'Image not found'
                });
            }

            let fileUrl;
            if (folder === 'proofs') {
                // For proofs, check admin access
                if (!req.user || req.user.user_type !== 'admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied. Admin privileges required.'
                    });
                }
                fileUrl = await uploadService.getSignedUrl(filename, 3600);
            } else {
                fileUrl = uploadService.buildFileUrl(folder, filename);
            }

            res.json({
                success: true,
                data: {
                    filename,
                    folder,
                    url: fileUrl,
                    size: fileStats.size,
                    created: fileStats.created_at,
                    mimetype: fileStats.mimetype
                }
            });
        } catch (error) {
            console.error('Error getting image info:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting image information'
            });
        }
    };

    /**
     * Delete image file from Supabase
     */
    deleteImage = async (req, res) => {
        const { folder, filename } = req.params;
        
        if (!uploadService.isValidFolder(folder)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid folder specified'
            });
        }

        try {
            const deleted = await uploadService.deleteFile(folder, filename);
            
            if (deleted) {
                res.json({
                    success: true,
                    message: 'Image deleted successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete image'
                });
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting image'
            });
        }
    };

    /**
     * List images in a Supabase bucket
     */
    listImages = async (req, res) => {
        const { folder } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        // Validate folder using uploadService
        if (!uploadService.isValidFolder(folder)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid folder specified'
            });
        }

        try {
            const offset = (page - 1) * limit;
            const files = await uploadService.listFiles(folder, parseInt(limit), offset);
            
            const imageFiles = files.filter(file => {
                const ext = path.extname(file.name).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            });

            // Build response with URLs
            const images = await Promise.all(imageFiles.map(async file => {
                let url;
                if (folder === 'proofs') {
                    // For proofs, check admin access
                    if (req.user && req.user.user_type === 'admin') {
                        url = await uploadService.getSignedUrl(file.name, 3600);
                    } else {
                        url = null; // No access
                    }
                } else {
                    url = uploadService.buildFileUrl(folder, file.name);
                }

                return {
                    filename: file.name,
                    url: url,
                    size: file.metadata?.size || 0,
                    created_at: file.created_at,
                    updated_at: file.updated_at
                };
            }));

            res.json({
                success: true,
                data: {
                    images,
                    pagination: {
                        current_page: parseInt(page),
                        per_page: parseInt(limit),
                        total_files: imageFiles.length
                    }
                }
            });
        } catch (error) {
            console.error('Error listing images:', error);
            res.status(500).json({
                success: false,
                message: 'Error listing images'
            });
        }
    };

    /**
     * Handle upload errors - delegates to uploadService
     */
    handleUploadError = (error, req, res, next) => {
        return uploadService.handleUploadError(error, res);
    };
}

module.exports = new FileController();