-- Professors Table
CREATE TABLE professors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(100),
  specialization TEXT,
  bio TEXT,
  website_url VARCHAR(255),
  email VARCHAR(100),
  image_url VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Professor Projects Table (to link professors with projects)
CREATE TABLE professor_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  professor_id INT NOT NULL,
  project_id INT NOT NULL,
  status ENUM('in_progress', 'completed', 'updating') DEFAULT 'in_progress',
  year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);