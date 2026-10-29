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
  if (!Buffer.isBuffer(req.file.buffer) || req.file.buffer.byteLength === 0) {
    return res.status(400).json({ message: 'The selected proof image is empty. Please select the image again.' });
  }

  try {
    // Verify worker is assigned to this issue
    const issueResult = await executeQuery(
      `SELECT assigned_worker_id, status FROM issues WHERE issue_id = $1`,
      [issueId]
    );
    
    if (!issueResult.success || issueResult.rows.length === 0) {
        return res.status(404).json({ message: 'Issue not found.' });
    }

    const issue = issueResult.rows[0];
    if (issue.assigned_worker_id !== worker_id) {
        return res.status(403).json({ message: 'You are not assigned to this issue.' });
    }

    // A rejected proof can be replaced; pending and approved proofs cannot.
    const existingProofResult = await executeQuery(
      `SELECT proof_id, verification_status FROM issue_proofs WHERE issue_id = $1`,
      [issueId]
    );

    if (!existingProofResult.success) {
      return res.status(500).json({
        message: 'Failed to check existing proof',
        error: getErrorMessage(existingProofResult.error),
      });
    }

    const existingProof = existingProofResult.rows[0];
    const retryingRejectedProof = existingProof?.verification_status === 'rejected';
    if (!['assigned', 'in_progress'].includes(issue.status) &&
        !(issue.status === 'under_review' && retryingRejectedProof)) {
      return res.status(400).json({ message: `Cannot submit proof for an issue with status '${issue.status}'.` });
    }
    if (existingProof && existingProof.verification_status !== 'rejected') {
      return res.status(409).json({
        message: `A proof is already ${existingProof.verification_status} for this issue.`,
      });
    }

    // Only upload after confirming this issue can accept a proof.
    const filename = uploadService.generateFilename(req.file, worker_id, 'proof');
    const uploadResult = await uploadService.uploadObject(
      'proofs',
      req.file.buffer,
      filename,
      req.file.mimetype
    );
    const proof_photo_url = uploadResult.publicUrl;

    let saveResult;
    if (existingProof) {
      // Reuse the one-proof-per-issue row, reset its review fields, and return
      // the issue to review in the same statement.
      saveResult = await executeQuery(
        `WITH eligible_issue AS MATERIALIZED (
           SELECT issue_id
           FROM issues
           WHERE issue_id = $1
             AND assigned_worker_id = $2
             AND status IN ('assigned', 'in_progress', 'under_review')
           FOR UPDATE
         ), updated_proof AS (
           UPDATE issue_proofs AS ip
           SET worker_id = $2,
               proof_photo = $3,
               proof_description = $4,
               submitted_at = CURRENT_TIMESTAMP,
               verification_status = 'pending',
               admin_feedback = NULL,
               verified_by = NULL,
               verified_at = NULL
           FROM eligible_issue AS ei
           WHERE ip.issue_id = ei.issue_id
             AND ip.verification_status = 'rejected'
           RETURNING ip.proof_id, ip.issue_id
         ), updated_issue AS (
           UPDATE issues AS i
           SET status = 'under_review', updated_at = CURRENT_TIMESTAMP
           FROM updated_proof AS up
           WHERE i.issue_id = up.issue_id
           RETURNING i.issue_id
         )
         SELECT up.proof_id
         FROM updated_proof AS up
         JOIN updated_issue AS ui ON ui.issue_id = up.issue_id`,
        [issueId, worker_id, proof_photo_url, comment || 'No comment provided.']
      );
    } else {
      // The insert trigger moves the issue to under_review.
      saveResult = await executeQuery(
        `INSERT INTO issue_proofs (issue_id, worker_id, proof_photo, proof_description)
         VALUES ($1, $2, $3, $4)`,
        [issueId, worker_id, proof_photo_url, comment || 'No comment provided.']
      );
    }

    if (!saveResult.success) {
        if (saveResult.code === '23505') {
          return res.status(409).json({ message: 'A proof has already been submitted for this issue.' });
        }
        return res.status(500).json({ 
            message: "Failed to submit proof", 
            error: getErrorMessage(saveResult.error)
        });
    }
    if (existingProof && saveResult.rowCount === 0) {
      return res.status(409).json({ message: 'The rejected proof could not be resubmitted. Refresh and try again.' });
    }

    res.status(201).json({ 
        message: 'Proof submitted successfully! The issue is now under review.',
        proofId: 'Generated'
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
        ip.proof_description,
        ip.submitted_at,
        ip.verified_at,
        ip.verification_status,
        ip.admin_feedback,
        u.name as admin_name,
        i.title as issue_title,
        i.status as issue_status
      FROM issue_proofs ip
      JOIN issues i ON ip.issue_id = i.issue_id
      LEFT JOIN users u ON ip.verified_by = u.user_id
      WHERE ip.issue_id = $1 AND ip.worker_id = $2
    `;

    const result = await executeQuery(query, [issueId, worker_id]);

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
        proofId: proof.proof_id,
        proofPhoto: proof.proof_photo,
        description: proof.proof_description,
        submittedAt: proof.submitted_at,
        verifiedAt: proof.verified_at,
        verificationStatus: proof.verification_status,
        adminFeedback: proof.admin_feedback,
        adminName: proof.admin_name,
        issueTitle: proof.issue_title,
        issueStatus: proof.issue_status
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
       WHERE issue_id = $1 AND assigned_worker_id = $2 AND status = 'assigned'`,
      [issueId, worker_id]
    );

    if (!updateResult.success) {
        return res.status(500).json({ 
            message: "Failed to update progress", 
            error: getErrorMessage(updateResult.error) 
        });
    }

    if (updateResult.rowCount === 0) {
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
        ip.proof_description,
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
      proof_id: r.proof_id,
      issue_id: r.issue_id,
      issue_title: r.issue_title,
  issue_status: r.issue_status,
  issue_category: r.issue_category,
      issue_location: r.issue_location,
      worker_id: r.worker_id,
      worker_name: r.worker_name,
      worker_email: r.worker_email,
      worker_phone: r.worker_phone,
      worker_profile_image: r.worker_profile_image,
      proof_photo: r.proof_photo,
      proof_description: r.proof_description,
      submitted_at: r.submitted_at,
      verification_status: r.verification_status
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
      `SELECT verification_status FROM issue_proofs WHERE proof_id = $1`,
      [proofId]
    );
    if (!check.success || check.rows.length === 0) {
      return res.status(404).json({ message: 'Proof not found' });
    }
    const status = check.rows[0].verification_status;
    if (status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve a proof in '${status}' status.` });
    }

    const result = await executeQuery(
      `UPDATE issue_proofs
       SET verification_status = 'approved',
           admin_feedback = $1,
           verified_by = $2,
           verified_at = CURRENT_TIMESTAMP
       WHERE proof_id = $3`,
      [feedback || null, admin_id, proofId]
    );

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to approve proof', error: result.error });
    }
    if (result.rowCount === 0) {
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
      `SELECT verification_status, proof_photo FROM issue_proofs WHERE proof_id = $1`,
      [proofId]
    );
    if (!check.success || check.rows.length === 0) {
      return res.status(404).json({ message: 'Proof not found' });
    }
    const status = check.rows[0].verification_status;
    if (status !== 'pending') {
      return res.status(400).json({ message: `Cannot reject a proof in '${status}' status.` });
    }

    const oldProofUrl = check.rows[0].proof_photo;
    if (oldProofUrl) {
      let oldFilename;
      try {
        const proofUrl = new URL(oldProofUrl);
        const pathParts = proofUrl.pathname.split('/').filter(Boolean);
        const bucketIndex = pathParts.indexOf('proofs');
        if (bucketIndex < 0 || bucketIndex === pathParts.length - 1) {
          throw new Error('Proof image URL does not contain a Neon proofs bucket key');
        }
        oldFilename = pathParts.slice(bucketIndex + 1).map(decodeURIComponent).join('/');
      } catch (error) {
        console.error('Cannot determine Neon proof object key:', error);
        return res.status(500).json({ message: 'Could not identify the proof image in Neon Object Storage' });
      }

      // Delete before clearing the database reference. If storage rejects the
      // request, leave the proof pending so the admin can retry safely.
      const deleted = await uploadService.deleteFile('proofs', oldFilename);
      if (!deleted) {
        return res.status(502).json({ message: 'Could not delete the old proof image from Neon Object Storage. The proof was not rejected; please retry.' });
      }
    }

    const result = await executeQuery(
      `UPDATE issue_proofs
       SET verification_status = 'rejected',
           admin_feedback = $1,
           verified_by = $2,
           verified_at = CURRENT_TIMESTAMP,
           proof_photo = NULL
       WHERE proof_id = $3 AND verification_status = 'pending'`,
      [feedback.trim(), admin_id, proofId]
    );

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to reject proof', error: result.error });
    }
    if (result.rowCount === 0) {
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
