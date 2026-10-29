// Uploads are stored in Neon Object Storage through its S3-compatible API.
const multer = require('multer');
const path = require('path');
const {
    s3,
    BUCKET_NAMES,
    publicObjectUrl,
} = require('../config/neonStorage');
const {
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    GetObjectCommand,
} = require('@aws-sdk/client-s3');

class UploadService {
    constructor() {
        this.allowedImageTypes = /jpeg|jpg|png|gif|webp/;
        this.allowedFolders = Object.keys(BUCKET_NAMES);
        this.maxFileSize = {
            profiles: 5 * 1024 * 1024,
            issue_img: 10 * 1024 * 1024,
            proofs: 10 * 1024 * 1024,
        };
    }

    createStorage() {
        return multer.memoryStorage();
    }

    createUploadConfig(folderName, fileSizeLimit = null) {
        const sizeLimit = fileSizeLimit || this.maxFileSize[folderName] || 10 * 1024 * 1024;
        return multer({
            storage: this.createStorage(),
            limits: { fileSize: sizeLimit },
            fileFilter: this.imageFileFilter.bind(this),
        });
    }

    imageFileFilter(req, file, cb) {
        const extname = this.allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = this.allowedImageTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        return cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }

    generateFilename(file, userId = null, prefix = '') {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const prefixStr = prefix ? `${prefix}-` : '';
        const userStr = userId ? `${userId}-` : '';
        return `${prefixStr}${userStr}${uniqueSuffix}${path.extname(file.originalname)}`;
    }

    getBucketName(folderName) {
        if (!this.isValidFolder(folderName)) throw new Error('Invalid storage folder');
        return BUCKET_NAMES[folderName];
    }

    async uploadObject(folderName, fileBuffer, filename, mimetype) {
        const bucket = this.getBucketName(folderName);
        if (!Buffer.isBuffer(fileBuffer) || fileBuffer.byteLength === 0) {
            throw new Error('Upload body is empty or is not a Buffer. The upload route must use Multer memory storage.');
        }

        try {
            await s3.send(new PutObjectCommand({
                Bucket: bucket,
                Key: filename,
                Body: fileBuffer,
                ContentLength: fileBuffer.byteLength,
                ContentType: mimetype,
                CacheControl: 'public, max-age=86400',
            }));

            const storedObject = await s3.send(new HeadObjectCommand({
                Bucket: bucket,
                Key: filename,
            }));
            if (storedObject.ContentLength !== fileBuffer.byteLength) {
                await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: filename }));
                throw new Error(`Stored object size mismatch: expected ${fileBuffer.byteLength} bytes, got ${storedObject.ContentLength ?? 'unknown'}.`);
            }

            return {
                success: true,
                path: filename,
                publicUrl: publicObjectUrl(bucket, filename),
                filename,
                bucket,
            };
        } catch (error) {
            console.error('Neon Object Storage upload error:', error);
            throw new Error(`Failed to upload to Neon Object Storage: ${error.message}`);
        }
    }

    buildFileUrl(folderName, filename) {
        return publicObjectUrl(this.getBucketName(folderName), filename);
    }

    isValidFolder(folderName) {
        return this.allowedFolders.includes(folderName);
    }

    async deleteFile(folderName, filename) {
        if (!this.isValidFolder(folderName)) return false;
        try {
            const bucket = BUCKET_NAMES[folderName];
            // Treat an already-absent object as deleted (for safe retries).
            try {
                await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: filename }));
            } catch (error) {
                if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) return true;
                throw error;
            }

            await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: filename }));

            // S3-compatible stores can acknowledge DELETE without removing the
            // requested key. Confirm it is no longer addressable before reporting success.
            try {
                await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: filename }));
                console.error(`Neon Object Storage still contains ${bucket}/${filename} after delete`);
                return false;
            } catch (error) {
                if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) return true;
                throw error;
            }
        } catch (error) {
            console.error('Neon Object Storage delete error:', error);
            return false;
        }
    }

    async fileExists(folderName, filename) {
        if (!this.isValidFolder(folderName)) return false;
        try {
            await s3.send(new HeadObjectCommand({
                Bucket: BUCKET_NAMES[folderName],
                Key: filename,
            }));
            return true;
        } catch (error) {
            if (error.name !== 'NotFound' && error.$metadata?.httpStatusCode !== 404) {
                console.error('Neon Object Storage existence check failed:', error);
            }
            return false;
        }
    }

    async listFiles(folderName, options = {}) {
        if (!this.isValidFolder(folderName)) return [];
        const { limit = 100, offset = 0 } = options;
        const pageSize = Math.min(Math.max(limit + offset, 1), 1000);
        try {
            const result = await s3.send(new ListObjectsV2Command({
                Bucket: BUCKET_NAMES[folderName],
                MaxKeys: pageSize,
            }));
            return (result.Contents || []).slice(offset, offset + limit).map((object) => ({
                name: object.Key,
                created_at: object.LastModified,
                updated_at: object.LastModified,
                metadata: { size: object.Size },
            }));
        } catch (error) {
            console.error('Neon Object Storage list error:', error);
            return [];
        }
    }

    async getFileStats(folderName, filename) {
        if (!this.isValidFolder(folderName)) return null;
        try {
            const object = await s3.send(new HeadObjectCommand({
                Bucket: BUCKET_NAMES[folderName],
                Key: filename,
            }));
            return {
                name: filename,
                created_at: object.LastModified,
                updated_at: object.LastModified,
                metadata: { size: object.ContentLength, mimetype: object.ContentType },
            };
        } catch (error) {
            if (error.name !== 'NotFound' && error.$metadata?.httpStatusCode !== 404) {
                console.error('Neon Object Storage metadata error:', error);
            }
            return null;
        }
    }

    getContentType(extension) {
        const types = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.webp': 'image/webp',
        };
        return types[extension.toLowerCase()] || 'application/octet-stream';
    }

    async downloadFile(folderName, filename) {
        return s3.send(new GetObjectCommand({
            Bucket: this.getBucketName(folderName),
            Key: filename,
        }));
    }

    get profileUpload() { return this.createUploadConfig('profiles', this.maxFileSize.profiles); }
    get issueUpload() { return this.createUploadConfig('issue_img', this.maxFileSize.issue_img); }
    get proofUpload() { return this.createUploadConfig('proofs', this.maxFileSize.proofs); }

    handleUploadError(error, res) {
        console.error('Upload error:', error);
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'File too large. Please check the file size limit.' });
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ success: false, message: 'Too many files uploaded.' });
            }
        }
        if (error.message?.includes('Only image files are allowed')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'Upload error occurred' });
    }
}

module.exports = new UploadService();
