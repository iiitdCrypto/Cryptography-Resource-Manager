const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cryptography_resource_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  multipleStatements: true // Enable multiple statements for triggers
});

// Test the connection
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL database connected successfully');
    connection.release();
    return pool;
  } catch (error) {
    console.error('MySQL connection error:', error.message);
    // Create database if it doesn't exist
    if (error.code === 'ER_BAD_DB_ERROR') {
      try {
        const tempPool = mysql.createPool({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || ''
        });
        
        await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'cryptography_resource_manager'}`);
        console.log('Database created successfully');
        
        // Try connecting again
        return await connectDB();
      } catch (createError) {
        console.error('Failed to create database:', createError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

// Ensure tables exist
const checkTable = async (tableName) => {
  const [rows] = await pool.query(
    'SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
    [process.env.DB_NAME || 'cryptography_resource_manager', tableName]
  );
  return rows.length > 0;
};

// Initialize database tables if they don't exist
const initializeTables = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if users table exists
    const usersExist = await checkTable('users');
    
    if (!usersExist) {
      console.log('Tables not found, creating database schema...');
      
      // Read schema file
      const schemaPath = path.join(__dirname, 'database', 'schema.sql');
      
      if (!fs.existsSync(schemaPath)) {
        console.error(`Schema file not found at: ${schemaPath}`);
        process.exit(1);
      }
      
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by semicolon to get individual statements
      // First, remove DELIMITER sections
      const cleanedSQL = schemaSQL.replace(/DELIMITER.*?DELIMITER\s+;/gs, '');
      
      // Split by semicolons, skipping empty statements
      const statements = cleanedSQL.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      // Execute each statement
      for (const stmt of statements) {
        try {
          await connection.query(stmt);
        } catch (err) {
          console.error(`Error executing SQL: ${stmt.substring(0, 100)}...`);
          console.error(`SQL Error: ${err.message}`);
        }
      }
      
      console.log('Database tables created successfully');
      
      // Create triggers separately (these often cause issues with the delimiter)
      try {
        // User update trigger
        await connection.query(`
          CREATE TRIGGER IF NOT EXISTS user_after_update
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
        console.log('User trigger created successfully');
      } catch (err) {
        console.error('User trigger creation error:', err.message);
      }
      
      try {
        // Permission update trigger
        await connection.query(`
          CREATE TRIGGER IF NOT EXISTS permission_after_update
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
        console.log('Permission trigger created successfully');
      } catch (err) {
        console.error('Permission trigger creation error:', err.message);
      }
    } else {
      // Check if email_verified column exists in users table
      const [columns] = await connection.query(
        'SHOW COLUMNS FROM users LIKE ?', 
        ['email_verified']
      );
      
      // If email_verified column doesn't exist, add it
      if (columns.length === 0) {
        console.log('Adding missing email_verified column to users table');
        await connection.query(
          'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE'
        );
        console.log('Added email_verified column to users table');
      }
    }
    
    console.log('Database setup complete');
    connection.release();
  } catch (error) {
    console.error('Error initializing database tables:', error.message);
    process.exit(1);
  }
};

// Execute a database query
const executeQuery = async (sql, params = []) => {
  try {
    // For commands that don't work with prepared statements
    if (sql.trim().toUpperCase() === 'START TRANSACTION' ||
        sql.trim().toUpperCase() === 'COMMIT' ||
        sql.trim().toUpperCase() === 'ROLLBACK') {
      const connection = await pool.getConnection();
      try {
        await connection.query(sql);
        connection.release();
        return { affectedRows: 0 };
      } catch (err) {
        connection.release();
        throw err;
      }
    }
    
    // For normal queries
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Query execution error:', error.message);
    throw error;
  }
};

module.exports = { pool, connectDB, initializeTables, executeQuery }; 