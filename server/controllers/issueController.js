const { executeQuery, getConnection, executeMultipleQueries } = require('../config/database');

// Helper to create a serializable error message
const getErrorMessage = (error) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

async function createIssue(req, res) {
  const citizen_id = req.user.user_id; 

  const {
    title,
    description,
    category,
    priority = 'medium',
    full_address,
    upazila,
    district,
    image_url,
  } = req.body;

  if (!citizen_id || !title || !description || !category || !full_address || !upazila || !district) {
    return res.status(400).json({ 
      message: "Missing required fields: title, description, category, full_address, upazila, district" 
    });
  }

  let client;
  try {
    client = await getConnection();
    await client.query('BEGIN');

    // 1. Create the location and get its new ID
    const locationResult = await client.query(
      `INSERT INTO locations (upazila, district, full_address)
       VALUES ($1, $2, $3)
       RETURNING location_id`,
      [upazila, district, full_address]
    );

    const location_id = locationResult.rows[0].location_id;
    if (!location_id) {
        throw new Error('Failed to create location entry.');
    }

    // 2. Create the issue using the new location_id
    const issueResult = await client.query(
      `INSERT INTO issues (citizen_id, title, description, category, priority, location_id, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [citizen_id, title, description, category, priority, location_id, image_url || null]
    );

    await client.query('COMMIT');

    res.status(201).json({ 
      message: "Issue submitted successfully!",
      rowsAffected: issueResult.rowCount,
      fileUrl: image_url || null
    });

  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error("Error in createIssue:", err);
    res.status(500).json({ message: "Internal server error occurred", error: getErrorMessage(err) });
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function getAllIssues(req, res) {
  try {
    const result = await executeQuery(
      `SELECT 
        issue_id, title, description, category, priority, image_url, status,
        created_at, updated_at, citizen_name, citizen_email, citizen_phone,
        full_address as location_address, upazila, district, latitude, longitude
       FROM v_issues_with_details
       ORDER BY created_at DESC`
    );

    if (result.success) {
      const issues = result.rows.map((issue) => ({
        ID: issue.issue_id,
        TITLE: issue.title,
        DESCRIPTION: issue.description,
        CATEGORY: issue.category,
        PRIORITY: issue.priority,
        IMAGE_URL: issue.image_url,
        STATUS: issue.status,
        CREATED_AT: issue.created_at ? new Date(issue.created_at).toISOString() : null,
        UPDATED_AT: issue.updated_at ? new Date(issue.updated_at).toISOString() : null,
        CITIZEN_NAME: issue.citizen_name,
        CITIZEN_EMAIL: issue.citizen_email,
        CITIZEN_PHONE: issue.citizen_phone,
        LOCATION: issue.location_address,
        UPAZILA: issue.upazila,
        DISTRICT: issue.district,
        LATITUDE: issue.latitude,
        LONGITUDE: issue.longitude
      }));
      res.json({ issues });
    } else {
      const errorMessage = getErrorMessage(result.error);
      console.error("Database error:", errorMessage);
      res.status(500).json({ 
        message: "Error fetching issues",
        error: errorMessage 
      });
    }
  } catch (err) {
    console.error("Error in getAllIssues:", err);
    res.status(500).json({ message: "Internal server error occurred" });
  }
}

async function getIssueById(req, res) {
  const { id } = req.params;
  try {
    const result = await executeQuery(
      `SELECT 
        issue_id, title, description, category, priority, image_url, status,
        created_at, updated_at, citizen_name, citizen_email, citizen_phone,
        full_address as location_address, upazila, district, latitude, longitude
       FROM v_issues_with_details
       WHERE issue_id = $1`, [id]
    );

    if (result.success) {
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Issue not found" });
      }
      const issue = result.rows[0];
      const formattedIssue = {
        ID: issue.issue_id,
        TITLE: issue.title,
        DESCRIPTION: issue.description,
        CATEGORY: issue.category,
        PRIORITY: issue.priority,
        IMAGE_URL: issue.image_url,
        STATUS: issue.status,
        CREATED_AT: issue.created_at ? new Date(issue.created_at).toISOString() : null,
        UPDATED_AT: issue.updated_at ? new Date(issue.updated_at).toISOString() : null,
        CITIZEN_NAME: issue.citizen_name,
        CITIZEN_EMAIL: issue.citizen_email,
        CITIZEN_PHONE: issue.citizen_phone,
        LOCATION: issue.location_address,
        UPAZILA: issue.upazila,
        DISTRICT: issue.district,
        LATITUDE: issue.latitude,
        LONGITUDE: issue.longitude
      };
      res.json({ issue: formattedIssue });
    } else {
      const errorMessage = getErrorMessage(result.error);
      console.error("Database error:", errorMessage);
      res.status(500).json({ 
        message: "Error fetching issue",
        error: errorMessage
      });
    }
  } catch (err) {
    console.error("Error in getIssueById:", err);
    res.status(500).json({ message: "Internal server error occurred" });
  }
}

async function updateIssueStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const validStatuses = ['submitted', 'applied', 'assigned', 'in_progress', 'under_review', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be one of: " + validStatuses.join(', ')
      });
    }
    // Direct status update with validation
    const result = await executeQuery(
      `UPDATE issues SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE issue_id = $2`,
      [status, id]
    );

    if (result.success) {
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json({ 
        message: "Issue status updated successfully!"
      });
    } else {
      const errorMessage = getErrorMessage(result.error);
      console.error("Database error:", errorMessage);
      res.status(500).json({ 
        message: "Error updating issue status",
        error: errorMessage
      });
    }
  } catch (err) {
    console.error("Error in updateIssueStatus:", err);
    res.status(500).json({ message: "Internal server error occurred" });
  }
}

async function updateIssue(req, res) {
  const { id } = req.params;
  const { title, description, category, priority, location_id, image_url, status } = req.body;
  try {
    const updateFields = [];
    const params = [];
    let paramIndex = 1;
    
    if (title !== undefined) { updateFields.push(`title = $${paramIndex++}`); params.push(title); }
    if (description !== undefined) { updateFields.push(`description = $${paramIndex++}`); params.push(description); }
    if (category !== undefined) { updateFields.push(`category = $${paramIndex++}`); params.push(category); }
    if (priority !== undefined) { updateFields.push(`priority = $${paramIndex++}`); params.push(priority); }
    if (location_id !== undefined) { updateFields.push(`location_id = $${paramIndex++}`); params.push(location_id); }
    if (image_url !== undefined) { updateFields.push(`image_url = $${paramIndex++}`); params.push(image_url); }
    if (status !== undefined) { updateFields.push(`status = $${paramIndex++}`); params.push(status); }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    const sql = `UPDATE issues SET ${updateFields.join(', ')} WHERE issue_id = $${paramIndex}`;
    const result = await executeQuery(sql, params);

    if (result.success) {
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json({ message: "Issue updated successfully!", rowsAffected: result.rowCount });
    } else {
      const errorMessage = getErrorMessage(result.error);
      console.error("Database error:", errorMessage);
      res.status(500).json({ 
        message: "Error updating issue",
        error: errorMessage
      });
    }
  } catch (err) {
    console.error("Error in updateIssue:", err);
    res.status(500).json({ message: "Internal server error occurred" });
  }
}

async function deleteIssue(req, res) {
  const { id } = req.params;
  try {
    const result = await executeQuery(`DELETE FROM issues WHERE issue_id = $1`, [id]);

    if (result.success) {
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json({ message: "Issue deleted successfully!", rowsAffected: result.rowCount });
    } else {
      const errorMessage = getErrorMessage(result.error);
      console.error("Database error:", errorMessage);
      res.status(500).json({ 
        message: "Error deleting issue",
        error: errorMessage
      });
    }
  } catch (err) {
    console.error("Error in deleteIssue:", err);
    res.status(500).json({ message: "Internal server error occurred" });
  }
}

async function getUserIssueStats(req, res) {
  const citizen_id = req.user.user_id;
  
  try {
    const result = await executeQuery(
      `SELECT 
        COUNT(*) as total_issues,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_issues,
        COUNT(CASE WHEN status IN ('submitted', 'applied', 'under_review') THEN 1 END) as pending_issues,
        COUNT(CASE WHEN status IN ('assigned', 'in_progress') THEN 1 END) as in_progress_issues
      FROM issues 
      WHERE citizen_id = $1`, 
      [citizen_id]
    );

    if (result.success && result.rows.length > 0) {
      const stats = result.rows[0];
      res.json({ 
        success: true,
        stats: {
          totalIssues: Number(stats.total_issues) || 0,
          resolvedIssues: Number(stats.resolved_issues) || 0,
          pendingIssues: Number(stats.pending_issues) || 0,
          inProgressIssues: Number(stats.in_progress_issues) || 0
        }
      });
    } else {
      const errorMessage = getErrorMessage(result.error);
      console.error("Database error:", errorMessage);
      res.status(500).json({ 
        success: false,
        message: "Error fetching user statistics",
        error: errorMessage
      });
    }
  } catch (err) {
    console.error("Error in getUserIssueStats:", err);
    res.status(500).json({ 
      success: false,
      message: "Internal server error occurred",
      error: getErrorMessage(err)
    });
  }
}

async function getUserRecentIssues(req, res) {
  const citizen_id = req.user.user_id;
  const limit = parseInt(req.query.limit) || 5;
  
  try {
    const result = await executeQuery(
      `SELECT 
        i.issue_id, i.title, i.description, i.category, i.priority, i.image_url, i.status,
        i.created_at, i.updated_at, l.full_address as location_address, l.upazila, l.district
      FROM issues i
      LEFT JOIN locations l ON i.location_id = l.location_id
      WHERE i.citizen_id = $1
      ORDER BY i.created_at DESC
      LIMIT $2`, 
      [citizen_id, limit]
    );

    if (result.success) {
      const issues = result.rows.map((issue) => ({
        issue_id: issue.issue_id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        priority: issue.priority,
        image_url: issue.image_url,
        status: issue.status,
        created_at: issue.created_at ? new Date(issue.created_at).toISOString() : null,
        updated_at: issue.updated_at ? new Date(issue.updated_at).toISOString() : null,
        location: issue.location_address,
        upazila: issue.upazila,
        district: issue.district
      }));
      
      res.json({ 
        success: true,
        issues
      });
    } else {
      const errorMessage = getErrorMessage(result.error);
      console.error("Database error:", errorMessage);
      res.status(500).json({ 
        success: false,
        message: "Error fetching recent issues",
        error: errorMessage
      });
    }
  } catch (err) {
    console.error("Error in getUserRecentIssues:", err);
    res.status(500).json({ 
      success: false,
      message: "Internal server error occurred",
      error: getErrorMessage(err)
    });
  }
}

// Worker applies for an issue - MAIN APPLICATION ENDPOINT
async function applyForIssue(req, res) {
  const { id: issue_id } = req.params;
  const worker_id = req.user.user_id;
  const { estimated_cost, estimated_time, proposal_description } = req.body;

  // Validation
  if (!estimated_cost || !estimated_time || !proposal_description) {
    return res.status(400).json({ 
      message: "Missing required fields: estimated_cost, estimated_time, proposal_description" 
    });
  }

  if (parseFloat(estimated_cost) <= 0) {
    return res.status(400).json({ 
      message: "Estimated cost must be greater than 0" 
    });
  }

  if (!proposal_description.trim()) {
    return res.status(400).json({ 
      message: "Proposal description cannot be empty" 
    });
  }

  try {
    // Check if issue exists and is available for applications
    const issueCheck = await executeQuery(
      `SELECT status FROM issues WHERE issue_id = $1`,
      [issue_id]
    );

    if (issueCheck.rows.length === 0) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const currentStatus = issueCheck.rows[0].status;
    if (!['submitted', 'applied'].includes(currentStatus)) {
      return res.status(400).json({ message: "Issue is not available for applications." });
    }

    const existingApp = await executeQuery(
      `SELECT application_id FROM applications WHERE issue_id = $1 AND worker_id = $2`,
      [issue_id, worker_id]
    );

    if (existingApp.rows.length > 0) {
      return res.status(409).json({ message: "You have already applied for this issue" });
    }

    // --- Step 2: Build the list of queries for the transaction ---
    const queriesToRun = [];

    // Add the INSERT query
    queriesToRun.push({
      sql: `INSERT INTO applications (issue_id, worker_id, estimated_cost, estimated_time, proposal_description)
            VALUES ($1, $2, $3, $4, $5)`,
      binds: [
        issue_id,
        worker_id,
        parseFloat(estimated_cost),
        estimated_time.trim(),
        proposal_description.trim()
      ]
    });

    // Conditionally add the UPDATE query
    if (currentStatus === 'submitted') {
      queriesToRun.push({
        sql: `UPDATE issues SET status = 'applied', updated_at = CURRENT_TIMESTAMP WHERE issue_id = $1`,
        binds: [issue_id]
      });
    }
    
    // --- Step 3: Execute the transaction ---
    const transactionResult = await executeMultipleQueries(queriesToRun);

    if (transactionResult.success) {
      res.status(201).json({
        message: "Application submitted successfully!",
        // The result of the first query (the INSERT) will have rowCount
        rowsAffected: transactionResult.results[0].rowCount 
      });
    } else {
      // Throw the error to be caught by the catch block
      throw transactionResult.error;
    }

  } catch (err) {
    console.error("Error in applyForIssue:", err);
    if (err.code === '23505') { // PostgreSQL unique constraint violation
      return res.status(409).json({ message: "You have already applied for this issue" });
    }
    res.status(500).json({ message: "Internal server error occurred", error: err.message });
  }
}

// Get applications for an issue
async function getIssueApplications(req, res) {
  const { id: issue_id } = req.params;
  
  try {
    const result = await executeQuery(
      `SELECT 
        a.application_id, a.issue_id, a.worker_id, a.estimated_cost, a.estimated_time,
        a.proposal_description, a.status, a.feedback, a.applied_at, a.reviewed_at,
        u.name as worker_name, u.email as worker_email, u.phone as worker_phone
      FROM applications a
      LEFT JOIN users u ON a.worker_id = u.user_id
      WHERE a.issue_id = $1
      ORDER BY a.applied_at DESC`,
      [issue_id]
    );

    if (result.success) {
      const applications = result.rows.map((app) => ({
        application_id: app.application_id,
        issue_id: app.issue_id,
        worker_id: app.worker_id,
        estimated_cost: parseFloat(app.estimated_cost),
        estimated_time: app.estimated_time,
        proposal_description: app.proposal_description,
        status: app.status,
        feedback: app.feedback,
        applied_at: app.applied_at ? new Date(app.applied_at).toISOString() : null,
        reviewed_at: app.reviewed_at ? new Date(app.reviewed_at).toISOString() : null,
        worker_name: app.worker_name,
        worker_email: app.worker_email,
        worker_phone: app.worker_phone
      }));
      
      res.json({ applications });
    } else {
      const errorMessage = getErrorMessage(result.error);
      console.error("Database error:", errorMessage);
      res.status(500).json({ 
        message: "Error fetching applications",
        error: errorMessage
      });
    }
  } catch (err) {
    console.error("Error in getIssueApplications:", err);
    res.status(500).json({ message: "Internal server error occurred" });
  }
}

async function getPendingApplications(req, res) {
  try {
    const result = await executeQuery(
      `SELECT 
        a.application_id, a.issue_id, a.worker_id, a.estimated_cost, a.estimated_time,
        a.proposal_description, a.status as application_status, a.applied_at,
        i.title as issue_title, i.description as issue_description, i.image_url as issue_image,
        l.full_address as location,
        u.name as worker_name, u.phone as worker_phone
      FROM applications a
      JOIN issues i ON a.issue_id = i.issue_id
      JOIN users u ON a.worker_id = u.user_id
      JOIN locations l ON i.location_id = l.location_id
      WHERE a.status = 'submitted'
      ORDER BY i.issue_id, a.applied_at DESC`
    );

    if (result.success) {
      const applications = result.rows.map((app) => ({
        application_id: app.application_id,
        job_id: app.issue_id,
        job_title: app.issue_title,
        issue_description: app.issue_description,
        issue_image: app.issue_image,
        location: app.location,
        worker: {
          id: app.worker_id,
          name: app.worker_name,
          phone: app.worker_phone,
        },
        estimated_cost: parseFloat(app.estimated_cost),
        estimated_time: app.estimated_time,
        proposal: app.proposal_description,
        applied_at: app.applied_at ? new Date(app.applied_at).toISOString() : null,
        status: 'pending'
      }));
      res.json({ applications });
    } else {
      const errorMessage = getErrorMessage(result.error);
      console.error("Database error:", errorMessage);
      res.status(500).json({ 
        message: "Error fetching pending applications",
        error: errorMessage
      });
    }
  } catch (err) {
    console.error("Error in getPendingApplications:", err);
    res.status(500).json({ message: "Internal server error occurred" });
  }
}

// Accept an application (admin only)
async function acceptIssueApplication(req, res) {
  const { id: issue_id, applicationId: application_id } = req.params;
  const admin_id = req.user.user_id;
  const { feedback } = req.body;

  try {
    // Verify application exists and get worker info
    const appCheck = await executeQuery(
      `SELECT worker_id, status FROM applications
       WHERE application_id = $1 AND issue_id = $2`,
      [application_id, issue_id]
    );

    if (!appCheck.success) {
      return res.status(500).json({ 
        message: "Error checking application", 
        error: getErrorMessage(appCheck.error) 
      });
    }

    if (appCheck.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    const { worker_id, status } = appCheck.rows[0];
    
    if (status === 'accepted') {
      return res.status(400).json({ message: "Application already accepted" });
    }

    if (!['submitted'].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot accept application. Current status: ${status}. Application must be 'submitted'.` 
      });
    }

    // Use transaction to handle acceptance (accept application + assign worker to issue + reject other applications)
    const queries = [
      // Accept the specific application
      {
        sql: `UPDATE applications
              SET status = 'accepted', 
                  feedback = $1, 
                  reviewed_by = $2, 
                  reviewed_at = CURRENT_TIMESTAMP
              WHERE application_id = $3 AND issue_id = $4`,
        binds: [feedback, admin_id, application_id, issue_id]
      },
      // Assign worker to the issue
      {
        sql: `UPDATE issues
              SET assigned_worker_id = $1, 
                  status = 'assigned', 
                  updated_at = CURRENT_TIMESTAMP
              WHERE issue_id = $2`,
        binds: [worker_id, issue_id]
      },
      // Reject all other pending applications for this issue
      {
        sql: `UPDATE applications
              SET status = 'rejected', 
                  feedback = 'Application rejected due to another worker being selected', 
                  reviewed_by = $1, 
                  reviewed_at = CURRENT_TIMESTAMP
              WHERE issue_id = $2 
                AND application_id != $3 
                AND status IN ('applied', 'under_review')`,
        binds: [admin_id, issue_id, application_id]
      }
    ];

    const transactionResult = await executeMultipleQueries(queries);

    if (!transactionResult.success) {
      console.error("Transaction failed:", transactionResult.error);
      return res.status(500).json({
        message: "Error accepting application",
        error: getErrorMessage(transactionResult.error)
      });
    }

    // Check if the main application was actually updated
    const acceptResult = transactionResult.results[0];
    if (acceptResult.rowCount === 0) {
      return res.status(404).json({ message: "Application not found or already processed" });
    }

    res.json({
      message: "Application accepted successfully! Issue has been assigned to the worker.",
      acceptedApplication: {
        applicationId: application_id,
        issueId: issue_id,
        workerId: worker_id
      },
      rowsAffected: acceptResult.rowCount,
      otherApplicationsRejected: transactionResult.results[2].rowCount
    });

  } catch (err) {
    console.error("Error in acceptIssueApplication:", err);
    res.status(500).json({
      message: "Internal server error occurred",
      error: getErrorMessage(err)
    });
  }
}

// Reject an application
async function rejectIssueApplication(req, res) {
  const { id: issue_id, applicationId: application_id } = req.params;
  const admin_id = req.user.user_id;
  const { feedback } = req.body;

  if (!feedback || feedback.trim().length === 0) {
    return res.status(400).json({ message: "Feedback is required when rejecting an application" });
  }

  try {
    // First check if application exists and its current status
    const appCheck = await executeQuery(
      `SELECT status FROM applications
       WHERE application_id = $1 AND issue_id = $2`,
      [application_id, issue_id]
    );

    if (!appCheck.success) {
      return res.status(500).json({ 
        message: "Error checking application", 
        error: getErrorMessage(appCheck.error) 
      });
    }

    if (appCheck.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    const currentStatus = appCheck.rows[0].status;
    
    if (currentStatus === 'rejected') {
      return res.status(400).json({ message: "Application is already rejected" });
    }

    if (currentStatus === 'accepted') {
      return res.status(400).json({ message: "Cannot reject an accepted application" });
    }

    if (!['submitted'].includes(currentStatus)) {
      return res.status(400).json({ 
        message: `Cannot reject application. Current status: ${currentStatus}. Application must be 'applied' or 'under_review'.` 
      });
    }

    // Reject the application
    const result = await executeQuery(
      `UPDATE applications
       SET status = 'rejected', 
           feedback = $1, 
           reviewed_by = $2, 
           reviewed_at = CURRENT_TIMESTAMP
       WHERE application_id = $3 AND issue_id = $4`,
      [feedback.trim(), admin_id, application_id, issue_id]
    );

    if (!result.success) {
      const errorMessage = getErrorMessage(result.error);
      console.error("Database error:", errorMessage);
      return res.status(500).json({
        message: "Error rejecting application",
        error: errorMessage
      });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Application not found or already processed" });
    }

    res.json({
      message: "Application rejected successfully!",
      rejectedApplication: {
        applicationId: application_id,
        issueId: issue_id,
        feedback: feedback.trim()
      },
      rowsAffected: result.rowCount
    });

  } catch (err) {
    console.error("Error in rejectIssueApplication:", err);
    res.status(500).json({ 
      message: "Internal server error occurred",
      error: getErrorMessage(err)
    });
  }
}

module.exports = { 
  createIssue, 
  getAllIssues, 
  getIssueById,
  updateIssueStatus,
  updateIssue,
  deleteIssue,
  getUserIssueStats,
  getUserRecentIssues,
  applyForIssue,
  getIssueApplications,
  getPendingApplications,
  acceptIssueApplication,
  rejectIssueApplication
};