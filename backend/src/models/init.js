const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  let connection;
  try {
    // 1. Connect without database selected to create it if it doesn't exist
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    const dbName = process.env.DB_NAME || 'helioscope';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);
    
    console.log(`Database '${dbName}' ensured.`);

    // 2. Create tables
    const queries = [
      `CREATE TABLE IF NOT EXISTS locations (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        country VARCHAR(255),
        region VARCHAR(255),
        timezone VARCHAR(100),
        elevation FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS terrain_datasets (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        source VARCHAR(100),
        format VARCHAR(50),
        min_lat DECIMAL(10, 8),
        max_lat DECIMAL(10, 8),
        min_lon DECIMAL(11, 8),
        max_lon DECIMAL(11, 8),
        resolution FLOAT,
        file_path TEXT,
        metadata_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS solar_sessions (
        id VARCHAR(36) PRIMARY KEY,
        location_id VARCHAR(36),
        date DATE NOT NULL,
        time TIME NOT NULL,
        timezone VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
      );`,

      `CREATE TABLE IF NOT EXISTS solar_results (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(36) NOT NULL,
        solar_altitude FLOAT,
        solar_azimuth FLOAT,
        sunrise DATETIME,
        solar_noon DATETIME,
        sunset DATETIME,
        daylight_duration INT,
        solar_vector_x FLOAT,
        solar_vector_y FLOAT,
        solar_vector_z FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES solar_sessions(id) ON DELETE CASCADE
      );`,

      `CREATE TABLE IF NOT EXISTS analysis_sessions (
        id VARCHAR(36) PRIMARY KEY,
        location_id VARCHAR(36),
        terrain_id VARCHAR(36),
        date DATE NOT NULL,
        time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
        FOREIGN KEY (terrain_id) REFERENCES terrain_datasets(id) ON DELETE SET NULL
      );`,

      `CREATE TABLE IF NOT EXISTS analysis_results (
        id VARCHAR(36) PRIMARY KEY,
        analysis_id VARCHAR(36) NOT NULL,
        shadow_reference TEXT,
        sunlight_reference TEXT,
        compute_time_ms INT,
        metadata_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (analysis_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
      );`,

      `CREATE TABLE IF NOT EXISTS api_cache (
        id VARCHAR(36) PRIMARY KEY,
        provider VARCHAR(100) NOT NULL,
        cache_key VARCHAR(255) NOT NULL UNIQUE,
        response_json JSON NOT NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,

      `CREATE TABLE IF NOT EXISTS engine_runs (
        id VARCHAR(36) PRIMARY KEY,
        analysis_id VARCHAR(36),
        client_agent TEXT,
        compute_duration_ms INT,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (analysis_id) REFERENCES analysis_sessions(id) ON DELETE SET NULL
      );`
    ];

    for (const q of queries) {
      await connection.query(q);
    }
    
    console.log("All tables ensured successfully.");

  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Allow running this script directly
if (require.main === module) {
  initDB().then(() => {
    console.log("DB init script complete.");
    process.exit(0);
  });
}

module.exports = initDB;
