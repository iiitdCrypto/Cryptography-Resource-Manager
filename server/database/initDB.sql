CREATE TABLE events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME,
  location GEOMETRY SRID 4326, -- For geospatial queries
  image_url VARCHAR(255),
  source ENUM('college', 'external') DEFAULT 'college',
  registration_link VARCHAR(255),
  status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
  category ENUM('conference', 'workshop', 'hackathon', 'webinar'),
  tags JSON,
  capacity INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE event_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT,
  user_id INT,
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('registered', 'attended', 'cancelled'),
  qr_code VARCHAR(255),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);