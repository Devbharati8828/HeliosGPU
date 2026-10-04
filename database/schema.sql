-- HeliosGPU Database Schema

CREATE DATABASE IF NOT EXISTS \`helios_db\`;
USE \`helios_db\`;

CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(2),
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  tz VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example Insert:
-- INSERT INTO locations (name, country, lat, lng, tz) VALUES ('New Delhi', 'IN', 28.6139, 77.2090, 'Asia/Kolkata');
