-- Withdrawals table for worker payouts
CREATE TABLE withdrawals (
    withdrawal_id SERIAL PRIMARY KEY,
    worker_id INTEGER NOT NULL,
    method VARCHAR(30) NOT NULL CHECK (method IN ('bkash','nagad','rocket','sonali_bank')),
    account_number VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing','successful','failed')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_withdrawals_worker FOREIGN KEY (worker_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_withdrawals_worker ON withdrawals(worker_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_requested ON withdrawals(requested_at);

-- Trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION trg_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION trg_withdrawals_updated_at();

-- View combining issues with citizen and location for convenient reads
CREATE OR REPLACE VIEW v_issues_with_details AS
SELECT 
  i.issue_id,
  i.title,
  i.description,
  i.category,
  i.priority,
  i.status,
  i.image_url,
  i.assigned_worker_id,
  i.created_at,
  i.updated_at,
  l.full_address,
  l.upazila,
  l.district,
  l.latitude,
  l.longitude,
  u.name   AS citizen_name,
  u.phone  AS citizen_phone,
  u.email  AS citizen_email
FROM issues i
LEFT JOIN users u ON i.citizen_id = u.user_id
LEFT JOIN locations l ON i.location_id = l.location_id;

-- Function: get_issue_count_by_status
-- Returns number of issues for a worker in a given status.
CREATE OR REPLACE FUNCTION get_issue_count_by_status(
    p_worker_id INTEGER,
    p_status VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM issues
    WHERE assigned_worker_id = p_worker_id
      AND status = p_status;
    RETURN COALESCE(v_count, 0);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
    WHEN OTHERS THEN
        -- Basic exception handling
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Procedure: set_issue_status_safe
-- Safely sets issue status with validation and exception handling.
CREATE OR REPLACE FUNCTION set_issue_status_safe(
    p_issue_id INTEGER,
    p_status VARCHAR
) RETURNS VOID AS $$
DECLARE
    v_valid INTEGER;
    v_row_count INTEGER;
BEGIN
    -- Validate target status is allowed
    SELECT COUNT(*) INTO v_valid
    FROM (VALUES 
        ('submitted'),
        ('applied'),
        ('assigned'),
        ('in_progress'),
        ('under_review'),
        ('resolved'),
        ('closed')
    ) AS valid_statuses(s)
    WHERE s = p_status;

    IF v_valid = 0 THEN
        RAISE EXCEPTION 'Invalid status';
    END IF;

    UPDATE issues
    SET status = p_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE issue_id = p_issue_id;
    
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    
    IF v_row_count = 0 THEN
        RAISE EXCEPTION 'Issue not found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise with a consistent error message
        RAISE EXCEPTION 'Failed to set status: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Summary view demonstrating GROUP BY: worker earnings by status
CREATE OR REPLACE VIEW v_worker_payment_summary AS
SELECT 
    p.worker_id,
    p.payment_status,
    COUNT(*) AS payment_count,
    SUM(p.amount) AS total_amount,
    MIN(p.payment_date) AS first_payment,
    MAX(p.payment_date) AS last_payment
FROM payments p
GROUP BY p.worker_id, p.payment_status;
