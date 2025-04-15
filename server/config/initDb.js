<<<<<<< HEAD
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
=======
const { pool, executeQuery } = require('./db');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Create users table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50),
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('regular', 'authorised', 'admin') DEFAULT 'regular',
        email_verified BOOLEAN DEFAULT false,
        account_status VARCHAR(20) DEFAULT 'active',
        last_password_change DATETIME,
        reset_password_token VARCHAR(255),
        reset_password_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX email_idx (email)
      )
    `);
    
    // Create permissions table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create user_permissions table (many-to-many relationship)
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        permission_id INT NOT NULL,
        granted_by INT,
        granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY user_permission_unique (user_id, permission_id)
      )
    `);
    
    // Create resources table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        file_url VARCHAR(255),
        authors VARCHAR(255),
        tag VARCHAR(100),
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    // Create events table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE,
        location VARCHAR(255),
        organisation VARCHAR(255),
        type VARCHAR(50),
        image_url VARCHAR(255),
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    // Create professors table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS professors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        title VARCHAR(100),
        specialization VARCHAR(255),
        bio TEXT,
        url VARCHAR(255),
        email VARCHAR(100),
        image_url VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create projects table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        definition TEXT,
        start_date DATE,
        end_date DATE,
        type VARCHAR(50),
        status VARCHAR(50),
        guide_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (guide_id) REFERENCES professors(id) ON DELETE SET NULL
      )
    `);
    
    // Create project_members table (for handling variable number of members)
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        role VARCHAR(50),
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY project_member_unique (project_id, user_id)
      )
    `);
    
    // Insert default permissions
    await executeQuery(`
      INSERT IGNORE INTO permissions (name, description) VALUES 
      ('access_dashboard', 'Access Dashboard'),
      ('manage_users', 'Manage Users'),
      ('manage_contents', 'Manage Contents')
    `);
    
    // Create default admin user if not exists
    const adminExists = await executeQuery('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
    
    if (adminExists.length === 0) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await executeQuery(`
        INSERT INTO users (first_name, last_name, email, password, role, email_verified, account_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['Admin', 'User', 'admin@example.com', hashedPassword, 'admin', true, 'active']);
      
      // Get the admin user ID
      const adminUser = await executeQuery('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
      const adminId = adminUser[0].id;
      
      // Assign all permissions to admin
      const permissions = await executeQuery('SELECT id FROM permissions');
      for (const permission of permissions) {
        await executeQuery(`
          INSERT IGNORE INTO user_permissions (user_id, permission_id) 
          VALUES (?, ?)
        `, [adminId, permission.id]);
      }
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
>>>>>>> 82939576ee37b12dba67578adf111e420d0654ac
  }
}

module.exports = initializeDatabase;