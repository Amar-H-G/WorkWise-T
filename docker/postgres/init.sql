-- WorkWise PostgreSQL initialization script
-- This runs when the Docker container first starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'Asia/Kolkata';
