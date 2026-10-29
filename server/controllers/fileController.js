// server/controllers/fileController.js
const uploadService = require('../services/uploadService');
const path = require('path');
const { pipeline } = require('node:stream/promises');

/**
 * File Controller - Handles file operations with Neon Object Storage
 */
class FileController {

    /**
     * Generic upload handler - uploads to Neon Object Storage
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

                // Generate filename
                const userId = req.user?.user_id;
                const filename = uploadService.generateFilename(req.file, userId);

                // Upload to Neon Object Storage
                const uploadResult = await uploadService.uploadObject(
                    folder,
                    req.file.buffer,
                    filename,
                    req.file.mimetype
                );

                res.json({
                    success: true,
                    message,
                    fileUrl: uploadResult.publicUrl,
                    filename: uploadResult.filename,
                    bucket: uploadResult.bucket,
                });
            } catch (error) {
                console.error('Upload error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to upload file',
                    error: error.message,
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
     * Validate folder and file existence - reduces code duplication
     * @param {string} folder - Folder name
     * @param {string} filename - File name
     * @param {Object} res - Response object
     * @returns {Promise<boolean>} Whether validation passed
     */
    async validateFileRequest(folder, filename, res) {
        // Validate folder using uploadService
        if (!uploadService.isValidFolder(folder)) {
            res.status(400).json({
                success: false,
                message: 'Invalid folder specified'
            });
            return false;
        }

        // Check if file exists using uploadService
        const exists = await uploadService.fileExists(folder, filename);
        if (!exists) {
            res.status(404).json({
                success: false,
                message: 'Image not found'
            });
            return false;
        }

        return true;
    }

    /** Stream an image through the API using the server's Neon credentials. */
    getImage = async (req, res) => {
        const { folder, filename } = req.params;

        if (!uploadService.isValidFolder(folder)) {
            return res.status(400).json({ success: false, message: 'Invalid folder specified' });
        }

        try {
            const object = await uploadService.downloadFile(folder, filename);
            if (!object.Body) {
                return res.status(404).json({ success: false, message: 'Image not found' });
            }

            res.status(200);
            res.set('Content-Type', object.ContentType || uploadService.getContentType(path.extname(filename)));
            if (object.ContentLength != null) {
                res.set('Content-Length', String(object.ContentLength));
            }
            res.set('Cache-Control', 'public, max-age=3600');
            await pipeline(object.Body, res);
        } catch (error) {
            const status = error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404 ? 404 : 500;
            if (status !== 404) console.error('Error serving image from Neon Object Storage:', error.message);
            if (res.headersSent) return res.destroy(error);
            res.status(status).json({
                success: false,
                message: status === 404 ? 'Image not found' : 'Error serving image',
            });
        }
    };

    /**
     * Get image info/metadata from Neon Object Storage
     */
    getImageInfo = async (req, res) => {
        const { folder, filename } = req.params;
        
        const isValid = await this.validateFileRequest(folder, filename, res);
        if (!isValid) {
            return;
        }

        try {
            const fileStats = await uploadService.getFileStats(folder, filename);
            const fileUrl = uploadService.buildFileUrl(folder, filename);

            res.json({
                success: true,
                data: {
                    filename,
                    folder,
                    url: fileUrl,
                    size: fileStats?.metadata?.size || 0,
                    created: fileStats?.created_at,
                    modified: fileStats?.updated_at,
                    extension: path.extname(filename).toLowerCase()
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
     * Delete image file from Neon Object Storage
     */
    deleteImage = async (req, res) => {
        const { folder, filename } = req.params;
        
        const isValid = await this.validateFileRequest(folder, filename, res);
        if (!isValid) {
            return;
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
     * List images in a Neon Object Storage bucket
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
            const files = await uploadService.listFiles(folder, {
                limit: parseInt(limit),
                offset: parseInt(offset),
            });

            // Filter image files
            const imageFiles = files.filter(file => {
                const ext = path.extname(file.name).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            });

            // Build response with URLs
            const images = imageFiles.map(file => ({
                filename: file.name,
                url: uploadService.buildFileUrl(folder, file.name),
                size: file.metadata?.size || 0,
                created: file.created_at,
                modified: file.updated_at,
            }));

            res.json({
                success: true,
                data: {
                    images,
                    pagination: {
                        current_page: parseInt(page),
                        per_page: parseInt(limit),
                        total_files: imageFiles.length,
                        has_more: imageFiles.length === parseInt(limit),
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
