const mysql = require('mysql2/promise');
require('dotenv').config();

<<<<<<< HEAD
// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to execute SQL queries
async function executeQuery(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
=======
let pool = null;

const initializeDatabase = async () => {
  try {
    // First try to create database if it doesn't exist
    const tempPool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '12345',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    await tempPool.query('CREATE DATABASE IF NOT EXISTS cryptography_rm');
    await tempPool.end();

    // Now create the main pool with the database selected
    pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '12345',
      database: 'cryptography_rm',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    
    // Initialize tables
    await initializeTables(connection);
    
    connection.release();
    return pool;
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

const initializeTables = async (connection) => {
  try {
    // Get all tables in the database
    const [tables] = await connection.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'cryptography_rm'"
    );
    
    // First, disable foreign key checks to avoid constraint issues
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    try {
      // Drop tables that might reference users first
      // Known child tables
      const childTables = [
        'event_registrations',
        'events',
        'audit_logs',
        'articles',
        'resources',
        'user_settings',
        'user_permissions',
        'visitor_logs'
      ];
      
      // Drop all known child tables first
      for (const tableName of childTables) {
        await connection.query(`DROP TABLE IF EXISTS ${tableName};`);
      }
      
      // Drop any remaining tables that might exist
      for (const table of tables) {
        if (!childTables.includes(table.table_name) && table.table_name !== 'users') {
          await connection.query(`DROP TABLE IF EXISTS ${table.table_name};`);
        }
      }
      
      // Finally drop the users table
      await connection.query('DROP TABLE IF EXISTS users;');
    } finally {
      // Re-enable foreign key checks
      await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    }

    // Create tables in correct order (parent tables first)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        permission VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS user_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        setting_key VARCHAR(50) NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        category VARCHAR(50),
        source VARCHAR(255),
        url VARCHAR(512),
        author_id INT,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Insert sample data
    await connection.query(`
      INSERT INTO articles (title, content, description, category, source) 
      VALUES 
      ('Introduction to Cryptography', 'Sample content...', 'Basic introduction', 'cryptography', 'Internal'),
      ('Latest in Encryption', 'Sample content...', 'New developments', 'security', 'Internal');
    `);

    console.log('Tables initialized successfully with sample data');
  } catch (error) {
    console.error('Error initializing tables:', error);
    throw error;
  }
};

// Initialize database connection
initializeDatabase().catch(console.error);

// Check if a table exists
const checkTable = async (tableName) => {
  try {
    const [rows] = await pool.query(
      'SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [process.env.DB_NAME || 'cryptography_resource_manager', tableName]
    );
    return rows.length > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error.message);
    return false;
  }
};

// Check if a column exists in a table
const checkColumn = async (tableName, columnName) => {
  try {
    const [columns] = await pool.query(
      'SHOW COLUMNS FROM ?? LIKE ?', 
      [tableName, columnName]
    );
    return columns.length > 0;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error.message);
    return false;
  }
};

// Execute a database query
const executeQuery = async (sql, params = []) => {
  try {
    // Handle transactions separately
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
>>>>>>> 8d83eb9c7d4db7ffceaf666aeaf0a8ec04734938
    throw error;
  }
}

// Function to connect to the database
async function connectDB() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

<<<<<<< HEAD
module.exports = { executeQuery, connectDB, pool };
=======
// Begin a transaction and get a connection
const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

// Commit a transaction
const commitTransaction = async (connection) => {
  await connection.commit();
  connection.release();
};

// Rollback a transaction
const rollbackTransaction = async (connection) => {
  await connection.rollback();
  connection.release();
};

// Execute a query within a transaction
const executeTransactionQuery = async (connection, sql, params = []) => {
  const [result] = await connection.execute(sql, params);
  return result;
};

module.exports = {
  connectDB: initializeDatabase, // Add this line
  getPool: () => pool,
  executeQuery,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  executeTransactionQuery,
  checkTable,
  checkColumn,
  ensureEmailVerifiedExists
};
>>>>>>> 8d83eb9c7d4db7ffceaf666aeaf0a8ec04734938
