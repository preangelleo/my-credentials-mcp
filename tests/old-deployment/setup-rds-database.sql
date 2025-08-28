-- Setup script for AWS RDS PostgreSQL database
-- This creates the local_credentials table and required functions

-- Create the main credentials table
CREATE TABLE IF NOT EXISTS local_credentials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at column
CREATE TRIGGER update_local_credentials_updated_at 
    BEFORE UPDATE ON local_credentials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a test record
INSERT INTO local_credentials (name, value, description, notes) VALUES 
('test_credential', 'test_value_123', 'Test credential for MCP server', 'Created during initial setup')
ON CONFLICT (name) DO NOTHING;

-- Show table structure
\d local_credentials;

-- Show current data
SELECT * FROM local_credentials;

-- Show database info
SELECT current_database(), current_user, version();