const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'graduation_project'
});

connection.query('SELECT * FROM order_items LIMIT 10', (err, rows) => {
  if (err) {
    console.error('Error fetching order_items:', err);
  } else {
    console.log('--- SAMPLE ROWS FROM order_items ---');
    console.log(JSON.stringify(rows, null, 2));
  }
  connection.end();
});
