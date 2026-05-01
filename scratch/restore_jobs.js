const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'graduation_project',
  port: process.env.DB_PORT || 3307
});

const defaultJobs = [
  ['Senior Barista', 'Full-time', 'Birmingham', 'Seeking an experienced barista to lead our coffee excellence and team training.'],
  ['Store Manager', 'Full-time', 'Birmingham', 'Lead our flagship store, manage operations, and ensure the best customer experience.']
];

async function restoreJobs() {
  const promiseDb = db.promise();
  for (const job of defaultJobs) {
    try {
      await promiseDb.query('INSERT INTO careers (title, type, location, description, active) VALUES (?, ?, ?, ?, 1)', job);
      console.log('Restored:', job[0]);
    } catch (err) {
      console.error('Error restoring', job[0], ':', err.message);
    }
  }
  db.end();
}

restoreJobs();
