const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'graduation_project',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3307,
      multipleStatements: false,
    });

    const [tables] = await db.query('SHOW TABLES');
    if (!tables || tables.length === 0) {
      console.log('No tables found.');
      await db.end();
      return;
    }

    for (const t of tables) {
      const tableName = Object.values(t)[0];
      console.log('\n=== Table:', tableName, '===');
      try {
        const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
        console.log(`Rows: ${rows.length}`);
        console.log(JSON.stringify(rows, null, 2));
      } catch (tableErr) {
        console.error(`Error reading table ${tableName}:`, tableErr.message);
      }
    }

    await db.end();
  } catch (err) {
    console.error('DB Error:', err.message);
    process.exit(1);
  }
})();
