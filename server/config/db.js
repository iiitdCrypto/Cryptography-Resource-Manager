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

// Test the connection and create database if it doesn't exist
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
    throw error;
  }
};

// Ensure email_verified column exists
const ensureEmailVerifiedExists = async () => {
  try {
    // Check if users table exists
    const usersExists = await checkTable('users');
    
    if (usersExists) {
      // Check if email_verified column exists
      const hasEmailVerified = await checkColumn('users', 'email_verified');
      
      if (!hasEmailVerified) {
        console.log('Adding missing email_verified column to users table');
        await pool.query('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE');
        console.log('email_verified column added successfully');
      }
    }
  } catch (error) {
    console.error('Error ensuring email_verified column exists:', error.message);
  }
};

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
  pool,
  connectDB,
  executeQuery,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  executeTransactionQuery,
  checkTable,
  checkColumn,
  ensureEmailVerifiedExists
};