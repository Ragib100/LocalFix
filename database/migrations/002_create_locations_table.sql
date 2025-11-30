
CREATE TABLE locations (
    location_id SERIAL PRIMARY KEY,
    upazila VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    full_address VARCHAR(500) NOT NULL,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for location searches
CREATE INDEX idx_locations_district ON locations(district);
CREATE INDEX idx_locations_upazila ON locations(upazila);