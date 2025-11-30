-- This table records payouts from admin (system) to workers.
-- From worker perspective, these are earnings. From admin perspective, payouts.

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL,
    citizen_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'card')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(100),
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_payments_issue FOREIGN KEY (issue_id) REFERENCES issues(issue_id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_citizen FOREIGN KEY (citizen_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_worker FOREIGN KEY (worker_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    
    -- Ensure only one payment per issue
    CONSTRAINT uk_payments_issue UNIQUE (issue_id)
);

-- Indexes
CREATE INDEX idx_payments_citizen ON payments(citizen_id);
CREATE INDEX idx_payments_worker ON payments(worker_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Sequence to generate transaction identifiers
CREATE SEQUENCE IF NOT EXISTS seq_payment_tx START WITH 1000 INCREMENT BY 1;

-- Trigger function to auto-populate transaction_id using the sequence when not provided
CREATE OR REPLACE FUNCTION trg_payments_set_tx()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_id IS NULL THEN
        NEW.transaction_id := 'TX-' || nextval('seq_payment_tx');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_set_tx
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION trg_payments_set_tx();

-- Trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION trg_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION trg_payments_updated_at();

-- Trigger to update issue status when payment is completed
CREATE OR REPLACE FUNCTION trg_payment_completed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'completed' THEN
        -- Update issue status to 'closed'
        UPDATE issues 
        SET status = 'closed', updated_at = CURRENT_TIMESTAMP
        WHERE issue_id = NEW.issue_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_completed
    AFTER INSERT OR UPDATE OF payment_status ON payments
    FOR EACH ROW
    EXECUTE FUNCTION trg_payment_completed();