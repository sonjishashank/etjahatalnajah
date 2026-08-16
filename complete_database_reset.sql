-- =====================================================
-- COMPLETE DATABASE RESET AND UPDATE SCRIPT
-- =====================================================
-- This script will:
-- 1. Add new columns for recent updates
-- 2. Reset all data completely (OPTIONAL)
-- 3. Optimize table structure
-- 4. Create necessary indexes
-- =====================================================

-- Set SQL mode for better compatibility
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA (OPTIONAL)
-- =====================================================
-- Uncomment these lines if you want to backup before reset
/*
CREATE TABLE IF NOT EXISTS vehicle_submissions_backup AS 
SELECT * FROM vehicle_submissions;

CREATE TABLE IF NOT EXISTS users_backup AS 
SELECT * FROM users;
*/

-- =====================================================
-- STEP 2: ADD NEW COLUMNS
-- =====================================================

-- Add vehicle_type_other column (for "OTHER" vehicle type)
ALTER TABLE vehicle_submissions 
ADD COLUMN IF NOT EXISTS vehicle_type_other VARCHAR(255) NULL 
COMMENT 'Additional info when vehicle_type is OTHER' 
AFTER vehicle_type;

-- Add notes column (for additional notes)
ALTER TABLE vehicle_submissions 
ADD COLUMN IF NOT EXISTS notes TEXT NULL 
COMMENT 'Additional notes and comments' 
AFTER remarks;

-- =====================================================
-- STEP 3: RESET ALL DATA (UNCOMMENT IF NEEDED)
-- =====================================================
-- WARNING: This will delete all existing data!
-- Uncomment the following lines only if you want to reset everything

/*
-- Delete all vehicle submissions
DELETE FROM vehicle_submissions;

-- Reset auto-increment counter
ALTER TABLE vehicle_submissions AUTO_INCREMENT = 1;

-- Delete all users (or keep admin users)
-- DELETE FROM users WHERE role != 'admin';  -- Keep admin users
-- DELETE FROM users;  -- Delete all users
-- ALTER TABLE users AUTO_INCREMENT = 1;
*/

-- =====================================================
-- STEP 4: OPTIMIZE TABLE STRUCTURE
-- =====================================================

-- Update vehicle_submissions table structure
ALTER TABLE vehicle_submissions 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY,
MODIFY COLUMN user_id INT NOT NULL,
MODIFY COLUMN handover_date DATE NULL,
MODIFY COLUMN plate_no VARCHAR(50) NULL,
MODIFY COLUMN vehicle_type VARCHAR(100) NULL,
MODIFY COLUMN vehicle_type_other VARCHAR(255) NULL,
MODIFY COLUMN handover_by VARCHAR(255) NULL,
MODIFY COLUMN takeover_by VARCHAR(255) NULL,
MODIFY COLUMN id_no VARCHAR(100) NULL,
MODIFY COLUMN odo_meter_reading INT NULL,
MODIFY COLUMN registration_card ENUM('yes', 'no') NULL,
MODIFY COLUMN vehicle_authorization ENUM('complete', 'incomplete') NULL,
MODIFY COLUMN remarks TEXT NULL,
MODIFY COLUMN notes TEXT NULL,
MODIFY COLUMN contact_no VARCHAR(20) NULL,
MODIFY COLUMN vehicle_pictures JSON NULL,
MODIFY COLUMN accessories_pictures JSON NULL,
MODIFY COLUMN handover_signature VARCHAR(500) NULL,
MODIFY COLUMN takeover_signature VARCHAR(500) NULL,
MODIFY COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update users table structure
ALTER TABLE users 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY,
MODIFY COLUMN email VARCHAR(255) NOT NULL UNIQUE,
MODIFY COLUMN name VARCHAR(255) NULL,
MODIFY COLUMN role ENUM('admin', 'user') DEFAULT 'user',
MODIFY COLUMN designation VARCHAR(255) NULL,
MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- =====================================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Drop existing indexes if they exist (to recreate them properly)
DROP INDEX IF EXISTS idx_vehicle_submissions_user_id ON vehicle_submissions;
DROP INDEX IF EXISTS idx_vehicle_submissions_approval_status ON vehicle_submissions;
DROP INDEX IF EXISTS idx_vehicle_submissions_handover_date ON vehicle_submissions;
DROP INDEX IF EXISTS idx_vehicle_submissions_vehicle_type ON vehicle_submissions;
DROP INDEX IF EXISTS idx_users_email ON users;
DROP INDEX IF EXISTS idx_users_role ON users;

-- Create optimized indexes
CREATE INDEX idx_vehicle_submissions_user_id ON vehicle_submissions(user_id);
CREATE INDEX idx_vehicle_submissions_approval_status ON vehicle_submissions(approval_status);
CREATE INDEX idx_vehicle_submissions_handover_date ON vehicle_submissions(handover_date);
CREATE INDEX idx_vehicle_submissions_vehicle_type ON vehicle_submissions(vehicle_type);
CREATE INDEX idx_vehicle_submissions_created_at ON vehicle_submissions(created_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- STEP 6: ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraint for user_id (if not exists)
ALTER TABLE vehicle_submissions 
ADD CONSTRAINT IF NOT EXISTS fk_vehicle_submissions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- STEP 7: INSERT DEFAULT ADMIN USER (OPTIONAL)
-- =====================================================
-- Uncomment and modify if you want to create a default admin user

/*
INSERT INTO users (email, name, role, designation, created_at, updated_at) 
VALUES (
    'admin@etjahatalnajah.com', 
    'System Administrator', 
    'admin', 
    'System Administrator', 
    NOW(), 
    NOW()
) ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    role = VALUES(role),
    designation = VALUES(designation),
    updated_at = NOW();
*/

-- =====================================================
-- STEP 8: VERIFICATION AND CLEANUP
-- =====================================================

-- Verify table structures
SELECT 'VEHICLE_SUBMISSIONS TABLE STRUCTURE:' as info;
DESCRIBE vehicle_submissions;

SELECT 'USERS TABLE STRUCTURE:' as info;
DESCRIBE users;

-- Check new columns
SELECT 'NEW COLUMNS VERIFICATION:' as info;
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'vehicle_submissions'
    AND COLUMN_NAME IN ('vehicle_type_other', 'notes')
ORDER BY ORDINAL_POSITION;

-- Show current data counts
SELECT 'DATA COUNTS:' as info;
SELECT 
    (SELECT COUNT(*) FROM vehicle_submissions) as total_submissions,
    (SELECT COUNT(*) FROM users) as total_users;

-- Show indexes
SELECT 'INDEXES:' as info;
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME IN ('vehicle_submissions', 'users')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'DATABASE UPDATE COMPLETED SUCCESSFULLY!' as status,
       NOW() as completed_at;

-- Commit all changes
COMMIT;

-- =====================================================
-- POST-UPDATE INSTRUCTIONS
-- =====================================================

/*
IMPORTANT: After running this script, you should:

1. TEST THE APPLICATION:
   - Test form submission with new fields
   - Test custom plate number functionality
   - Test "OTHER" vehicle type with custom text
   - Test notes field in forms and print output
   - Test image upload (should append, not replace)

2. CLEAN UP FILES (if you reset data):
   - Delete files in: public/uploads/
   - Delete files in: public/signatures/
   
   Commands:
   Linux/Mac: rm -rf public/uploads/* public/signatures/*
   Windows: del /Q public\uploads\* & del /Q public\signatures\*

3. UPDATE API ENDPOINTS:
   - The submit-form.js API has been updated to handle new fields
   - Verify all admin endpoints handle the new columns

4. VERIFY PRINT FUNCTIONALITY:
   - Check that notes appear in print output
   - Check that "OTHER" vehicle type shows custom text
   - Test both admin and user print functions

5. BACKUP STRATEGY:
   - Set up regular backups now that structure is finalized
   - Consider implementing data migration scripts for future updates

6. PERFORMANCE MONITORING:
   - Monitor query performance with new indexes
   - Check application response times

For any issues, check the application logs and database error logs.
*/