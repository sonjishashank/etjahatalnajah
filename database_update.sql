-- =====================================================
-- DATABASE UPDATE SCRIPT FOR VEHICLE HANDOVER SYSTEM
-- =====================================================
-- This script adds new columns for the recent updates:
-- 1. vehicle_type_other (for "OTHER" vehicle type specification)
-- 2. notes (for additional notes field)
-- 3. Resets all data completely
-- =====================================================

-- First, let's backup the current structure (optional - uncomment if needed)
-- CREATE TABLE vehicle_submissions_backup AS SELECT * FROM vehicle_submissions;
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- =====================================================
-- STEP 1: CLEAR ALL EXISTING DATA
-- =====================================================

-- Delete all vehicle submissions
DELETE FROM vehicle_submissions;

-- Reset auto-increment counter for vehicle_submissions
ALTER TABLE vehicle_submissions AUTO_INCREMENT = 1;

-- Delete all users except admin (optional - uncomment if you want to keep admin)
-- DELETE FROM users WHERE role != 'admin';

-- Or delete all users completely (uncomment if you want to reset everything)
-- DELETE FROM users;
-- ALTER TABLE users AUTO_INCREMENT = 1;

-- =====================================================
-- STEP 2: ALTER VEHICLE_SUBMISSIONS TABLE
-- =====================================================

-- Add new columns for the recent updates
ALTER TABLE vehicle_submissions 
ADD COLUMN vehicle_type_other VARCHAR(255) NULL AFTER vehicle_type,
ADD COLUMN notes TEXT NULL AFTER remarks;

-- Update the table structure to ensure all columns are properly set
ALTER TABLE vehicle_submissions MODIFY COLUMN handover_date DATE NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN plate_no VARCHAR(50) NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN vehicle_type VARCHAR(100) NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN vehicle_type_other VARCHAR(255) NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN handover_by VARCHAR(255) NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN takeover_by VARCHAR(255) NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN id_no VARCHAR(100) NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN odo_meter_reading INT NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN registration_card ENUM('yes', 'no') NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN vehicle_authorization ENUM('complete', 'incomplete') NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN remarks TEXT NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN notes TEXT NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN contact_no VARCHAR(20) NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN vehicle_pictures JSON NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN accessories_pictures JSON NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN handover_signature VARCHAR(500) NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN takeover_signature VARCHAR(500) NULL;
ALTER TABLE vehicle_submissions MODIFY COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';

-- =====================================================
-- STEP 3: ENSURE USERS TABLE IS PROPERLY STRUCTURED
-- =====================================================

-- Update users table structure
ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL UNIQUE;
ALTER TABLE users MODIFY COLUMN name VARCHAR(255) NULL;
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user') DEFAULT 'user';
ALTER TABLE users MODIFY COLUMN designation VARCHAR(255) NULL;
ALTER TABLE users MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- =====================================================
-- STEP 4: CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Add indexes for better query performance
CREATE INDEX idx_vehicle_submissions_user_id ON vehicle_submissions(user_id);
CREATE INDEX idx_vehicle_submissions_approval_status ON vehicle_submissions(approval_status);
CREATE INDEX idx_vehicle_submissions_handover_date ON vehicle_submissions(handover_date);
CREATE INDEX idx_vehicle_submissions_vehicle_type ON vehicle_submissions(vehicle_type);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- STEP 5: INSERT DEFAULT ADMIN USER (OPTIONAL)
-- =====================================================

-- Insert a default admin user (modify credentials as needed)
-- Uncomment and modify the following lines if you want to create a default admin
/*
INSERT INTO users (email, name, role, designation, created_at, updated_at) 
VALUES (
    'admin@company.com', 
    'System Administrator', 
    'admin', 
    'Administrator', 
    NOW(), 
    NOW()
) ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    role = VALUES(role),
    designation = VALUES(designation),
    updated_at = NOW();
*/

-- =====================================================
-- STEP 6: VERIFY THE STRUCTURE
-- =====================================================

-- Show the updated table structure
DESCRIBE vehicle_submissions;
DESCRIBE users;

-- Show table information
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ('vehicle_submissions', 'users')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if new columns were added successfully
SELECT COUNT(*) as total_submissions FROM vehicle_submissions;
SELECT COUNT(*) as total_users FROM users;

-- Verify new columns exist
SHOW COLUMNS FROM vehicle_submissions LIKE 'vehicle_type_other';
SHOW COLUMNS FROM vehicle_submissions LIKE 'notes';

-- =====================================================
-- CLEANUP UPLOADED FILES (OPTIONAL)
-- =====================================================

-- Note: You may also want to clean up uploaded files from the file system
-- This needs to be done manually or through a script:
-- 1. Delete files in: public/uploads/
-- 2. Delete files in: public/signatures/
-- 
-- Example commands (run from your project root):
-- rm -rf public/uploads/*
-- rm -rf public/signatures/*
-- 
-- Or on Windows:
-- del /Q public\uploads\*
-- del /Q public\signatures\*

-- =====================================================
-- SCRIPT COMPLETION
-- =====================================================

SELECT 'Database update completed successfully!' as status;