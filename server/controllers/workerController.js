// server/controllers/workerController.js
const { executeQuery, executeMultipleQueries } = require('../config/database');

const getErrorMessage = (error) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

async function getMyApplications(req, res) {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: "Authentication required. User not found." });
  }

  const worker_id = req.user.user_id;

  const query = `
    SELECT
        i.issue_id,
        i.title,
        i.description,
        i.category,
        i.priority,
        i.status,
        i.image_url,
        l.full_address,
        l.upazila,
        l.district,
        c.name as citizen_name,
        c.phone as citizen_phone,
        a.applied_at,
        a.status as application_status,
        a.estimated_cost,
        a.estimated_time,
        a.proposal_description as my_proposal,
        a.feedback as admin_feedback,
        i.updated_at as last_updated
    FROM applications a
    JOIN issues i ON a.issue_id = i.issue_id
    JOIN users c ON i.citizen_id = c.user_id
    JOIN locations l ON i.location_id = l.location_id
    WHERE a.worker_id = $1
    
    UNION
    
    SELECT
        i.issue_id,
        i.title,
        i.description,
        i.category,
        i.priority,
        i.status,
        i.image_url,
        l.full_address,
        l.upazila,
        l.district,
        c.name as citizen_name,
        c.phone as citizen_phone,
        NULL::timestamp as applied_at,
        NULL::varchar(20) as application_status,
        NULL::numeric as estimated_cost,
        NULL::varchar(50) as estimated_time,
        NULL::text as my_proposal,
        NULL::text as admin_feedback,
        i.updated_at as last_updated
    FROM issues i
    JOIN users c ON i.citizen_id = c.user_id
    JOIN locations l ON i.location_id = l.location_id
    WHERE i.assigned_worker_id = $1 
      AND i.status IN ('assigned', 'in_progress', 'under_review', 'resolved')
      AND NOT EXISTS (
        SELECT 1 FROM applications a2 
        WHERE a2.issue_id = i.issue_id AND a2.worker_id = $1
      )
    ORDER BY last_updated DESC
  `;

  try {
    const result = await executeQuery(query, [worker_id]);

    if (result.success) {
      const applications = result.rows.map(app => ({
        id: app.issue_id,
        title: app.title,
        location: app.full_address,
        upazila: app.upazila,
        district: app.district,
        category: app.category,
        priority: app.priority,
        status: app.status,
        applicationStatus: app.application_status,
        estimatedCost: app.estimated_cost ? parseFloat(app.estimated_cost) : null,
        estimatedTime: app.estimated_time,
        appliedDate: app.applied_at ? new Date(app.applied_at).toISOString().split('T')[0] : null,
        lastUpdated: app.last_updated ? new Date(app.last_updated).toISOString().split('T')[0] : null,
        myProposal: app.my_proposal,
        adminFeedback: app.admin_feedback,
        description: app.description,
        citizenName: app.citizen_name,
        citizenContact: app.citizen_phone,
        imageUrl: app.image_url
      }));
      res.json({ applications });
    } else {
      res.status(500).json({ message: "Error fetching applications", error: getErrorMessage(result.error) });
    }
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).json({ message: "Internal server error", error: getErrorMessage(err) });
  }
}

async function updateWorkProgress(req, res) {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: "Authentication required. User not found." });
  }

  const worker_id = req.user.user_id;
  const { issueId } = req.body;

  if (!issueId) {
    return res.status(400).json({ message: "Issue ID is required" });
  }

  try {
    // First verify the worker is assigned to this issue
    const checkResult = await executeQuery(
      `SELECT status FROM issues 
       WHERE issue_id = $1 AND assigned_worker_id = $2`,
      [issueId, worker_id]
    );

    if (!checkResult.success) {
      return res.status(500).json({ 
        message: "Error checking issue status", 
        error: getErrorMessage(checkResult.error) 
      });
    }

    if (checkResult.rows.length === 0) {
      return res.status(403).json({ 
        message: 'Issue not found or you are not assigned to this issue.' 
      });
    }

    const currentStatus = checkResult.rows[0].status;

    if (currentStatus !== 'assigned') {
      return res.status(400).json({ 
        message: `Cannot start work. Current status: ${currentStatus}. Issue must be in 'assigned' status.` 
      });
    }

    // Update issue to in_progress
    const updateResult = await executeQuery(
      `UPDATE issues 
       SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
       WHERE issue_id = $1 AND assigned_worker_id = $2 AND status = 'assigned'`,
      [issueId, worker_id]
    );

    if (!updateResult.success) {
      return res.status(500).json({ 
        message: "Error updating work progress", 
        error: getErrorMessage(updateResult.error) 
      });
    }

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ 
        message: 'Failed to start work. Issue may have been updated by another process.' 
      });
    }

    res.json({ message: 'Work started successfully! Issue status updated to in progress.' });

  } catch (err) {
    console.error("Error in updateWorkProgress:", err);
    res.status(500).json({ message: "Internal server error", error: getErrorMessage(err) });
  }
}

async function submitWorkProof(req, res) {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: "Authentication required. User not found." });
  }

  const worker_id = req.user.user_id;
  const { issueId, proofDescription, proofPhoto } = req.body;

  if (!issueId || !proofDescription) {
    return res.status(400).json({ message: "Issue ID and proof description are required" });
  }

  if (proofDescription.trim().length < 20) {
    return res.status(400).json({ message: "Proof description must be at least 20 characters long" });
  }

  try {
    // Verify worker is assigned and issue is in correct status
    const checkResult = await executeQuery(
      `SELECT status FROM issues 
       WHERE issue_id = $1 AND assigned_worker_id = $2`,
      [issueId, worker_id]
    );

    if (!checkResult.success) {
      return res.status(500).json({ 
        message: "Error checking issue status", 
        error: getErrorMessage(checkResult.error) 
      });
    }

    if (checkResult.rows.length === 0) {
      return res.status(403).json({ 
        message: 'Issue not found or you are not assigned to this issue.' 
      });
    }

    const currentStatus = checkResult.rows[0].status;
    if (!['assigned', 'in_progress'].includes(currentStatus)) {
      return res.status(400).json({ 
        message: `Cannot submit proof. Current status: ${currentStatus}. Issue must be 'assigned' or 'in_progress'.` 
      });
    }

    // Use transaction to insert proof and update issue status
    const queries = [
      {
        sql: `INSERT INTO issue_proofs (issue_id, worker_id, proof_description, proof_photo)
              VALUES ($1, $2, $3, $4)`,
        binds: [ 
          issueId, 
          worker_id, 
          proofDescription.trim(),
          proofPhoto || null
        ]
      },
      {
        sql: `UPDATE issues 
              SET status = 'under_review', updated_at = CURRENT_TIMESTAMP 
              WHERE issue_id = $1 AND assigned_worker_id = $2`,
        binds: [issueId, worker_id]
      }
    ];

    const transactionResult = await executeMultipleQueries(queries);

    if (!transactionResult.success) {
      console.error("Transaction failed:", transactionResult.error);
      
      // Handle specific PostgreSQL errors
      if (transactionResult.code === '23505') { // Unique constraint violation
        return res.status(409).json({ 
          message: 'Proof already submitted for this issue' 
        });
      }

      return res.status(500).json({ 
        message: "Error submitting proof", 
        error: getErrorMessage(transactionResult.error) 
      });
    }

    res.json({ 
      message: 'Proof submitted successfully! Issue is now under review.',
      success: true
    });

  } catch (err) {
    console.error("Error in submitWorkProof:", err);
    res.status(500).json({ message: "Internal server error", error: getErrorMessage(err) });
  }
}

async function deleteApplication(req, res) {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: "Authentication required. User not found." });
  }

  const worker_id = req.user.user_id;
  const { issueId } = req.params;

  if (!issueId) {
    return res.status(400).json({ message: "Issue ID is required" });
  }

  try {
    // First, check if the application exists and get its status
    const checkResult = await executeQuery(
      `SELECT application_id, status
       FROM applications
       WHERE issue_id = $1 AND worker_id = $2`,
      [issueId, worker_id]
    );

    if (!checkResult.success) {
      return res.status(500).json({
        message: "Failed to check application",
        error: getErrorMessage(checkResult.error)
      });
    }

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    const applicationStatus = checkResult.rows[0].status;

    // Only allow deletion of rejected applications
    if (applicationStatus !== 'rejected') {
      return res.status(400).json({
        message: "Only rejected applications can be deleted. Current status: " + applicationStatus
      });
    }

    // Check if there are other applications for this issue
    const otherAppsResult = await executeQuery(
      `SELECT COUNT(*) as app_count
       FROM applications
       WHERE issue_id = $1 AND worker_id != $2 AND status != 'rejected'`,
      [issueId, worker_id]
    );

    if (!otherAppsResult.success) {
      return res.status(500).json({
        message: "Failed to check other applications",
        error: getErrorMessage(otherAppsResult.error)
      });
    }

    const otherActiveApps = otherAppsResult.rows[0].app_count || 0;

    // Use transaction to delete application and potentially update issue status
    const queries = [
      // Delete the rejected application
      {
        sql: `DELETE FROM applications
              WHERE issue_id = $1 AND worker_id = $2 AND status = 'rejected'`,
        binds: [issueId, worker_id]
      }
    ];

    // Only update issue status to 'submitted' if no other active applications exist
    if (otherActiveApps === 0) {
      queries.push({
        sql: `UPDATE issues
              SET status = 'submitted', updated_at = CURRENT_TIMESTAMP
              WHERE issue_id = $1 AND status = 'applied'`,
        binds: [issueId]
      });
    }

    const transactionResult = await executeMultipleQueries(queries);

    if (!transactionResult.success) {
      return res.status(500).json({
        message: "Failed to delete application",
        error: getErrorMessage(transactionResult.error)
      });
    }

    // Check if the application was actually deleted
    const deleteResult = transactionResult.results[0];
    if (deleteResult.rowCount === 0) {
      return res.status(400).json({
        message: 'Application could not be deleted. It may have been already processed.'
      });
    }

    let responseMessage = 'Rejected application deleted successfully!';
    let issueStatusUpdated = false;

    // Check if issue status was updated
    if (queries.length > 1 && transactionResult.results[1]) {
      const issueUpdateResult = transactionResult.results[1];
      if (issueUpdateResult.rowCount > 0) {
        responseMessage += ' Issue status updated to submitted as no other applications remain.';
        issueStatusUpdated = true;
      }
    }

    res.json({ 
      message: responseMessage,
      deletedApplication: {
        issueId: issueId,
        workerId: worker_id
      },
      issueStatusUpdated: issueStatusUpdated,
      remainingActiveApplications: otherActiveApps
    });

  } catch (err) {
    console.error("Error in deleteApplication:", err);
    res.status(500).json({ 
      message: "Internal server error", 
      error: getErrorMessage(err) 
    });
  }
}

// Get worker statistics
async function getWorkerStats(req, res) {
  if (!req.user || !req.user.user_id) {
    return res.status(401).json({ message: "Authentication required. User not found." });
  }

  const worker_id = req.user.user_id;

  try {
    const result = await executeQuery(
      `SELECT 
        COUNT(DISTINCT a.application_id) as total_applications,
        COUNT(DISTINCT CASE WHEN a.status = 'accepted' THEN a.application_id END) as accepted_applications,
        COUNT(DISTINCT CASE WHEN a.status = 'rejected' THEN a.application_id END) as rejected_applications,
        COUNT(DISTINCT CASE WHEN a.status = 'submitted' THEN a.application_id END) as pending_applications,
        COUNT(DISTINCT CASE WHEN i.status = 'resolved' AND i.assigned_worker_id = $1 THEN i.issue_id END) as completed_jobs,
        COUNT(DISTINCT CASE WHEN i.status IN ('assigned', 'in_progress', 'under_review') AND i.assigned_worker_id = $1 THEN i.issue_id END) as active_jobs
      FROM applications a
      LEFT JOIN issues i ON a.issue_id = i.issue_id
      WHERE a.worker_id = $1`,
      [worker_id]
    );

    if (result.success && result.rows.length > 0) {
      const stats = result.rows[0];
      res.json({
        success: true,
        stats: {
          totalApplications: Number(stats.total_applications) || 0,
          acceptedApplications: Number(stats.accepted_applications) || 0,
          rejectedApplications: Number(stats.rejected_applications) || 0,
          pendingApplications: Number(stats.pending_applications) || 0,
          completedJobs: Number(stats.completed_jobs) || 0,
          activeJobs: Number(stats.active_jobs) || 0
        }
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: "Error fetching worker statistics",
        error: getErrorMessage(result.error) 
      });
    }
  } catch (err) {
    console.error("Error in getWorkerStats:", err);
    res.status(500).json({ 
      success: false,
      message: "Internal server error", 
      error: getErrorMessage(err) 
    });
  }
}

module.exports = {
  getMyApplications,
  updateWorkProgress,
  submitWorkProof,
  deleteApplication,
  getWorkerStats
};