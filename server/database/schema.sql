CREATE DATABASE IF NOT EXISTS cryptography_resource_manager;
USE cryptography_resource_manager;

-- Users Table with Enhanced Fields
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  surname VARCHAR(100),
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin', 'authorised') DEFAULT 'user',
  bio TEXT,
  institution VARCHAR(100),
  position VARCHAR(100),
  profile_image VARCHAR(255),
  last_login DATETIME,
  account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  login_attempts INT DEFAULT 0,
  last_password_change DATETIME,
  reset_password_token VARCHAR(255),
  reset_password_expire DATETIME,
  verification_token VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- OTP Verification Table
CREATE TABLE otp_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  otp VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email)
);

-- User Settings Table
CREATE TABLE user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  theme VARCHAR(20) DEFAULT 'system',
  language VARCHAR(10) DEFAULT 'en',
  email_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Permissions Table
CREATE TABLE user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  can_access_dashboard BOOLEAN DEFAULT FALSE,
  can_update_content BOOLEAN DEFAULT FALSE,
  can_manage_users BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_create_events BOOLEAN DEFAULT FALSE,
  can_edit_events BOOLEAN DEFAULT FALSE,
  can_delete_events BOOLEAN DEFAULT FALSE,
  can_create_resources BOOLEAN DEFAULT FALSE,
  can_edit_resources BOOLEAN DEFAULT FALSE,
  can_delete_resources BOOLEAN DEFAULT FALSE,
  can_view_audit_logs BOOLEAN DEFAULT FALSE,
  can_manage_permissions BOOLEAN DEFAULT FALSE,
  can_export_data BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit Log Table
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'PERMISSION_CHANGE') NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  old_value JSON,
  new_value JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Resources Table
CREATE TABLE resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('video', 'note', 'book', 'citation') NOT NULL,
  url VARCHAR(255),
  file_path VARCHAR(255),
  thumbnail_url VARCHAR(255),
  category VARCHAR(100),
  author VARCHAR(100),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Articles Table
CREATE TABLE articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  thumbnail_url VARCHAR(255),
  author_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Events Table
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  location VARCHAR(255),
  is_online BOOLEAN DEFAULT FALSE,
  online_meeting_link VARCHAR(255),
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME,
  timezone VARCHAR(50) DEFAULT 'UTC',
  image_url VARCHAR(255),
  registration_url VARCHAR(255),
  capacity INT,
  organizer_name VARCHAR(100),
  organizer_email VARCHAR(100),
  event_type ENUM('conference', 'workshop', 'hackathon', 'webinar') NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
  source ENUM('college', 'external') DEFAULT 'college',
  tags JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Event Registrations Table
CREATE TABLE event_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('registered', 'attended', 'cancelled') DEFAULT 'registered',
  qr_code VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Projects Table
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('IP', 'MIP', 'BTP', 'IS', 'Capstone') NOT NULL,
  thumbnail_url VARCHAR(255),
  repo_url VARCHAR(255),
  demo_url VARCHAR(255),
  members TEXT,
  supervisor VARCHAR(100),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Lectures Table
CREATE TABLE lectures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('basics', 'symmetric', 'asymmetric', 'advanced') DEFAULT 'basics',
  instructor VARCHAR(100) NOT NULL,
  video_url VARCHAR(255) NOT NULL,
  thumbnail VARCHAR(255) DEFAULT '',
  download_url VARCHAR(255) DEFAULT '',
  duration INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Visitor Analytics Table
CREATE TABLE visitor_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  new_visitors INT DEFAULT 0,
  returning_visitors INT DEFAULT 0,
  avg_session_duration FLOAT,
  bounce_rate FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log Table
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INT,
  description TEXT,
  metadata JSON,
  ip_address VARCHAR(50),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Triggers for Audit Logging
DELIMITER //

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
END //

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
END //

DELIMITER ;