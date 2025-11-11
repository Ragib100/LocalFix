// server/services/uploadService.js
const multer = require('multer');
const path = require('path');
const { supabase, BUCKETS } = require('../config/supabase');

/**
 * Upload Service - Handles all file upload operations using Supabase Storage
 * Profiles and Issues: Public buckets (CDN access)
 * Proofs: Private bucket (Admin access only via signed URLs)
 */
class UploadService {
    constructor() {
        this.allowedImageTypes = /jpeg|jpg|png|gif|webp/;
        this.allowedFolders = ['profiles', 'issue_img', 'proofs'];
        this.bucketMapping = {
            'profiles': BUCKETS.PROFILES,
            'issue_img': BUCKETS.ISSUES,
            'proofs': BUCKETS.PROOFS
        };
    }

    /**
     * Create multer storage using memory storage (no disk writes)
     * Files are kept in memory and uploaded to Supabase
     * @param {string} folderName - The folder name (for validation only)
     * @returns {multer.StorageEngine}
     */
    createStorage(folderName) {
        // Use memory storage - files stay in buffer, not written to disk
        return multer.memoryStorage();
    }

    /**
     * Create multer upload configuration with memory storage
     * @param {string} folderName - Folder name for validation
     * @param {number} fileSizeLimit - File size limit in bytes
     * @returns {multer.Multer}
     */
    createUploadConfig(folderName, fileSizeLimit = 5 * 1024 * 1024) {
        return multer({
            storage: this.createStorage(folderName),
            limits: {
                fileSize: fileSizeLimit,
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
     * Upload file to Supabase Storage
     * @param {string} folderName - Folder name (profiles, issue_img, proofs)
     * @param {Object} file - Multer file object (with buffer)
     * @param {number} userId - User ID for filename
     * @returns {Promise<string>} Public URL or filename for signed URL
     */
    async uploadToSupabase(folderName, file, userId = null) {
        if (!this.isValidFolder(folderName)) {
            throw new Error('Invalid folder specified');
        }

        const bucket = this.bucketMapping[folderName];
        
        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const userPrefix = userId ? `${userId}-` : '';
        const filename = `${userPrefix}${timestamp}-${random}${path.extname(file.originalname)}`;

        // Upload to Supabase
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filename, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }

        console.log(`✅ File uploaded to Supabase: ${bucket}/${filename}`);

        // For private bucket (proofs), return just the filename
        // We'll generate signed URLs when needed
        if (bucket === BUCKETS.PROOFS) {
            return filename;
        }

        // For public buckets, return the public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filename);

        return publicUrl;
    }

    /**
     * Get signed URL for private files (proofs)
     * @param {string} filename - File name in proofs bucket
     * @param {number} expiresIn - Expiry time in seconds (default 1 hour)
     * @returns {Promise<string>} Signed URL
     */
    async getSignedUrl(filename, expiresIn = 3600) {
        const { data, error } = await supabase.storage
            .from(BUCKETS.PROOFS)
            .createSignedUrl(filename, expiresIn);

        if (error) {
            console.error('Error creating signed URL:', error);
            throw new Error(`Failed to create signed URL: ${error.message}`);
        }

        return data.signedUrl;
    }

    /**
     * Build file URL - returns public URL or indication that signed URL is needed
     * @param {string} folderName - Folder name within uploads
     * @param {string} filename - File name
     * @returns {string} Full URL or filename
     */
    buildFileUrl(folderName, filename) {
        if (!this.isValidFolder(folderName)) {
            return null;
        }

        const bucket = this.bucketMapping[folderName];

        // For private bucket (proofs), return filename only
        // Signed URL will be generated when requested
        if (bucket === BUCKETS.PROOFS) {
            return filename;
        }

        // For public buckets, get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filename);

        return publicUrl;
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
     * @param {string} folderName - Folder name within uploads
     * @param {string} filename - File name to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(folderName, filename) {
        try {
            if (!this.isValidFolder(folderName)) {
                return false;
            }
            
            const bucket = this.bucketMapping[folderName];
            
            const { error } = await supabase.storage
                .from(bucket)
                .remove([filename]);

            if (error) {
                console.error('Supabase delete error:', error);
                return false;
            }

            console.log(`✅ File deleted from Supabase: ${bucket}/${filename}`);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Check if file exists in Supabase
     * @param {string} folderName - Folder name within uploads
     * @param {string} filename - File name to check
     * @returns {Promise<boolean>} File exists status
     */
    async fileExists(folderName, filename) {
        try {
            if (!this.isValidFolder(folderName)) {
                return false;
            }

            const bucket = this.bucketMapping[folderName];
            
            const { data, error } = await supabase.storage
                .from(bucket)
                .list('', {
                    limit: 1,
                    search: filename
                });

            return !error && data && data.length > 0;
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * Extract filename from Supabase URL
     * @param {string} url - Full Supabase URL
     * @returns {string|null} Filename or null
     */
    extractFilenameFromUrl(url) {
        if (!url) return null;
        
        // Extract filename from Supabase public URL
        // Format: https://.../storage/v1/object/public/bucket-name/filename.jpg
        const parts = url.split('/');
        return parts[parts.length - 1];
    }

    /**
     * List files in a Supabase bucket
     * @param {string} folderName - Folder name within uploads
     * @param {number} limit - Max number of files to return
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>} Array of file objects
     */
    async listFiles(folderName, limit = 100, offset = 0) {
        try {
            if (!this.isValidFolder(folderName)) {
                return [];
            }
            
            const bucket = this.bucketMapping[folderName];
            
            const { data, error } = await supabase.storage
                .from(bucket)
                .list('', {
                    limit,
                    offset,
                    sortBy: { column: 'created_at', order: 'desc' }
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
     * @param {string} folderName - Folder name within uploads
     * @param {string} filename - File name
     * @returns {Promise<Object|null>} File metadata or null
     */
    async getFileStats(folderName, filename) {
        try {
            if (!this.isValidFolder(folderName)) {
                return null;
            }
            
            const bucket = this.bucketMapping[folderName];
            
            const { data, error } = await supabase.storage
                .from(bucket)
                .list('', {
                    limit: 1,
                    search: filename
                });

            if (error || !data || data.length === 0) {
                return null;
            }

            const file = data[0];
            return {
                name: file.name,
                size: file.metadata?.size || 0,
                created_at: file.created_at,
                updated_at: file.updated_at,
                mimetype: file.metadata?.mimetype
            };
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

    // Predefined upload configurations
    get profileUpload() {
        return this.createUploadConfig('profiles', 5 * 1024 * 1024);
    }

    get issueUpload() {
        return this.createUploadConfig('issue_img', 10 * 1024 * 1024);
    }

    get proofUpload() {
        return this.createUploadConfig('proofs', 10 * 1024 * 1024);
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