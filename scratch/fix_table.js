const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'graduation_project',
  port: process.env.DB_PORT || 3307
});

const queries = [
  "ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS phone VARCHAR(60) DEFAULT NULL",
  "ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS position VARCHAR(255) DEFAULT NULL",
  "ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS cover_letter TEXT DEFAULT NULL",
  "ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS resume_url VARCHAR(1024) DEFAULT NULL"
];

async function runFix() {
  const promiseDb = db.promise();
  for (const q of queries) {
    try {
      await promiseDb.query(q);
      console.log('Success:', q);
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log('Already exists:', q);
      } else {
        console.error('Error:', err.message);
      }
    }
  }
  db.end();
}

runFix();
