const fs = require('fs');
const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'graduation_project', port: 3307 });

const sql = fs.readFileSync('graduation_project.sql', 'utf8');

const match = sql.match(/INSERT INTO `contact_messages` \([^)]+\) VALUES\s+([^;]+);/is);

if (match) {
  const query = 'REPLACE INTO `contact_messages` (`id`, `name`, `email`, `message`, `status`, `created_at`, `is_read`) VALUES ' + match[1] + ';';
  
  db.query(query, err => {
    if(err) console.error('Messages Error:', err);
    else console.log('Contact messages replaced successfully.');
    db.end();
  });
} else {
  console.log('Could not find insert statements for contact_messages.');
  db.end();
}
