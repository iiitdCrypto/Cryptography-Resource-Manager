const { executeQuery, ensureEmailVerifiedExists } = require('./db');
const fs = require('fs');
const path = require('path');

const initializeDatabase = async () => {
  try {
    // Get existing tables
    const tables = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    
    const existingTables = tables.map(table => table.table_name);
    console.log('Existing tables:', existingTables.join(', ') || 'No tables found');
    
    // Check if users table exists and has email_verified column
    let hasEmailVerifiedColumn = false;
    if (existingTables.includes('users')) {
      try {
        const columns = await executeQuery(`
          SHOW COLUMNS FROM users LIKE 'email_verified'
        `);
        hasEmailVerifiedColumn = columns.length > 0;
        console.log('Email verified column exists:', hasEmailVerifiedColumn);
      } catch (error) {
        console.warn('Error checking email_verified column:', error.message);
      }
    }
    
    // Read schema.sql
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    let schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove database creation commands - we've already handled this in db.js
    schemaSQL = schemaSQL.replace(/CREATE DATABASE.*?;/gs, '');
    schemaSQL = schemaSQL.replace(/USE.*?;/gs, '');
    
    // Remove DELIMITER statements
    schemaSQL = schemaSQL.replace(/DELIMITER.*?\/\//gs, '');
    schemaSQL = schemaSQL.replace(/DELIMITER\s*;/g, '');
    
    // Split all table creation statements by CREATE TABLE
    const createTableStatements = schemaSQL.split(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?/i)
      .filter(s => s.trim().length > 0)
      .map(s => 'CREATE TABLE IF NOT EXISTS ' + s.trim());
    
    // Execute table creation statements but skip trigger creation for now
    for (const statement of createTableStatements) {
      if (!statement.includes('CREATE TRIGGER') && statement.includes('CREATE TABLE IF NOT EXISTS')) {
        try {
          await executeQuery(statement);
        } catch (error) {
          console.warn(`Table creation warning: ${error.message}`);
        }
      }
    }
    
    console.log('Database tables created or verified successfully');
    
    // Create or upgrade missing columns in existing tables
    if (existingTables.includes('users')) {
      // Add potential missing columns to users table
      try {
        await executeQuery(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) AFTER position,
          ADD COLUMN IF NOT EXISTS last_login DATETIME AFTER profile_image,
          ADD COLUMN IF NOT EXISTS account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' AFTER last_login,
          ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0 AFTER account_status,
          ADD COLUMN IF NOT EXISTS last_password_change DATETIME AFTER login_attempts,
          ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) AFTER reset_password_expire
        `);
        console.log('Users table upgraded successfully');
        
        // Add email_verified column separately to handle potential issues
        try {
          await executeQuery(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE AFTER verification_token
          `);
          console.log('Email verified column added successfully');
        } catch (emailVerifiedError) {
          console.warn('Email verified column addition warning:', emailVerifiedError.message);
          
          // Try alternative approach if the first one fails
          try {
            // Check if column exists first
            const columns = await executeQuery(`
              SHOW COLUMNS FROM users LIKE 'email_verified'
            `);
            
            if (columns.length === 0) {
              // Column doesn't exist, try to add it with a different syntax
              await executeQuery(`
                ALTER TABLE users 
                ADD COLUMN email_verified BOOLEAN DEFAULT FALSE
              `);
              console.log('Email verified column added with alternative approach');
            }
          } catch (alternativeError) {
            console.warn('Alternative email verified column addition warning:', alternativeError.message);
          }
        }
      } catch (error) {
        console.warn('Users table upgrade warning:', error.message);
      }
      
      // Also ensure email_verified exists using our specialized function
      await ensureEmailVerifiedExists();
      
      // Explicitly add email_verified column if it doesn't exist (as a fallback)
      try {
        await executeQuery(`
          SHOW COLUMNS FROM users LIKE 'email_verified'
        `).then(async (columns) => {
          if (columns.length === 0) {
            console.log('Adding missing email_verified column directly');
            await executeQuery(`
              ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE
            `);
            console.log('email_verified column added successfully');
          }
        });
      } catch (error) {
        console.warn('Direct email_verified column check warning:', error.message);
      }
    }
    
    // Ensure user_settings table exists
    if (!existingTables.includes('user_settings')) {
      try {
        await executeQuery(`
          CREATE TABLE IF NOT EXISTS user_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            theme VARCHAR(20) DEFAULT 'system',
            language VARCHAR(10) DEFAULT 'en',
            email_notifications BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        console.log('User settings table created successfully');
      } catch (error) {
        console.warn('User settings table creation warning:', error.message);
      }
    }
    
    // Ensure OTP verification table exists
    if (!existingTables.includes('otp_verification')) {
      try {
        await executeQuery(`
          CREATE TABLE IF NOT EXISTS otp_verification (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL,
            otp VARCHAR(255) NOT NULL,
            expires_at DATETIME NOT NULL,
            attempts INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_email (email)
          )
        `);
        console.log('OTP verification table created successfully');
      } catch (error) {
        console.warn('OTP verification table creation warning:', error.message);
      }
    }
    
    // Ensure activity_logs table exists
    if (!existingTables.includes('activity_logs')) {
      try {
        await executeQuery(`
          CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT DEFAULT NULL,
            action VARCHAR(50) NOT NULL,
            resource_type VARCHAR(50) NOT NULL,
            resource_id INT,
            description TEXT,
            metadata JSON,
            ip_address VARCHAR(50),
            user_agent VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('Activity logs table created successfully');
      } catch (error) {
        console.warn('Activity logs table creation warning:', error.message);
      }
    }
    
    // Update activity_logs table to allow null user_id if it already exists
    if (existingTables.includes('activity_logs')) {
      try {
        // Check if user_id is NOT NULL
        const columns = await executeQuery(`
          SELECT is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = DATABASE() 
          AND table_name = 'activity_logs' 
          AND column_name = 'user_id'
        `);
        
        if (columns.length > 0 && columns[0].is_nullable === 'NO') {
          console.log('Modifying activity_logs table to allow null user_id');
          await executeQuery(`
            ALTER TABLE activity_logs MODIFY COLUMN user_id INT NULL
          `);
          console.log('activity_logs table updated successfully');
        }
      } catch (error) {
        console.warn('activity_logs table update warning:', error.message);
      }
    }
    
    // Check if triggers exist
    try {
      const triggers = await executeQuery(`
        SELECT TRIGGER_NAME 
        FROM information_schema.TRIGGERS 
        WHERE TRIGGER_SCHEMA = DATABASE()
      `);
      
      const existingTriggers = triggers.map(trigger => trigger.TRIGGER_NAME);
      console.log('Existing triggers:', existingTriggers.join(', '));
      
      // Create user_after_update trigger if it doesn't exist
      if (!existingTriggers.includes('user_after_update')) {
        try {
          await executeQuery(`
            DROP TRIGGER IF EXISTS user_after_update
          `);
          
          await executeQuery(`
            CREATE TRIGGER user_after_update
            AFTER UPDATE ON users
            FOR EACH ROW
            BEGIN
              INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, old_value, new_value)
              VALUES (
                NEW.id,
                'UPDATE',
                'USER',
                NEW.id,
                JSON_OBJECT(
                  'role', OLD.role,
                  'email', OLD.email,
                  'name', OLD.name,
                  'surname', OLD.surname
                ),
                JSON_OBJECT(
                  'role', NEW.role,
                  'email', NEW.email,
                  'name', NEW.name,
                  'surname', NEW.surname
                )
              );
            END
          `);
          console.log('User update trigger created successfully');
        } catch (error) {
          console.warn('User trigger creation warning:', error.message);
        }
      }
      
      // Create permission_after_update trigger if it doesn't exist
      if (!existingTriggers.includes('permission_after_update')) {
        try {
          await executeQuery(`
            DROP TRIGGER IF EXISTS permission_after_update
          `);
          
          await executeQuery(`
            CREATE TRIGGER permission_after_update
            AFTER UPDATE ON user_permissions
            FOR EACH ROW
            BEGIN
              INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, old_value, new_value)
              VALUES (
                NEW.user_id,
                'PERMISSION_CHANGE',
                'PERMISSION',
                NEW.id,
                JSON_OBJECT(
                  'can_access_dashboard', OLD.can_access_dashboard,
                  'can_update_content', OLD.can_update_content
                ),
                JSON_OBJECT(
                  'can_access_dashboard', NEW.can_access_dashboard,
                  'can_update_content', NEW.can_update_content
                )
              );
            END
          `);
          console.log('Permission update trigger created successfully');
        } catch (error) {
          console.warn('Permission trigger creation warning:', error.message);
        }
      }
    } catch (error) {
      console.warn('Trigger check warning:', error.message);
    }
    
    console.log('Database initialization complete');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
};

module.exports = initializeDatabase;