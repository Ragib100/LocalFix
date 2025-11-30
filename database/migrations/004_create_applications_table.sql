-- Modified applications table with reviewed_by column

CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    estimated_cost NUMERIC(10,2) NOT NULL,
    estimated_time VARCHAR(50) NOT NULL,
    proposal_description TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected')),
    feedback TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER, -- Admin who reviewed the application
    
    -- Foreign key constraints
    CONSTRAINT fk_applications_issue FOREIGN KEY (issue_id) REFERENCES issues(issue_id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_worker FOREIGN KEY (worker_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(user_id),
    
    -- Check constraints
    CONSTRAINT chk_applications_cost CHECK (estimated_cost > 0),
    
    -- Unique constraint to prevent duplicate applications
    CONSTRAINT uk_applications_issue_worker UNIQUE (issue_id, worker_id)
);

-- Create indexes
CREATE INDEX idx_applications_issue ON applications(issue_id);
CREATE INDEX idx_applications_worker ON applications(worker_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at);
CREATE INDEX idx_applications_reviewed_by ON applications(reviewed_by);

-- Trigger function for auto-updating reviewed_at when status changes
CREATE OR REPLACE FUNCTION trg_applications_reviewed_at()
RETURNS TRIGGER AS $$
DECLARE
    admin_type VARCHAR(20);
BEGIN
    -- Only proceed if status is being changed to accepted or rejected
    IF NEW.status IN ('accepted', 'rejected') THEN
        -- Validate that only admins can change status to accepted/rejected
        IF NEW.reviewed_by IS NOT NULL THEN
            SELECT user_type INTO admin_type 
            FROM users WHERE user_id = NEW.reviewed_by;
            
            IF admin_type != 'admin' THEN
                RAISE EXCEPTION 'Only admins can review applications';
            END IF;
        END IF;
        
        NEW.reviewed_at := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_applications_reviewed_at
    BEFORE UPDATE OF status ON applications
    FOR EACH ROW
    EXECUTE FUNCTION trg_applications_reviewed_at();

-- Business logic validation through triggers
CREATE OR REPLACE FUNCTION trg_applications_insert_validate()
RETURNS TRIGGER AS $$
DECLARE
    worker_type VARCHAR(20);
    issue_status VARCHAR(20);
BEGIN
    -- Validate that applicant is a worker
    SELECT user_type INTO worker_type 
    FROM users WHERE user_id = NEW.worker_id;
    
    IF worker_type != 'worker' THEN
        RAISE EXCEPTION 'Only workers can submit applications';
    END IF;
    
    -- Validate that issue is open for applications (submitted or applied status)
    SELECT status INTO issue_status 
    FROM issues WHERE issue_id = NEW.issue_id;
    
    IF issue_status NOT IN ('submitted', 'applied') THEN
        RAISE EXCEPTION 'Issue is not open for applications';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_applications_insert_validate
    BEFORE INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION trg_applications_insert_validate();

-- Trigger for application acceptance workflow
CREATE OR REPLACE FUNCTION trg_applications_status_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if an application is being accepted
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        -- Update the associated issue to 'assigned' status
        UPDATE issues
        SET status = 'assigned',
            assigned_worker_id = NEW.worker_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE issue_id = NEW.issue_id;
        
        -- Reject all other pending applications for the same issue
        UPDATE applications
        SET status = 'rejected',
            reviewed_at = CURRENT_TIMESTAMP,
            reviewed_by = NEW.reviewed_by
        WHERE issue_id = NEW.issue_id
          AND application_id != NEW.application_id
          AND status IN ('submitted', 'under_review');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_applications_status_update
    AFTER UPDATE OF status ON applications
    FOR EACH ROW
    EXECUTE FUNCTION trg_applications_status_update();