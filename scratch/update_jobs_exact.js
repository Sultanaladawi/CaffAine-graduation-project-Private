const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'graduation_project',
  port: process.env.DB_PORT || 3307
});

const exactJobs = [
  ['Barista', 'Full-time / Part-time', 'Birmingham', 'Seeking an experienced barista to lead our coffee excellence.'],
  ['Kitchen Assistant', 'Full-time', 'Birmingham', 'Support our kitchen operations and ensure food quality.'],
  ['Front of House', 'Part-time', 'Birmingham', 'Welcome guests and provide exceptional service.']
];

async function updateToExactJobs() {
  const promiseDb = db.promise();
  try {
    // Clear old ones to match the screenshot exactly
    await promiseDb.query('DELETE FROM careers');
    
    for (const job of exactJobs) {
      await promiseDb.query('INSERT INTO careers (title, type, location, description, active) VALUES (?, ?, ?, ?, 1)', job);
      console.log('Added:', job[0]);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  db.end();
}

updateToExactJobs();
