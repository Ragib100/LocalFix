// server/routes/uploadRoutes.js
const express = require('express');
const uploadService = require('../services/uploadService');
const fileController = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Upload Routes - Supabase Storage operations
 * Public buckets: profiles, issue-images
 * Private bucket: proofs (admin access only)
 */

// File upload routes - All require authentication
router.post('/issue', 
    authenticateToken,
    uploadService.issueUpload.single('image'), 
    fileController.uploadIssueImage
);

router.post('/profile', 
    authenticateToken,
    uploadService.profileUpload.single('image'), 
    fileController.uploadProfileImage
);

router.post('/proof', 
    authenticateToken,
    uploadService.proofUpload.single('image'), 
    fileController.uploadProofImage
);

// File serving routes
// Public buckets (profiles, issue_img): No auth required - Supabase CDN serves them
// Private bucket (proofs): Admin auth required - generates signed URLs
router.get('/image/proofs/:filename', 
    authenticateToken, // Proofs require authentication
    (req, res, next) => {
        req.params.folder = 'proofs';
        next();
    },
    fileController.getImage
);

router.get('/image/:folder/:filename', fileController.getImage); // Public buckets

// File info routes
router.get('/info/proofs/:filename', 
    authenticateToken,
    (req, res, next) => {
        req.params.folder = 'proofs';
        next();
    },
    fileController.getImageInfo
);

router.get('/info/:folder/:filename', fileController.getImageInfo);

// File management routes - Require authentication
router.delete('/image/:folder/:filename', 
    authenticateToken, 
    fileController.deleteImage
);

router.get('/list/proofs', 
    authenticateToken, // Proofs list requires auth
    (req, res, next) => {
        req.params.folder = 'proofs';
        next();
    },
    fileController.listImages
);

router.get('/list/:folder', 
    authenticateToken, 
    fileController.listImages
);

// Error handling middleware for multer
router.use(fileController.handleUploadError);

module.exports = router;