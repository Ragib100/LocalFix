
CREATE TABLE issue_proofs (
    proof_id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    proof_photo VARCHAR(500),
    proof_description TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    verification_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    admin_feedback TEXT,
    verified_by INTEGER, -- Admin who verified the proof
    
    -- Foreign key constraints
    CONSTRAINT fk_proofs_issue FOREIGN KEY (issue_id) REFERENCES issues(issue_id) ON DELETE CASCADE,
    CONSTRAINT fk_proofs_worker FOREIGN KEY (worker_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_proofs_verified_by FOREIGN KEY (verified_by) REFERENCES users(user_id),
    
    -- Unique constraint: only one proof per issue
    CONSTRAINT uk_proofs_issue UNIQUE (issue_id)
);

-- Create indexes
CREATE INDEX idx_proofs_worker ON issue_proofs(worker_id);
CREATE INDEX idx_proofs_status ON issue_proofs(verification_status);
CREATE INDEX idx_proofs_submitted_at ON issue_proofs(submitted_at);
CREATE INDEX idx_proofs_verified_by ON issue_proofs(verified_by);

-- Business logic validation through triggers
CREATE OR REPLACE FUNCTION trg_proof_submitted()
RETURNS TRIGGER AS $$
DECLARE
    current_issue_status VARCHAR(20);
    assigned_worker INTEGER;
    worker_type VARCHAR(20);
BEGIN
    -- Validate that the worker submitting proof is actually a worker
    SELECT user_type INTO worker_type 
    FROM users WHERE user_id = NEW.worker_id;
    
    IF worker_type != 'worker' THEN
        RAISE EXCEPTION 'Only workers can submit issue proofs';
    END IF;
    
    -- Get current issue status and assigned worker
    SELECT status, assigned_worker_id 
    INTO current_issue_status, assigned_worker 
    FROM issues WHERE issue_id = NEW.issue_id;
    
    -- Validate that this worker is assigned to this issue
    IF assigned_worker IS NULL OR assigned_worker != NEW.worker_id THEN
        RAISE EXCEPTION 'Only the assigned worker can submit proof for this issue';
    END IF;
    
    -- Validate issue status allows proof submission
    IF current_issue_status NOT IN ('assigned', 'in_progress') THEN
        RAISE EXCEPTION 'Can only submit proof for issues that are assigned or in progress';
    END IF;
    
    -- After proof submission, update the related issue's status to 'under_review'.
    UPDATE issues 
    SET status = 'under_review', updated_at = CURRENT_TIMESTAMP
    WHERE issue_id = NEW.issue_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proof_submitted
    BEFORE INSERT ON issue_proofs
    FOR EACH ROW
    EXECUTE FUNCTION trg_proof_submitted();

-- Trigger for proof verification with admin validation
CREATE OR REPLACE FUNCTION trg_proof_verified()
RETURNS TRIGGER AS $$
BEGIN
    -- Set verification timestamp for approved or rejected proofs
    IF NEW.verification_status IN ('approved', 'rejected') THEN
        NEW.verified_at := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proof_verified
    BEFORE UPDATE OF verification_status ON issue_proofs
    FOR EACH ROW
    EXECUTE FUNCTION trg_proof_verified();

-- Separate trigger to validate admin permissions
CREATE OR REPLACE FUNCTION trg_proof_verified_admin_check()
RETURNS TRIGGER AS $$
DECLARE
    admin_type VARCHAR(20);
BEGIN
    -- Validate that only admins can verify proofs
    IF NEW.verified_by IS NOT NULL THEN
        SELECT user_type INTO admin_type 
        FROM users WHERE user_id = NEW.verified_by;
        
        IF admin_type != 'admin' THEN
            RAISE EXCEPTION 'Only admins can verify issue proofs';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proof_verified_admin_check
    BEFORE UPDATE OF verified_by ON issue_proofs
    FOR EACH ROW
    EXECUTE FUNCTION trg_proof_verified_admin_check();

-- Trigger to update issue status after proof verification
CREATE OR REPLACE FUNCTION trg_proof_verified_after()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status = 'approved' THEN
        -- Update issue status to 'resolved'
        UPDATE issues 
        SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
        WHERE issue_id = NEW.issue_id;
        
    ELSIF NEW.verification_status = 'rejected' THEN
        -- If proof is rejected, issue goes back to in_progress
        UPDATE issues 
        SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
        WHERE issue_id = NEW.issue_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_proof_verified_after
    AFTER UPDATE OF verification_status ON issue_proofs
    FOR EACH ROW
    EXECUTE FUNCTION trg_proof_verified_after();