// server/services/uploadService.js
const multer = require('multer');
const path = require('path');
const { supabase, getBucketName } = require('../config/supabase');

/**
 * Upload Service - Handles all file upload operations using Supabase Storage
 * Migrated from local file storage to Supabase cloud storage
 */
class UploadService {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.allowedImageTypes = /jpeg|jpg|png|gif|webp/;
        this.allowedFolders = ['profiles', 'issue_img', 'proofs'];
        this.maxFileSize = {
            profiles: 5 * 1024 * 1024,   // 5MB for profiles
            issue_img: 10 * 1024 * 1024, // 10MB for issues
            proofs: 10 * 1024 * 1024,    // 10MB for proofs
        };
    }

    /**
     * Create multer memory storage for Supabase uploads
     * Files are stored in memory temporarily before uploading to Supabase
     * @returns {multer.StorageEngine}
     */
    createStorage() {
        return multer.memoryStorage();
    }

    /**
     * Create multer upload configuration for Supabase
     * @param {string} folderName - Folder name for uploads (profiles, issue_img, proofs)
     * @param {number} fileSizeLimit - File size limit in bytes
     * @returns {multer.Multer}
     */
    createUploadConfig(folderName, fileSizeLimit = null) {
        const sizeLimit = fileSizeLimit || this.maxFileSize[folderName] || 10 * 1024 * 1024;
        
        return multer({
            storage: this.createStorage(),
            limits: {
                fileSize: sizeLimit,
            },
            fileFilter: this.imageFileFilter.bind(this),
        });
    }

    /**
     * File filter for image files only
     * @param {Object} req - Express request object
     * @param {Object} file - Multer file object
     * @param {Function} cb - Callback function
     */
    imageFileFilter(req, file, cb) {
        const extname = this.allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = this.allowedImageTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
        }
    }

    /**
     * Generate unique filename for upload
     * @param {Object} file - Multer file object
     * @param {number} userId - User ID for the file
     * @param {string} prefix - Optional prefix for filename
     * @returns {string} Generated filename
     */
    generateFilename(file, userId = null, prefix = '') {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const prefixStr = prefix ? `${prefix}-` : '';
        const userStr = userId ? `${userId}-` : '';
        const ext = path.extname(file.originalname);
        return `${prefixStr}${userStr}${uniqueSuffix}${ext}`;
    }

    /**
     * Upload file to Supabase Storage
     * @param {string} folderName - Folder/bucket name (profiles, issue_img, proofs)
     * @param {Buffer} fileBuffer - File buffer from multer
     * @param {string} filename - Filename to save as
     * @param {string} mimetype - File mimetype
     * @returns {Promise<Object>} Upload result with public URL
     */
    async uploadToSupabase(folderName, fileBuffer, filename, mimetype) {
        try {
            const bucketName = getBucketName(folderName);
            
            // Upload file to Supabase Storage
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(filename, fileBuffer, {
                    contentType: mimetype,
                    upsert: false, // Don't overwrite existing files
                });

            if (error) {
                console.error('Supabase upload error:', error);
                throw new Error(`Failed to upload to Supabase: ${error.message}`);
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filename);

            return {
                success: true,
                path: data.path,
                publicUrl: publicUrlData.publicUrl,
                filename: filename,
                bucket: bucketName,
            };
        } catch (error) {
            console.error('Error uploading to Supabase:', error);
            throw error;
        }
    }

    /**
     * Build file URL from Supabase public URL
     * @param {string} folderName - Folder name within buckets
     * @param {string} filename - File name
     * @returns {string} Full public URL to the file
     */
    buildFileUrl(folderName, filename) {
        const bucketName = getBucketName(folderName);
        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filename);
        return data.publicUrl;
    }

    /**
     * Validate folder name for security
     * @param {string} folderName - Folder name to validate
     * @returns {boolean} Is valid folder
     */
    isValidFolder(folderName) {
        return this.allowedFolders.includes(folderName);
    }

    /**
     * Delete file from Supabase Storage
     * @param {string} folderName - Folder name within buckets
     * @param {string} filename - File name to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(folderName, filename) {
        try {
            if (!this.isValidFolder(folderName)) {
                return false;
            }
            
            const bucketName = getBucketName(folderName);
            
            const { error } = await supabase.storage
                .from(bucketName)
                .remove([filename]);

            if (error) {
                console.error('Supabase delete error:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error deleting file from Supabase:', error);
            return false;
        }
    }

    /**
     * Check if file exists in Supabase Storage
     * @param {string} folderName - Folder name within buckets
     * @param {string} filename - File name to check
     * @returns {Promise<boolean>} File exists status
     */
    async fileExists(folderName, filename) {
        try {
            if (!this.isValidFolder(folderName)) {
                return false;
            }
            
            const bucketName = getBucketName(folderName);
            
            const { data, error } = await supabase.storage
                .from(bucketName)
                .list('', {
                    search: filename,
                });

            if (error) {
                return false;
            }

            return data && data.some(file => file.name === filename);
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * List files in a Supabase bucket
     * @param {string} folderName - Folder name within buckets
     * @param {Object} options - List options (limit, offset, sortBy, search)
     * @returns {Promise<Array>} Array of file objects
     */
    async listFiles(folderName, options = {}) {
        try {
            if (!this.isValidFolder(folderName)) {
                return [];
            }
            
            const bucketName = getBucketName(folderName);
            const { limit = 100, offset = 0, sortBy = { column: 'created_at', order: 'desc' } } = options;
            
            const { data, error } = await supabase.storage
                .from(bucketName)
                .list('', {
                    limit,
                    offset,
                    sortBy,
                });

            if (error) {
                console.error('Error listing files:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }

    /**
     * Get file metadata from Supabase
     * @param {string} folderName - Folder name within buckets
     * @param {string} filename - File name
     * @returns {Promise<Object|null>} File metadata or null if not found
     */
    async getFileStats(folderName, filename) {
        try {
            if (!this.isValidFolder(folderName)) {
                return null;
            }
            
            const bucketName = getBucketName(folderName);
            
            const { data, error } = await supabase.storage
                .from(bucketName)
                .list('', {
                    search: filename,
                });

            if (error || !data || data.length === 0) {
                return null;
            }

            const file = data.find(f => f.name === filename);
            return file || null;
        } catch (error) {
            console.error('Error getting file stats:', error);
            return null;
        }
    }

    /**
     * Get content type based on file extension
     * @param {string} extension - File extension
     * @returns {string} Content type
     */
    getContentType(extension) {
        const types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };
        return types[extension.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Download file from Supabase Storage
     * @param {string} folderName - Folder name within buckets
     * @param {string} filename - File name
     * @returns {Promise<Object>} File data with blob
     */
    async downloadFile(folderName, filename) {
        try {
            if (!this.isValidFolder(folderName)) {
                throw new Error('Invalid folder');
            }
            
            const bucketName = getBucketName(folderName);
            
            const { data, error } = await supabase.storage
                .from(bucketName)
                .download(filename);

            if (error) {
                throw new Error(`Failed to download: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        }
    }

    // Predefined upload configurations
    get profileUpload() {
        return this.createUploadConfig('profiles', this.maxFileSize.profiles);
    }

    get issueUpload() {
        return this.createUploadConfig('issue_img', this.maxFileSize.issue_img);
    }

    get proofUpload() {
        return this.createUploadConfig('proofs', this.maxFileSize.proofs);
    }

    /**
     * Handle multer errors
     * @param {Error} error - The error object
     * @param {Object} res - Express response object
     * @returns {Object} Error response
     */
    handleUploadError(error, res) {
        console.error('Upload error:', error);
        
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Please check the file size limit.'
                });
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    success: false,
                    message: 'Too many files uploaded.'
                });
            }
        }

        if (error.message.includes('Only image files are allowed')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Upload error occurred'
        });
    }
}

module.exports = new UploadService();