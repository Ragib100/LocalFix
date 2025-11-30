-- LocalFix Database Schema for Ratings

CREATE TABLE ratings (
    rating_id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL,
    citizen_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    rating NUMERIC(2,1) NOT NULL,
    review_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_ratings_job FOREIGN KEY (issue_id) REFERENCES issues(issue_id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_citizen FOREIGN KEY (citizen_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_worker FOREIGN KEY (worker_id) REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT chk_ratings_rating CHECK (rating >= 1 AND rating <= 5),
    
    -- Ensure only one rating per job
    CONSTRAINT uk_ratings_job UNIQUE (issue_id)
);

-- Indexes
CREATE INDEX idx_ratings_citizen ON ratings(citizen_id);
CREATE INDEX idx_ratings_worker ON ratings(worker_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);