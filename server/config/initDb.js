const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
  let connection;
  try {
    // Create initial connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Read and execute SQL from tables.sql
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    for (let statement of statements) {
      await connection.query(statement);
    }

    // Create default admin user if not exists
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.query(`
      INSERT IGNORE INTO users (first_name, last_name, email, password, role)
      VALUES ('Admin', 'User', 'admin@example.com', ?, 'admin')
    `, [hashedPassword]);

    console.log('Tables initialized successfully with sample data');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = initializeDatabase;