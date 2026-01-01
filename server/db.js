const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hospital_db',
  ssl: process.env.RENDER ? { rejectUnauthorized: false } : false
});

const initSchema = async () => {
  try {
    const client = await pool.connect();
    
    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Patients Table (Separated for clarity or linked to users?)
    // For now, mirroring the frontend which treats patients somewhat separately or as roles.
    // The frontend mock has a separate "patients" list in api.js, but auth.js also has users with role='patient'.
    // Let's create a generic table for the entities managed by api.js
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER,
        doctor_id INTEGER,
        date TIMESTAMP,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER,
        details TEXT,
        diagnosis TEXT,
        prescription TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database schema initialized');
    client.release();
  } catch (err) {
    console.error('Error initializing schema:', err);
  }
};

// Auto-run schema init on start
initSchema();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
