const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

// Function to execute SQL queries
async function executeQuery(sql, params = []) {
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

// Transaction related functions
const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

const commitTransaction = async (connection) => {
  await connection.commit();
  connection.release();
};

const rollbackTransaction = async (connection) => {
  await connection.rollback();
  connection.release();
};

const executeTransactionQuery = async (connection, sql, params = []) => {
  const [result] = await connection.execute(sql, params);
  return result;
};

// Function to ensure email_verified column exists in users table
const ensureEmailVerifiedExists = async () => {
  const hasColumn = await checkColumn('users', 'email_verified');
  if (!hasColumn) {
    await executeQuery('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE');
    console.log('Added email_verified column to users table');
  }
  return true;
};

// Export all database functions
module.exports = {
  connectDB,
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
