// server/controllers/jobProofController.js
const { executeQuery } = require('../config/database');
const uploadService = require('../services/uploadService');

const getErrorMessage = (error) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

async function submitProof(req, res) {
  const worker_id = req.user.user_id;
  const { issueId, comment } = req.body;

  if (!issueId || !req.file) {
    return res.status(400).json({ message: "Missing issueId or proof image." });
  }

  try {
    // Generate filename and upload to Supabase
    const filename = uploadService.generateFilename(req.file, worker_id, 'proof');
    const uploadResult = await uploadService.uploadToSupabase(
      'proofs',
      req.file.buffer,
      filename,
      req.file.mimetype
    );
    
    const proof_photo_url = uploadResult.publicUrl;
    // Verify worker is assigned to this issue
    const issueResult = await executeQuery(
      `SELECT assigned_worker_id, status FROM issues WHERE issue_id = :issueId`,
      { issueId }
    );
    
    if (!issueResult.success || issueResult.rows.length === 0) {
        return res.status(404).json({ message: 'Issue not found.' });
    }

    const issue = issueResult.rows[0];
    if (issue.ASSIGNED_WORKER_ID !== worker_id) {
        return res.status(403).json({ message: 'You are not assigned to this issue.' });
    }

    if (!['assigned', 'in_progress'].includes(issue.STATUS)) {
        return res.status(400).json({ message: `Cannot submit proof for an issue with status '${issue.STATUS}'.` });
    }

    // Check if proof already exists for this issue
    const existingProofResult = await executeQuery(
      `SELECT proof_id FROM issue_proofs WHERE issue_id = :issueId`,
      { issueId }
    );

    if (existingProofResult.success && existingProofResult.rows.length > 0) {
        return res.status(400).json({ message: 'Proof has already been submitted for this issue.' });
    }

    // Insert into issue_proofs table (trigger will handle status update automatically)
    const insertResult = await executeQuery(
      `INSERT INTO issue_proofs (issue_id, worker_id, proof_photo, proof_description)
       VALUES (:issue_id, :worker_id, :proof_photo, :proof_description)`,
      {
        issue_id: issueId,
        worker_id: worker_id,
        proof_photo: proof_photo_url,
        proof_description: comment || 'No comment provided.'
      }
    );

    if (!insertResult.success) {
        return res.status(500).json({ 
            message: "Failed to submit proof", 
            error: getErrorMessage(insertResult.error) 
        });
    }

    res.status(201).json({ 
        message: 'Proof submitted successfully! The issue is now under review.',
        proofId: insertResult.outBinds?.proof_id || 'Generated'
    });

  } catch (err) {
    console.error("Error in submitProof:", err);
    res.status(500).json({ message: "Internal server error", error: getErrorMessage(err) });
  }
}

async function getProofStatus(req, res) {
  const worker_id = req.user.user_id;
  const { issueId } = req.params;

  try {
    const query = `
      SELECT 
        ip.proof_id,
        ip.proof_photo,
        TO_CHAR(ip.proof_description) as proof_description,
        ip.submitted_at,
        ip.verified_at,
        ip.verification_status,
        TO_CHAR(ip.admin_feedback) as admin_feedback,
        u.name as admin_name,
        i.title as issue_title,
        i.status as issue_status
      FROM issue_proofs ip
      JOIN issues i ON ip.issue_id = i.issue_id
      LEFT JOIN users u ON ip.verified_by = u.user_id
      WHERE ip.issue_id = :issueId AND ip.worker_id = :worker_id
    `;

    const result = await executeQuery(query, { issueId, worker_id });

    if (!result.success) {
        return res.status(500).json({ 
            message: "Error fetching proof status", 
            error: getErrorMessage(result.error) 
        });
    }

    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No proof found for this issue.' });
    }

    const proof = result.rows[0];
    res.json({
        proofId: proof.PROOF_ID,
        proofPhoto: proof.PROOF_PHOTO,
        description: proof.PROOF_DESCRIPTION,
        submittedAt: proof.SUBMITTED_AT,
        verifiedAt: proof.VERIFIED_AT,
        verificationStatus: proof.VERIFICATION_STATUS,
        adminFeedback: proof.ADMIN_FEEDBACK,
        adminName: proof.ADMIN_NAME,
        issueTitle: proof.ISSUE_TITLE,
        issueStatus: proof.ISSUE_STATUS
    });

  } catch (err) {
    console.error("Error in getProofStatus:", err);
    res.status(500).json({ message: "Internal server error", error: getErrorMessage(err) });
  }
}

async function updateProofProgress(req, res) {
  const worker_id = req.user.user_id;
  const { issueId } = req.body;

  try {
    // Update issue status to 'in_progress'
    const updateResult = await executeQuery(
      `UPDATE issues 
       SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
       WHERE issue_id = :issueId AND assigned_worker_id = :worker_id AND status = 'assigned'`,
      { issueId, worker_id }
    );

    if (!updateResult.success) {
        return res.status(500).json({ 
            message: "Failed to update progress", 
            error: getErrorMessage(updateResult.error) 
        });
    }

    if (updateResult.rowsAffected === 0) {
        return res.status(400).json({ 
            message: 'Cannot update progress. Issue may not be assigned to you or already in progress.' 
        });
    }

    res.json({ message: 'Issue marked as in progress successfully!' });

  } catch (err) {
    console.error("Error in updateProofProgress:", err);
    res.status(500).json({ message: "Internal server error", error: getErrorMessage(err) });
  }
}

// Admin: list pending proofs for review
async function getPendingProofs(req, res) {
  try {
    const result = await executeQuery(
      `SELECT 
        ip.proof_id,
        ip.issue_id,
        ip.worker_id,
        ip.proof_photo,
        TO_CHAR(ip.proof_description) as proof_description,
        ip.submitted_at,
        ip.verification_status,
        i.title as issue_title,
  i.status as issue_status,
  i.category as issue_category,
        l.full_address as issue_location,
        u.name as worker_name,
        u.email as worker_email,
        u.phone as worker_phone,
        u.img_url as worker_profile_image
      FROM issue_proofs ip
      JOIN issues i ON ip.issue_id = i.issue_id
      JOIN locations l ON i.location_id = l.location_id
      JOIN users u ON ip.worker_id = u.user_id
      WHERE ip.verification_status = 'pending'
      ORDER BY ip.submitted_at DESC`
    );

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to fetch pending proofs', error: result.error });
    }

    const proofs = result.rows.map(r => ({
      proof_id: r.PROOF_ID,
      issue_id: r.ISSUE_ID,
      issue_title: r.ISSUE_TITLE,
  issue_status: r.ISSUE_STATUS,
  issue_category: r.ISSUE_CATEGORY,
      issue_location: r.ISSUE_LOCATION,
      worker_id: r.WORKER_ID,
      worker_name: r.WORKER_NAME,
      worker_email: r.WORKER_EMAIL,
      worker_phone: r.WORKER_PHONE,
      worker_profile_image: r.WORKER_PROFILE_IMAGE,
      proof_photo: r.PROOF_PHOTO,
      proof_description: r.PROOF_DESCRIPTION,
      submitted_at: r.SUBMITTED_AT,
      verification_status: r.VERIFICATION_STATUS
    }));

    res.json({ proofs });
  } catch (err) {
    console.error('Error in getPendingProofs:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Admin: approve a proof with optional feedback
async function approveProof(req, res) {
  const admin_id = req.user.user_id;
  const { proofId } = req.params;
  const { feedback } = req.body;

  try {
    // Ensure proof exists and is pending
    const check = await executeQuery(
      `SELECT verification_status FROM issue_proofs WHERE proof_id = :proofId`,
      { proofId }
    );
    if (!check.success || check.rows.length === 0) {
      return res.status(404).json({ message: 'Proof not found' });
    }
    const status = check.rows[0].VERIFICATION_STATUS;
    if (status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve a proof in '${status}' status.` });
    }

    const result = await executeQuery(
      `UPDATE issue_proofs
       SET verification_status = 'approved',
           admin_feedback = :feedback,
           verified_by = :admin_id,
           verified_at = CURRENT_TIMESTAMP
       WHERE proof_id = :proofId`,
      { feedback: feedback || null, admin_id, proofId }
    );

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to approve proof', error: result.error });
    }
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Proof not found or already processed' });
    }

    // Issue status updated to 'resolved' by trigger in DB
    res.json({ message: 'Proof approved successfully' });
  } catch (err) {
    console.error('Error in approveProof:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Admin: reject a proof with required feedback
async function rejectProof(req, res) {
  const admin_id = req.user.user_id;
  const { proofId } = req.params;
  const { feedback } = req.body;

  if (!feedback || !feedback.trim()) {
    return res.status(400).json({ message: 'Feedback is required when rejecting a proof' });
  }

  try {
    const check = await executeQuery(
      `SELECT verification_status FROM issue_proofs WHERE proof_id = :proofId`,
      { proofId }
    );
    if (!check.success || check.rows.length === 0) {
      return res.status(404).json({ message: 'Proof not found' });
    }
    const status = check.rows[0].VERIFICATION_STATUS;
    if (status !== 'pending') {
      return res.status(400).json({ message: `Cannot reject a proof in '${status}' status.` });
    }

    const result = await executeQuery(
      `UPDATE issue_proofs
       SET verification_status = 'rejected',
           admin_feedback = :feedback,
           verified_by = :admin_id,
           verified_at = CURRENT_TIMESTAMP
       WHERE proof_id = :proofId`,
      { feedback: feedback.trim(), admin_id, proofId }
    );

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to reject proof', error: result.error });
    }
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: 'Proof not found or already processed' });
    }

    // Issue status updated to 'in_progress' by trigger in DB
    res.json({ message: 'Proof rejected successfully with feedback' });
  } catch (err) {
    console.error('Error in rejectProof:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { 
  submitProof,
  getProofStatus,
  updateProofProgress,
  getPendingProofs,
  approveProof,
  rejectProof
};