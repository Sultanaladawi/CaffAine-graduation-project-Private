const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'graduation_project',
  port: process.env.DB_PORT || 3307
});

db.query('SHOW TABLES', (err, results) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Tables:', results);
  }
  db.end();
});
