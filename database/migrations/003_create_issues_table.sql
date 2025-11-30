
-- Updated issues table with proper status workflow
CREATE TABLE issues (
    issue_id SERIAL PRIMARY KEY,
    citizen_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    location_id INTEGER NOT NULL,
    image_url VARCHAR(500),
    -- Updated status to reflect proper workflow
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'applied', 'assigned', 'in_progress', 'under_review', 'resolved', 'closed')),
    assigned_worker_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_issues_citizen FOREIGN KEY (citizen_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_issues_location FOREIGN KEY (location_id) REFERENCES locations(location_id),
    CONSTRAINT fk_issues_assigned_worker FOREIGN KEY (assigned_worker_id) REFERENCES users(user_id)
);

-- Indexes for better performance
CREATE INDEX idx_issues_citizen ON issues(citizen_id);
CREATE INDEX idx_issues_location ON issues(location_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_assigned_worker ON issues(assigned_worker_id);

-- Trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION trg_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION trg_issues_updated_at();

-- Status workflow explanation:
-- 1. submitted: Issue created by citizen
-- 2. applied: Workers have applied for the issue
-- 3. assigned: Admin assigned the issue to a specific worker
-- 4. in_progress: Worker started working on the issue
-- 5. under_review: Worker submitted proof, waiting for admin verification
-- 6. resolved: Admin verified the work is completed successfully
-- 7. closed: Issue is completely closed (payment processed, etc.)