// server/routes/jobProofRoutes.js
const express = require("express");
const router = express.Router();
const { submitProof, getPendingProofs, approveProof, rejectProof } = require("../controllers/jobProofController");
const { authenticateToken, authorize } = require('../middleware/auth');
const uploadService = require('../services/uploadService');

// Use uploadService for memory-based uploads to Supabase
const upload = uploadService.createUploadConfig('proofs', 10 * 1024 * 1024); // 10MB limit for proofs

// POST route to submit proof
router.post("/", authenticateToken, authorize('worker'), upload.single('image'), submitProof);

// Admin routes for reviewing proofs
router.get("/pending", authenticateToken, authorize('admin'), getPendingProofs);
router.put("/:proofId/approve", authenticateToken, authorize('admin'), approveProof);
router.put("/:proofId/reject", authenticateToken, authorize('admin'), rejectProof);

module.exports = router;