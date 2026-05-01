const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load frontend product IDs from src/data/shopData.js by requiring it
const shopDataPath = path.join(__dirname, '..', 'src', 'data', 'shopData.js');
let frontendIds = new Set();
try {
  // naive require via eval to extract exported ids since it's an ES module
  const content = fs.readFileSync(shopDataPath, 'utf8');
  const ids = [];
  // match patterns like { id: 2,  name: "Flat White",
  const idRegex = /id\s*:\s*(\d+)/g;
  let m;
  while ((m = idRegex.exec(content)) !== null) {
    ids.push(parseInt(m[1], 10));
  }
  ids.forEach(i => frontendIds.add(i));
} catch (err) {
  console.error('Failed to read frontend data:', err.message);
  process.exit(1);
}

(async () => {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'graduation_project',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3307,
    });

    const [menuRows] = await db.query('SELECT id, name, available FROM menu_items');
    const dbIds = new Set(menuRows.map(r => r.id));

    const missingInFrontend = menuRows.filter(r => !frontendIds.has(r.id));

    console.log('Frontend product IDs sample (first 20):', Array.from(frontendIds).slice(0,20));
    console.log('\nProducts in DB `menu_items` NOT present in frontend data:');
    if (missingInFrontend.length === 0) console.log('  (none)');
    else missingInFrontend.forEach(p => {
      console.log(`- ID ${p.id}: ${p.name} (available=${p.available})`);
    });

    // Find order_items that reference products not in frontend
    const [orderItems] = await db.query('SELECT oi.*, o.customer_name, o.email FROM order_items oi LEFT JOIN orders o ON oi.order_id = o.id');
    const itemsWithMissingProduct = orderItems.filter(oi => !frontendIds.has(oi.product_id));

    console.log('\nOrders (order_items) referencing product IDs not in frontend:');
    if (itemsWithMissingProduct.length === 0) console.log('  (none)');
    else {
      const grouped = {};
      for (const it of itemsWithMissingProduct) {
        if (!grouped[it.order_id]) grouped[it.order_id] = { order: { id: it.order_id, customer: it.customer_name, email: it.email }, items: [] };
        grouped[it.order_id].items.push({ id: it.product_id, name: it.item_name, qty: it.quantity, price: it.price });
      }
      for (const oid of Object.keys(grouped)) {
        const g = grouped[oid];
        console.log(`\nOrder ${g.order.id} — ${g.order.customer} <${g.order.email}>`);
        g.items.forEach(it => console.log(`  - product_id ${it.id}: ${it.name} (qty=${it.qty}, price=${it.price})`));
      }
    }

    await db.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
