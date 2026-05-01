const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_key_here') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('[WARNING] OpenAI API Key missing. AI Assistant will be disabled.');
}

const app = express();
const PORT = 5000;

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

// --- STORE STATUS API (FORCED POSITION) ---
app.get('/api/store-status', (req, res) => {
  db.query('SELECT value FROM site_settings WHERE \`key\` = ?', ['store_status'], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.json({ status: 'auto' });
    res.json({ status: results[0].value });
  });
});

app.post('/api/store-status', (req, res) => {
  const { status } = req.body;
  db.query('INSERT INTO site_settings (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?', 
  ['store_status', status, status], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, status });
  });
});
// ------------------------------------------

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is reaching here' });
});

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'faculty_coffee',
  port: process.env.DB_PORT || 3307
});

const convertNumerals = str => {
  if (typeof str === 'undefined' || str === null) return '';
  const s = str.toString();
  return s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[0-9]/g, d => d);
};

db.connect(err => {
  if (err) {
    console.error('MySQL Connection Error:', err.message);
    return;
  }
  console.log(`Database connected successfully on port ${db.config.port}`);
});

// Ensure contact_messages and job_applications tables exist
db.query(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure contact_messages table error:', err); });

db.query(`
  CREATE TABLE IF NOT EXISTS job_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(60) DEFAULT NULL,
    position VARCHAR(255) DEFAULT NULL,
    cover_letter TEXT DEFAULT NULL,
    resume_url VARCHAR(1024) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure job_applications table error:', err); });

// Ensure careers table exists (Job Openings)
db.query(`
  CREATE TABLE IF NOT EXISTS careers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'Full-time',
    location VARCHAR(255) DEFAULT 'Birmingham',
    description TEXT,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure careers table error:', err); });

let categoryNameColumn = 'name'; // Default

// --- DATA INTEGRITY: REPAIR CATEGORY LINKS ---
db.query("SELECT * FROM categories", (err, categories) => {
  if (err) return console.error('Category Check Error:', err);
  
  if (categories.length === 0) {
    db.query("INSERT INTO categories (name) VALUES ('Coffee'), ('Drinks'), ('Food'), ('Sweets')", (iErr) => {
      if (!iErr) console.log('[Data Integrity] Initialized default categories.');
    });
  } else {
    // Detect which column is used for the name (name, label, title, etc.)
    const firstRow = categories[0];
    categoryNameColumn = Object.keys(firstRow).find(key => 
      ['name', 'label', 'title', 'category_name', 'name_ar'].includes(key.toLowerCase())
    ) || Object.keys(firstRow)[1]; 

    console.log(`[Data Integrity] Detected Category Name Column: '${categoryNameColumn}'`);
    console.log(`[Data Integrity] Current Categories:`, categories.map(c => `[ID:${c.id} Name:${c[categoryNameColumn]}]`).join(', '));

    // Migrate old string-based categories to numeric IDs
    const findId = (keyword) => categories.find(c => String(c[categoryNameColumn] || '').toLowerCase().includes(keyword.toLowerCase()))?.id;

    const catMap = {
      'espresso': findId('coffee') || findId('espresso'),
      'tea': findId('tea') || findId('drink'),
      'cold': findId('cold') || findId('drink'),
      'food': findId('food') || findId('pastry'),
      'sweets': findId('sweet') || findId('cake'),
      'soft': findId('soft') || findId('drink')
    };

    Object.keys(catMap).forEach(oldKey => {
      const newId = catMap[oldKey];
      if (newId && newId != oldKey) {
        db.query("UPDATE menu_items SET category_id = ? WHERE category_id = ?", [newId, oldKey], (uErr) => {
           if (!uErr) console.log(`[Migration] Migrated legacy category '${oldKey}' -> New ID: ${newId}`);
        });
      }
    });

    // SMART RECOVERY: Fix items that were accidentally moved to 'cold' during previous failed migration
    const recoveryMap = [
      { key: 'espresso', keywords: ['coffee', 'espresso', 'latte', 'cappuccino', 'mocha', 'shot'] },
      { key: 'tea', keywords: ['tea', 'chai', 'matcha', 'herbal'] },
      { key: 'food', keywords: ['pastry', 'bread', 'sandwich', 'croissant', 'food'] },
      { key: 'sweets', keywords: ['cake', 'sweet', 'cookie', 'muffin', 'brownie', 'donut'] },
      { key: 'soft', keywords: ['water', 'soda', 'soft', 'juice'] },
      { key: 'sides', keywords: ['side', 'snack', 'chips'] }
    ];

    recoveryMap.forEach(rec => {
      const targetId = categories.find(c => c.id === rec.key)?.id;
      if (targetId && targetId !== 'cold') {
        rec.keywords.forEach(word => {
          db.query("UPDATE menu_items SET category_id = ? WHERE category_id = 'cold' AND (name LIKE ? OR description LIKE ?)", 
          [targetId, `%${word}%`, `%${word}%`], (err, res) => {
            if (!err && res.changedRows > 0) console.log(`[Recovery] Moved ${res.changedRows} items back to '${targetId}' based on keyword '${word}'`);
          });
        });
      }
    });

    // Final cleanup: only link truly empty/null items to the default category
    db.query("UPDATE menu_items SET category_id = ? WHERE category_id IS NULL OR category_id = ''", [categories[0].id], (err, result) => {
       if (!err && result.changedRows > 0) console.log(`[Data Integrity] Linked ${result.changedRows} orphaned items to default: ${categories[0].id}`);
    });
  }
});
// ---------------------------------------------

// Ensure menu_items has image_url column
db.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024) DEFAULT NULL;`, (err) => {
  if (err && !err.message.includes('Duplicate column name')) console.error('Alter menu_items error:', err.message);
});

// Ensure product reviews table exists
db.query(`
  CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    reviewer_name VARCHAR(255) DEFAULT NULL,
    comment TEXT DEFAULT NULL,
    rating TINYINT(1) DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES menu_items(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure product_reviews table error:', err); });

// Ensure general feedback table exists
db.query(`
  CREATE TABLE IF NOT EXISTS general_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reviewer_name VARCHAR(255) DEFAULT 'Anonymous',
    comment TEXT DEFAULT NULL,
    rating TINYINT(1) DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure general_feedback table error:', err); });

// Ensure offers table exists
db.query(`
  CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    discount_percent INT NOT NULL,
    reason TEXT,
    end_date DATE NULL,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure offers table error:', err); });

// ---------------------------------------------------------
// SITE SETTINGS & STORE STATUS API
// ---------------------------------------------------------

// Ensure site_settings table exists
db.query(`
  CREATE TABLE IF NOT EXISTS site_settings (
    \`key\` VARCHAR(50) PRIMARY KEY,
    \`value\` VARCHAR(255)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure site_settings table error:', err); });

// Ensure store_reviews table exists (General Shop Reviews)
db.query(`
  CREATE TABLE IF NOT EXISTS store_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reviewer_name VARCHAR(255) DEFAULT 'Anonymous',
    comment TEXT DEFAULT NULL,
    rating TINYINT(1) DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure store_reviews table error:', err); });

// Ensure ai_insights_cache table exists
db.query(`
  CREATE TABLE IF NOT EXISTS ai_insights_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic VARCHAR(100) UNIQUE,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure ai_insights_cache table error:', err); });

// Ensure non-zero prices for existing addons (One-time fix)
db.query("UPDATE addons SET price = 0.50 WHERE price = 0", (err) => {
  if (err) console.error('Update addon prices error:', err);
  else console.log('Successfully updated zero-price addons to default £0.50');
});

// ---------------------------------------------------------
// CONTACT MESSAGES API
// ---------------------------------------------------------

// Already existing POST endpoint for contact
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if(!name || !email || !message) return res.status(400).json({ error: 'All fields required' });
  
  db.query('INSERT INTO contact_messages (name, email, message, is_read) VALUES (?, ?, ?, 0)', [name, email, message], (err, result) => {
    if(err) return res.status(500).json({ error: err.message });
    res.status(201).json({ success: true, id: result.insertId });
  });
});

app.get('/api/contact', (req, res) => {
  db.query('SELECT * FROM contact_messages ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.put('/api/contact/:id/read', (req, res) => {
  const { is_read } = req.body;
  db.query('UPDATE contact_messages SET is_read = ? WHERE id = ?', [is_read ? 1 : 0, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/contact/:id', (req, res) => {
  db.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Message deleted successfully' });
  });
});

// Feedback & Reviews API Routes
app.get('/api/feedback', async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [generalFeedback] = await promiseDb.query('SELECT * FROM general_feedback ORDER BY created_at DESC');
    const [storeReviews] = await promiseDb.query('SELECT * FROM store_reviews ORDER BY created_at DESC');
    const [productReviews] = await promiseDb.query(`
      SELECT pr.*, m.name as product_name 
      FROM product_reviews pr 
      JOIN menu_items m ON pr.product_id = m.id 
      ORDER BY pr.created_at DESC
    `);
    
    res.status(200).json({
      general: generalFeedback,
      store: storeReviews,
      products: productReviews
    });
  } catch (err) {
    console.error('Fetch Feedback Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/feedback/general', (req, res) => {
  console.log('[DEBUG] Received General Feedback:', req.body);
  const { reviewer_name, comment, rating } = req.body;
  const q = 'INSERT INTO general_feedback (reviewer_name, comment, rating) VALUES (?, ?, ?)';
  db.query(q, [reviewer_name || 'Anonymous', comment, rating || 5], (err, result) => {
    if (err) {
      console.error('[DEBUG] SQL Error inserting general feedback:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('[DEBUG] General feedback saved! ID:', result.insertId);
    res.status(201).json({ message: 'Feedback submitted successfully', id: result.insertId });
  });
});

app.post('/api/feedback/product', (req, res) => {
  console.log('[DEBUG] Received Product Feedback:', req.body);
  const { product_id, reviewer_name, comment, rating } = req.body;
  if (!product_id) {
    console.log('[DEBUG] Error: Missing product_id');
    return res.status(400).json({ error: 'Product ID is required' });
  }
  
  const q = 'INSERT INTO product_reviews (product_id, reviewer_name, comment, rating) VALUES (?, ?, ?, ?)';
  db.query(q, [product_id, reviewer_name || 'Anonymous', comment, rating || 5], (err, result) => {
    if (err) {
      console.error('[DEBUG] SQL Error inserting review:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('[DEBUG] Review saved successfully! ID:', result.insertId);
    res.status(201).json({ message: 'Review submitted successfully', id: result.insertId });
  });
});

// --- OFFERS API ---
app.get('/api/offers', (req, res) => {
  db.query('SELECT * FROM offers WHERE active = 1', (err, results) => {
    if (err) {
      console.error('[Offers] GET Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});



app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [[products]] = await promiseDb.query("SELECT COUNT(*) as count FROM menu_items");
    const [[orders]] = await promiseDb.query("SELECT COUNT(*) as count FROM orders");
    const [[sales]] = await promiseDb.query("SELECT SUM(total_amount) as total FROM orders");
    const [lowStockItems] = await promiseDb.query("SELECT item_name, quantity, min_threshold FROM inventory WHERE quantity <= min_threshold");
    
    // Fetch last 7 days of sales for the bar chart
    const [dailySales] = await promiseDb.query(`
      SELECT DATE(created_at) as date, SUM(total_amount) as total 
      FROM orders 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    // Fetch category distribution for the pie chart
    const [categoryStats] = await promiseDb.query(`
      SELECT COALESCE(c.${categoryNameColumn}, 'Other') as name, COUNT(oi.id) as count
      FROM order_items oi
      JOIN menu_items mi ON oi.product_id = mi.id
      LEFT JOIN categories c ON mi.category_id = c.id
      GROUP BY name
    `);

    res.status(200).json({
      data: {
        totalProducts: products.count,
        totalOrders: orders.count,
        totalSales: sales.total || 0,
        lowStock: lowStockItems.length,
        lowStockItems: lowStockItems,
        dailySales: dailySales,
        categoryStats: categoryStats
      }
    });
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/offers', (req, res) => {
  const query = "SELECT * FROM offers";
  db.query(query, (err, results) => {
    if (err) {
      console.error('Offers Fetch Error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json(results);
  });
});

// expose categories
app.get('/api/categories', (req, res) => {
  db.query('SELECT * FROM categories', (err, results) => {
    if (err) {
      console.error('Fetch categories error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});

// expose all addons for admin picker
app.get('/api/addons', (req, res) => {
  db.query('SELECT * FROM addons ORDER BY name ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// create new addon
app.post('/api/addons', async (req, res) => {
  const { name, price, inventory_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const promiseDb = db.promise();
  try {
    // Check if exists
    const [existing] = await promiseDb.query('SELECT * FROM addons WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.json(existing[0]);
    }
    const [result] = await promiseDb.query('INSERT INTO addons (name, price, inventory_id) VALUES (?, ?, ?)', [name, price || 0, inventory_id || null]);
    res.status(201).json({ id: result.insertId, name, price, inventory_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// expose all tags
app.get('/api/tags', (req, res) => {
  db.query('SELECT * FROM tags ORDER BY name ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// create new tag
app.post('/api/tags', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const promiseDb = db.promise();
  try {
    const [existing] = await promiseDb.query('SELECT * FROM tags WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.json(existing[0]);
    }
    const [result] = await promiseDb.query('INSERT INTO tags (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', (req, res) => {
  const query = "SELECT * FROM orders";
  db.query(query, (err, results) => {
    if (err) {
      console.error('Orders Fetch Error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json(results);
  });
});

app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM orders WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Order Fetch Error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(results[0]);
  });
});

app.get('/api/products', async (req, res) => {
  try {
    const promiseDb = db.promise();
    
    // 1. Fetch all available addons to have a name-to-price mapping for fallback
    const [allAddons] = await promiseDb.query('SELECT name, price FROM addons');
    const addonPriceMap = {};
    allAddons.forEach(a => {
      addonPriceMap[a.name.toLowerCase().trim()] = parseFloat(a.price);
    });

    const [results] = await promiseDb.query(`
      SELECT 
        m.*, 
        CASE 
          WHEN m.available = 0 THEN 1 
          WHEN EXISTS (
            SELECT 1 FROM recipes r 
            JOIN inventory i ON r.inventory_id = i.id 
            WHERE r.menu_item_id = m.id AND i.quantity < r.quantity_required
          ) THEN 1 
          ELSE 0 
        END as isOutOfStock,
        (
          SELECT GROUP_CONCAT(CONCAT(a.id, '|', a.name, '|', a.price))
          FROM menu_item_addons mia
          JOIN addons a ON mia.addon_id = a.id
          WHERE mia.menu_item_id = m.id
        ) as linked_addons,
        (
          SELECT GROUP_CONCAT(CONCAT(t.id, '|', t.name))
          FROM menu_item_tags mit
          JOIN tags t ON mit.tag_id = t.id
          WHERE mit.menu_item_id = m.id
        ) as linked_tags
      FROM menu_items m
    `);

    const products = results.map(p => {
      // 1. Structured Addons from bridge table
      let addonsArray = p.linked_addons ? p.linked_addons.split(',').map(pair => {
        const [id, name, price] = pair.split('|');
        return { id, name, price: parseFloat(price) };
      }) : [];

      // 2. Fallback to legacy string field if bridge table is empty
      if (addonsArray.length === 0 && p.addons) {
        addonsArray = p.addons.split(',').map((name, idx) => {
          const cleanName = name.trim();
          const matchedPrice = addonPriceMap[cleanName.toLowerCase()] || 0;
          return {
            id: `legacy-${idx}`,
            name: cleanName,
            price: matchedPrice
          };
        });
      }

      // 3. Structured Tags from bridge table
      const tagsArray = p.linked_tags ? p.linked_tags.split(',').map(pair => {
        const [id, name] = pair.split('|');
        return { id, name };
      }) : [];

      return {
        ...p,
        isOutOfStock: !!p.isOutOfStock,
        linkedAddons: addonsArray,
        linkedTags: tagsArray
      };
    });

    res.status(200).json(products);
  } catch (err) {
    console.error('Products Fetch Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/inventory', (req, res) => {
  const query = "SELECT * FROM inventory";
  db.query(query, (err, results) => {
    if (err) {
      console.error('Inventory Fetch Error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json(results);
  });
});

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const team = [
    { email: 'omar@coffee.com', pass: 'omar2026', name: 'Omar Al-Ajarma', role: 'super_admin' },
    { email: 'sultan@coffee.com', pass: 'sultan2026', name: 'Sultan Al-Adawi', role: 'admin' },
    { email: 'mohammad@coffee.com', pass: 'mohammad2026', name: 'Mohammad Al-Hadidi', role: 'admin' },
    { email: 'bashar@coffee.com', pass: 'bashar2026', name: 'Bashar Al-Dabbas', role: 'admin' }
  ];
  
  const user = team.find(u => u.email === email?.toLowerCase().trim() && u.pass === password);
  
  if (user) {
    res.json({ 
      success: true, 
      user: { id: user.email, email: user.email, name: user.name, role: user.role } 
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/inventory', (req, res) => {
  try {
    let { item_name, quantity, unit, min_threshold } = req.body;
    const cleanQty = parseFloat(convertNumerals(quantity).replace(/[^0-9.]/g, '')) || 0;
    const cleanThreshold = parseInt(convertNumerals(min_threshold).replace(/[^0-9.]/g, '')) || 0;
    
    console.log('[Inventory] Adding item:', { item_name, cleanQty, unit, cleanThreshold });
    const query = "INSERT INTO inventory (item_name, quantity, unit, min_threshold) VALUES (?, ?, ?, ?)";
    db.query(query, [item_name, cleanQty, unit, cleanThreshold], (err, result) => {
      if (err) {
        console.error('[Inventory] Add SQL Error:', err.message);
        return res.status(500).json({ error: `SQL Error: ${err.message}` });
      }
      res.status(201).json({ message: 'Item added', id: result.insertId });
    });
  } catch (error) {
    console.error('[Inventory] Add Catch Error:', error.message);
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
});

app.put('/api/update-stock-item/:id', (req, res) => {
  try {
    const { id } = req.params;
    let { item_name, quantity, unit, min_threshold } = req.body;
    const cleanQty = parseFloat(convertNumerals(quantity).replace(/[^0-9.]/g, '')) || 0;
    const cleanThreshold = parseInt(convertNumerals(min_threshold).replace(/[^0-9.]/g, '')) || 0;

    console.log('[DEBUG] Hit Unique Update Route for ID:', id);
    const query = "UPDATE inventory SET item_name = ?, quantity = ?, unit = ?, min_threshold = ? WHERE id = ?";
    db.query(query, [item_name, cleanQty, unit, cleanThreshold, id], (err, result) => {
      if (err) {
        console.error('[Inventory] Update SQL Error:', err.message);
        return res.status(500).json({ error: `SQL Error: ${err.message}` });
      }
      res.json({ message: 'Item updated' });
    });
  } catch (error) {
    console.error('[Inventory] Update Catch Error:', error.message);
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
});

app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM inventory WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Item deleted' });
  });
});

app.get('/api/careers', (req, res) => {
  db.query('SELECT * FROM careers WHERE active = 1 ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/careers', (req, res) => {
  const { title, type, location, description } = req.body;
  db.query('INSERT INTO careers (title, type, location, description) VALUES (?, ?, ?, ?)', [title, type, location, description], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Job created', id: result.insertId });
  });
});

app.put('/api/careers/:id', (req, res) => {
  const { id } = req.params;
  const { title, type, location, description, active } = req.body;
  db.query('UPDATE careers SET title = ?, type = ?, location = ?, description = ?, active = ? WHERE id = ?', [title, type, location, description, active, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Job updated' });
  });
});

app.delete('/api/careers/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM careers WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Job deleted' });
  });
});

app.post('/api/ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });
    const answer = response.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    console.error('[AI API] Error:', err);
    res.status(500).json({ error: 'AI service failure' });
  }
});

app.post('/api/messages', (req, res) => {
  const { user_msg, ai_msg } = req.body;
  const query = "INSERT INTO chat_messages (user_msg, ai_msg) VALUES (?, ?)";
  db.query(query, [user_msg, ai_msg], (err, result) => {
    if (err) {
      console.error('Save Message Error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(201).json({ message: 'Message saved' });
  });
});

// Contact form submit from public site
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
  const q = "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)";
  db.query(q, [name, email, message], (err, result) => {
    if (err) {
      console.error('Contact Insert Error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(201).json({ message: 'Contact received' });
  });
});

// Admin: fetch contact messages (latest first)
app.get('/api/contact-messages', (req, res) => {
  const q = "SELECT * FROM contact_messages ORDER BY created_at DESC";
  db.query(q, (err, results) => {
    if (err) {
      console.error('Fetch contact messages error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});

// Public site: submit a job application
app.post('/api/apply', (req, res) => {
  const { name, email, phone, position, cover_letter, resume_url } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Missing name or email' });
  const q = `INSERT INTO job_applications (name, email, phone, position, cover_letter, resume_url) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(q, [name, email, phone || null, position || null, cover_letter || null, resume_url || null], (err, result) => {
    if (err) {
      console.error('Insert application error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(201).json({ message: 'Application received' });
  });
});

// Admin: fetch job applications
app.get('/api/applications', (req, res) => {
  const q = "SELECT * FROM job_applications ORDER BY created_at DESC";
  db.query(q, (err, results) => {
    if (err) {
      console.error('Fetch applications error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});

app.post('/api/orders', async (req, res) => {
  const { customer_name, email, total_amount, cartItems } = req.body;
  if (!customer_name || !email || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }
  const totalAmount = parseFloat(total_amount);
  if (Number.isNaN(totalAmount) || totalAmount < 0) {
    return res.status(400).json({ error: 'Invalid total amount' });
  }
  const promiseDb = db.promise();
  try {
    await promiseDb.beginTransaction();
    for (const item of cartItems) {
      const productId = parseInt(item.id, 10);
      const quantity = parseInt(item.qty, 10);
      if (Number.isNaN(productId) || productId <= 0) {
        throw new Error('Invalid product id in order item');
      }
      const [ingredients] = await promiseDb.query(`
        SELECT i.item_name, i.quantity as stock_qty, r.quantity_required
        FROM recipes r
        JOIN inventory i ON r.inventory_id = i.id
        WHERE r.menu_item_id = ?
      `, [productId]);
      for (const recipe of ingredients) {
        const requiredTotal = parseFloat(recipe.quantity_required) * quantity;
        if (recipe.stock_qty < requiredTotal) {
          throw new Error(`Insufficient stock for: ${recipe.item_name}`);
        }
      }
    }
    const [[{ nextOrderId }]] = await promiseDb.query("SELECT IFNULL(MAX(id), 0) + 1 AS nextOrderId FROM orders");
    const orderId = nextOrderId;
    await promiseDb.query(
      "INSERT INTO orders (id, customer_name, email, total_amount, status, created_at) VALUES (?, ?, ?, ?, 'preparing', NOW())",
      [orderId, customer_name, email, totalAmount]
    );
    const insertOrderItem = "INSERT INTO order_items (id, order_id, product_id, item_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)";
    const updateInventoryById = "UPDATE inventory SET quantity = GREATEST(quantity - ?, 0) WHERE id = ?";
    const [[{ nextOrderItemId }]] = await promiseDb.query("SELECT IFNULL(MAX(id), 0) + 1 AS nextOrderItemId FROM order_items");
    let orderItemId = nextOrderItemId;
    for (const item of cartItems) {
      const productId = parseInt(item.id, 10);
      const quantity = parseFloat(item.qty);
      const price = parseFloat(item.priceNum);
      if (Number.isNaN(productId) || productId <= 0 || !quantity || quantity <= 0 || Number.isNaN(price)) continue;
      await promiseDb.query(insertOrderItem, [orderItemId, orderId, productId, item.name, quantity, price]);
      // 2. Deduct inventory based on product recipe
      const [recipeSteps] = await promiseDb.query("SELECT inventory_id, quantity_required FROM recipes WHERE menu_item_id = ?", [productId]);
      for (const ingredient of recipeSteps) {
        const deductAmount = parseFloat(ingredient.quantity_required) * quantity;
        await promiseDb.query(updateInventoryById, [deductAmount, ingredient.inventory_id]);
      }

      // 3. NEW: Deduct inventory for selected addons
      if (Array.isArray(item.selectedAddons)) {
        for (const addon of item.selectedAddons) {
          // Fetch the inventory_id and price if needed from DB for this addon
          const [addonData] = await promiseDb.query("SELECT inventory_id FROM addons WHERE name = ? OR id = ?", [addon.name, addon.id]);
          if (addonData && addonData[0] && addonData[0].inventory_id) {
            // Deduct 1 unit of that inventory item (e.g., 1 shot, 1 portion of milk)
            await promiseDb.query(updateInventoryById, [1 * quantity, addonData[0].inventory_id]);
          }
        }
      }
      orderItemId += 1;
    }
    await promiseDb.commit();
    res.status(201).json({ success: true, orderId });
    setTimeout(async () => {
      try {
        const updateDb = mysql.createConnection({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASS || '',
          database: process.env.DB_NAME || 'graduation_project',
          port: process.env.DB_PORT || 3307
        });
        updateDb.connect(err => {
          if (err) {
            console.error('Auto-update DB Connection Error:', err.message);
            return;
          }
          updateDb.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            ['ready', orderId],
            err => {
              if (err) {
                console.error(`[Auto-Update] Error updating order ${orderId}:`, err.message);
              } else {
                console.log(`[Auto-Update] Order #${orderId} marked as ready`);
              }
              updateDb.end();
            }
          );
        });
      } catch (error) {
        console.error('[Auto-Update] Error:', error.message);
      }
    }, 120000);
  } catch (err) {
    console.error('[Server] Order Error:', err.message);
    try {
      await promiseDb.rollback();
    } catch (rollbackErr) {
      console.error('[Server] Rollback Error:', rollbackErr);
    }
    if (err.message.includes('Insufficient stock')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/messages', (req, res) => {
  const query = "SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 50";
  db.query(query, (err, results) => {
    if (err) {
      console.error('Fetch Messages Error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json(results);
  });
});

// Reviews endpoints
app.get('/api/reviews', (req, res) => {
  const { product_id } = req.query;
  let q = 'SELECT * FROM product_reviews';
  const params = [];
  if (product_id) {
    q += ' WHERE product_id = ?';
    params.push(product_id);
  }
  q += ' ORDER BY created_at DESC';
  db.query(q, params, (err, results) => {
    if (err) {
      console.error('Fetch reviews error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});

app.post('/api/reviews', (req, res) => {
  const { product_id, reviewer_name, comment, rating } = req.body;
  if (!product_id || typeof rating === 'undefined') return res.status(400).json({ error: 'Missing fields' });
  const q = 'INSERT INTO product_reviews (product_id, reviewer_name, comment, rating) VALUES (?, ?, ?, ?)';
  db.query(q, [product_id, reviewer_name || null, comment || null, rating], (err, result) => {
    if (err) {
      console.error('Insert review error:', err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(201).json({ message: 'Review saved' });
  });
});

// List images from public/images folder
app.get('/api/images', (req, res) => {
  const imgDir = path.join(__dirname, 'public', 'images');
  fs.readdir(imgDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Cannot read images folder' });
    const images = files.filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f));
    res.json(images);
  });
});

// Offers Management
app.get('/api/offers', (req, res) => {
  db.query('SELECT * FROM offers ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error('[Offers] GET Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.post('/api/offers', (req, res) => {
  const { product_name, discount_percent, reason, end_date, active } = req.body;
  console.log('[Offers] Creating new offer:', { product_name, discount_percent });
  const q = 'INSERT INTO offers (product_name, discount_percent, reason, end_date, active) VALUES (?, ?, ?, ?, ?)';
  db.query(q, [product_name, discount_percent, reason, end_date || null, active ?? 1], (err, result) => {
    if (err) {
      console.error('[Offers] POST Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Offer created', id: result.insertId });
  });
});

app.put('/api/offers/:id', (req, res) => {
  const { id } = req.params;
  const { product_name, discount_percent, reason, end_date, active } = req.body;
  console.log('[Offers] Updating offer ID:', id, { product_name });
  const q = 'UPDATE offers SET product_name = ?, discount_percent = ?, reason = ?, end_date = ?, active = ? WHERE id = ?';
  db.query(q, [product_name, discount_percent, reason, end_date || null, active ?? 1, id], (err, result) => {
    if (err) {
      console.error('[Offers] PUT Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Offer updated' });
  });
});

app.delete('/api/offers/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM offers WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('[Offers] DELETE Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Offer deleted' });
  });
});

// Reorder products
app.put('/api/products/reorder', async (req, res) => {
  const { order } = req.body; 
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid payload' });
  
  try {
    // Use a more robust way to get promise-based DB
    const pool = db.promise(); 
    for (const item of order) {
      if (!item.id) continue;
      await pool.query('UPDATE menu_items SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
    res.json({ message: 'Order saved' });
  } catch (err) {
    console.error('Reorder Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// Create new product
app.post('/api/products', async (req, res) => {
  const { name, price_num, description, available, category_id, image_url, tags, addons, addon_ids, tag_ids } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  try {
    const promiseDb = db.promise();
    await promiseDb.beginTransaction();

    // Get max sort_order
    const [rows] = await promiseDb.query('SELECT MAX(sort_order) as maxOrder FROM menu_items');
    const nextOrder = (rows[0].maxOrder || 0) + 1;

    const cleanPrice = price_num ? convertNumerals(price_num.toString()).replace(/[^0-9.]/g, '') : null;
    const price_display = cleanPrice ? `£${parseFloat(cleanPrice).toFixed(2)}` : null;

    const q = 'INSERT INTO menu_items (category_id, name, price_num, price_display, description, tags, available, image_url, addons, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await promiseDb.query(q, [category_id || null, name, cleanPrice, price_display, description || null, tags || null, available ?? 1, image_url || null, addons || null, nextOrder]);
    
    const productId = result.insertId;

    // Sync Addons in bridge table
    if (Array.isArray(addon_ids)) {
      for (const aid of addon_ids) {
        if (aid) {
          await promiseDb.query('INSERT INTO menu_item_addons (menu_item_id, addon_id) VALUES (?, ?)', [productId, aid]);
        }
      }
    }

    // Sync Tags in bridge table
    if (Array.isArray(tag_ids)) {
      for (const tid of tag_ids) {
        if (tid) {
          await promiseDb.query('INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES (?, ?)', [productId, tid]);
        }
      }
    }

    await promiseDb.commit();
    res.status(201).json({ message: 'Product created successfully', id: productId });
  } catch (err) {
    await db.promise().rollback();
    console.error('Create product error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  let { name, price_num, description, available, category_id, image_url, tags, addons, addon_ids, tag_ids } = req.body;
  
  try {
    const promiseDb = db.promise();
    await promiseDb.beginTransaction();

    const cleanPrice = price_num ? convertNumerals(price_num.toString()).replace(/[^0-9.]/g, '') : null;
    const query = "UPDATE menu_items SET name = ?, price_num = ?, description = ?, available = ?, category_id = ?, image_url = ?, tags = ?, addons = ? WHERE id = ?";
    await promiseDb.query(query, [name, cleanPrice, description, available, category_id || null, image_url || null, tags || null, addons || null, id]);

    // Sync Addons in bridge table
    if (Array.isArray(addon_ids)) {
      await promiseDb.query('DELETE FROM menu_item_addons WHERE menu_item_id = ?', [id]);
      for (const aid of addon_ids) {
        if (aid) {
          await promiseDb.query('INSERT INTO menu_item_addons (menu_item_id, addon_id) VALUES (?, ?)', [id, aid]);
        }
      }
    }

    // Sync Tags in bridge table
    if (Array.isArray(tag_ids)) {
      await promiseDb.query('DELETE FROM menu_item_tags WHERE menu_item_id = ?', [id]);
      for (const tid of tag_ids) {
        if (tid) {
          await promiseDb.query('INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES (?, ?)', [id, tid]);
        }
      }
    }

    await promiseDb.commit();
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    await db.promise().rollback();
    console.error('[Server] Product Update Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const promiseDb = db.promise();
    // 1. Delete from recipes first
    await promiseDb.query("DELETE FROM recipes WHERE menu_item_id = ?", [id]);
    
    // 2. Delete from menu_items
    await promiseDb.query("DELETE FROM menu_items WHERE id = ?", [id]);
    
    res.json({ message: 'Product and associated recipes deleted successfully' });
  } catch (err) {
    console.error('Delete Error:', err.message);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: 'Cannot delete this product because it has associated sales orders. Please mark it as "Unavailable" instead.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Job Applications Management
app.get('/api/applications', (req, res) => {
  db.query('SELECT * FROM job_applications ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('[Applications] GET Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.post('/api/applications', (req, res) => {
  console.log('[DEBUG] Applications Post Body:', req.body);
  const { name, email, phone, position, cover_letter, resume_url } = req.body;
  const q = 'INSERT INTO job_applications (name, email, phone, position, cover_letter, resume_url) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(q, [name, email, phone, position, cover_letter, resume_url], (err, result) => {
    if (err) {
      console.error('[Applications] POST Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Application submitted successfully', id: result.insertId });
  });
});

app.put('/api/applications/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.query('UPDATE job_applications SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Status updated' });
  });
});

app.delete('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM job_applications WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Application deleted' });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port: ${PORT}`);
});