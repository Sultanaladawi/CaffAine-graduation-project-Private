const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure the public/images directory exists to prevent upload crashes
const imgDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

// Multer config: save to public/images, keep original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imgDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ok = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
  }
});
let openai = null;
const API_KEY = (process.env.OPENAI_API_KEY || '').trim();

if (API_KEY && API_KEY !== 'your_key_here') {
  const IS_GITHUB = API_KEY.startsWith('github_') || API_KEY.startsWith('ghp_');
  const BASE_URL = IS_GITHUB ? 'https://models.inference.ai.azure.com' : 'https://api.openai.com/v1';

  openai = new OpenAI({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    timeout: 120000,
    maxRetries: 2
  });

  console.log('------------------------------------------');
  console.log(`🤖 AI PROVIDER: ${IS_GITHUB ? 'GitHub Models' : 'Standard OpenAI'} Detected`);
  console.log(`🔗 BASE URL: ${BASE_URL}`);
  console.log('------------------------------------------');
} else {
  console.warn('[WARNING] AI API Key missing or default. AI Assistant in Fallback Mode.');
}

const app = express();
const PORT = process.env.SERVER_PORT || 3005; // Changed to 3005 to match the React proxy in package.json

app.use(cors({
  origin: function (origin, callback) {
    // Allow any localhost origin (for dev: 3000, 3001, 3002, 3003, etc.) and no-origin (curl/Postman)
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);

  const adminEmail = req.headers['x-admin-email'];
  const adminName = req.headers['x-admin-name'];

  req.logAdminAction = (action, details) => {
    if (adminEmail) {
      const q = 'INSERT INTO admin_logs (admin_email, admin_name, action, details) VALUES (?, ?, ?, ?)';
      db.query(q, [adminEmail, adminName || 'Unknown', action, details], (err) => {
        if (err) console.error('[Audit Log Error]', err.message);
      });
    }
  };

  next();
});

// Routes moved below db initialization

// Image upload endpoint
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ filename: req.file.filename, url: `/images/${req.file.filename}` });
});

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'Server is reaching here' });
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'graduation_project',
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool; // Alias for backward compatibility in the code

// Standardize numeric input from various formats
const convertNumerals = str => {
  if (typeof str === 'undefined' || str === null) return '';
  const s = str.toString();
  return s.replace(/[\u0660-\u0669]/g, d => '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669'.indexOf(d)).replace(/[0-9]/g, d => d);
};

db.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL Connection Error:', err.message);
    return;
  }
  console.log(`Database connected successfully via Pool`);

  // --- Automated Schema Verification ---
  const checkColumns = async () => {
    try {
      const promiseDb = db.promise();
      const [columns] = await promiseDb.query("SHOW COLUMNS FROM orders");
      const columnNames = columns.map(c => c.Field);

      if (!columnNames.includes('phone')) {
        console.log('[Migration] Adding "phone" column to orders...');
        await promiseDb.query("ALTER TABLE orders ADD COLUMN phone VARCHAR(50) DEFAULT NULL");
      }
      if (!columnNames.includes('delivery_address')) {
        console.log('[Migration] Adding "delivery_address" column to orders...');
        await promiseDb.query("ALTER TABLE orders ADD COLUMN delivery_address TEXT DEFAULT NULL");
      }

      // FIX EXISTING 0 PRICE ADDONS IN ORDERS
      console.log('[Migration] Checking for 0-price items in order_items...');
      try {
        const [zeroItems] = await promiseDb.query("SELECT id, item_name, order_id, quantity FROM order_items WHERE price = 0 OR price IS NULL");
        for (const zi of zeroItems) {
          const [addRes] = await promiseDb.query("SELECT price FROM addons WHERE name = ?", [zi.item_name]);
          if (addRes && addRes.length > 0 && parseFloat(addRes[0].price) > 0) {
            const fixedPrice = parseFloat(addRes[0].price);
            await promiseDb.query("UPDATE order_items SET price = ? WHERE id = ?", [fixedPrice, zi.id]);
            await promiseDb.query("UPDATE orders SET total_amount = total_amount + ? WHERE id = ?", [fixedPrice * zi.quantity, zi.order_id]);
            console.log(`[Migration] Fixed price for addon '${zi.item_name}' in order #${zi.order_id}`);
          }
        }
      } catch (e) {
        console.error('[Migration] Addon price fix failed:', e.message);
      }

      console.log('[Migration] Schema verification complete.');
    } catch (dbErr) {
      console.error('[Migration] Schema check failed:', dbErr.message);
    }
  };
  checkColumns();

  if (connection) connection.release();
});

// --- PRIMARY ORDERS API (Top Priority) ---
app.post('/api/orders', async (req, res) => {

  console.log('[Server] Body:', JSON.stringify(req.body, null, 2));

  const { customer_name, email, total_amount, cartItems, order_type, delivery_address, phone } = req.body;

  // Basic validation: Email is now optional, but name, items and phone are required
  if (!customer_name || !Array.isArray(cartItems) || cartItems.length === 0 || !phone) {
    console.error('[Server] Order Error: Missing required fields (Name, Items, or Phone)');
    return res.status(400).json({ error: 'Missing required contact information' });
  }

  const totalAmount = parseFloat(total_amount);
  const promiseDb = db.promise();

  const conn = await promiseDb.getConnection();

  try {
    await conn.beginTransaction();
    console.log('[Server] Transaction started');

    // Check stock
    for (const item of cartItems) {
      const productId = parseInt(item.id, 10);
      const quantity = parseInt(item.qty, 10);
      if (isNaN(productId)) continue;

      const [ingredients] = await conn.query(`
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

    // Insert Order with default 2 minutes prep time
    const [orderInsertResult] = await conn.query(
      "INSERT INTO orders (customer_name, email, total_amount, status, created_at, estimated_ready_at, order_type, delivery_address, phone) VALUES (?, ?, ?, 'preparing', NOW(), DATE_ADD(NOW(), INTERVAL 2 MINUTE), ?, ?, ?)",
      [customer_name, email, totalAmount, order_type || 'takeaway', delivery_address || null, phone || null]
    );
    const orderId = orderInsertResult.insertId;

    let calculatedTotal = 0;

    // Insert Items
    for (const item of cartItems) {
      const productId = parseInt(item.id, 10);
      const quantity = parseFloat(item.qty);
      let price = parseFloat(item.priceNum);

      // Auto-correct missing or zero prices
      if (isNaN(price) || price === 0) {
        const [addonRows] = await conn.query("SELECT price FROM addons WHERE name = ?", [item.name]);
        if (addonRows && addonRows.length > 0) {
          price = parseFloat(addonRows[0].price) || 0;
        } else if (!isNaN(productId)) {
          const [productRows] = await conn.query("SELECT price_num FROM menu_items WHERE id = ?", [productId]);
          if (productRows && productRows.length > 0) {
            price = parseFloat(productRows[0].price_num) || 0;
          } else {
            price = 0;
          }
        } else {
          price = 0;
        }
      }

      calculatedTotal += price * quantity;

      await conn.query(
        "INSERT INTO order_items (order_id, product_id, item_name, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [orderId, isNaN(productId) ? null : productId, item.name, quantity, price]
      );

      // Deduct product recipe
      if (!isNaN(productId)) {
        const [recipeSteps] = await conn.query("SELECT inventory_id, quantity_required FROM recipes WHERE menu_item_id = ?", [productId]);
        for (const ingredient of recipeSteps) {
          const deductAmount = parseFloat(ingredient.quantity_required) * quantity;
          await conn.query("UPDATE inventory SET quantity = GREATEST(quantity - ?, 0) WHERE id = ?", [deductAmount, ingredient.inventory_id]);
        }
      }

      // Deduct addons
      if (Array.isArray(item.addons)) {
        for (const addon of item.addons) {
          const [addonRows] = await conn.query("SELECT inventory_id FROM addons WHERE name = ? OR id = ?", [addon.name, addon.id]);
          if (addonRows && addonRows.length > 0 && addonRows[0].inventory_id) {
            await conn.query("UPDATE inventory SET quantity = GREATEST(quantity - ?, 0) WHERE id = ?", [1 * quantity, addonRows[0].inventory_id]);
          }
        }
      }
    }

    if (calculatedTotal > totalAmount) {
      await conn.query("UPDATE orders SET total_amount = ? WHERE id = ?", [calculatedTotal, orderId]);
    }

    await conn.commit();
    console.log('[Server] Order saved successfully:', orderId);
    res.status(201).json({ success: true, orderId });

  } catch (err) {
    console.error('[Server] CRITICAL Order Error:', err.message);
    await conn.rollback();
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  } finally {
    conn.release();
  }
});

// Helper to check if store is open based on official business hours
const getAutoStoreStatus = () => {
  const now = new Date();
  const day = now.getDay(); // 0: Sunday, 1-5: Mon-Fri, 6: Sat
  const currentTime = now.getHours() * 100 + now.getMinutes(); // Format: HHMM (e.g., 07:30 -> 730)

  // Monday (1) - Friday (5): 07:30 - 17:00
  if (day >= 1 && day <= 5) {
    return (currentTime >= 730 && currentTime < 1700) ? 'open' : 'closed';
  }
  // Saturday (6): 09:00 - 18:00
  if (day === 6) {
    return (currentTime >= 900 && currentTime < 1800) ? 'open' : 'closed';
  }
  // Sunday (0): 10:00 - 16:00
  if (day === 0) {
    return (currentTime >= 1000 && currentTime < 1600) ? 'open' : 'closed';
  }

  return 'closed';
};

app.get('/api/store-status', (req, res) => {
  db.query('SELECT value FROM site_settings WHERE `key` = ?', ['store_status'], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    let mode = results.length > 0 ? results[0].value : 'auto';
    let currentState = mode;

    if (mode === 'auto') {
      currentState = getAutoStoreStatus();
    } else if (mode === 'manual_open') {
      currentState = 'open';
    } else if (mode === 'manual_closed') {
      currentState = 'closed';
    }

    res.json({
      mode: mode,
      status: currentState,
      display: mode === 'auto' ? `Automatic (${currentState.toUpperCase()})` : mode.replace('_', ' ').toUpperCase()
    });
  });
});

app.post('/api/store-status', (req, res) => {
  const { status } = req.body; // Expecting 'manual_open', 'manual_closed', or 'auto'
  db.query('INSERT INTO site_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
    ['store_status', status, status], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, mode: status });
    });
});
// ------------------------------------------

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
`, (err) => {
  if (err) console.error('Ensure job_applications table error:', err);
  else {
    // Also ensure 'status' column exists if the table was already there without it
    db.query("ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new'", (alterErr) => {
      if (alterErr && !alterErr.message.includes('Duplicate column name')) console.error('Alter job_applications status error:', alterErr.message);
    });
  }
});

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

db.query(`
  CREATE TABLE IF NOT EXISTS site_settings (
    \`key\` VARCHAR(255) PRIMARY KEY,
    \`value\` TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure site_settings table error:', err); });

db.query(`
  CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percent DECIMAL(5,2),
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure offers table error:', err); });

db.query(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_msg TEXT,
    ai_msg TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure chat_messages table error:', err); });

db.query(`
  CREATE TABLE IF NOT EXISTS ai_assistant_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_query TEXT,
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure ai_assistant_messages table error:', err); });

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

// Ensure menu_items has image_url and created_at columns
db.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url VARCHAR(1024) DEFAULT NULL;`, (err) => {
  if (err && !err.message.includes('Duplicate column name')) console.error('Alter menu_items image_url error:', err.message);
});
db.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`, (err) => {
  if (err && !err.message.includes('Duplicate column name')) console.error('Alter menu_items created_at error:', err.message);
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

// Ensure orders has estimated_ready_at column
db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_ready_at DATETIME DEFAULT NULL;`, (err) => {
  if (err && !err.message.includes('Duplicate column name')) console.error('Alter orders error:', err.message);
});

// Ensure delivery columns exist in orders table
db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT DEFAULT NULL;`, (err) => {
  if (err && !err.message.includes('Duplicate column name')) console.error('Alter orders address error:', err.message);
});

db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT NULL;`, (err) => {
  if (err && !err.message.includes('Duplicate column name')) console.error('Alter orders phone error:', err.message);
});

// Ensure ai_insights_cache table exists
db.query(`
  CREATE TABLE IF NOT EXISTS ai_insights_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic VARCHAR(100) UNIQUE,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure ai_insights_cache table error:', err); });

// Ensure admin_logs table exists
db.query(`
  CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_email VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255) DEFAULT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`, (err) => { if (err) console.error('Ensure admin_logs table error:', err); });

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
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields required' });

  db.query('INSERT INTO contact_messages (name, email, message, is_read) VALUES (?, ?, ?, 0)', [name, email, message], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
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
  console.log('[Server] Received General Feedback:', req.body);
  const { reviewer_name, comment, rating } = req.body;
  const q = 'INSERT INTO general_feedback (reviewer_name, comment, rating) VALUES (?, ?, ?)';
  db.query(q, [reviewer_name || 'Anonymous', comment, rating || 5], (err, result) => {
    if (err) {
      console.error('[Server] SQL Error inserting general feedback:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('[Server] General feedback saved! ID:', result.insertId);
    res.status(201).json({ message: 'Feedback submitted successfully', id: result.insertId });
  });
});

app.post('/api/feedback/product', (req, res) => {
  console.log('[Server] Received Product Feedback:', req.body);
  const { product_id, reviewer_name, comment, rating } = req.body;
  if (!product_id) {

    return res.status(400).json({ error: 'Product ID is required' });
  }

  const q = 'INSERT INTO product_reviews (product_id, reviewer_name, comment, rating) VALUES (?, ?, ?, ?)';
  db.query(q, [product_id, reviewer_name || 'Anonymous', comment, rating || 5], (err, result) => {
    if (err) {
      console.error('[Server] SQL Error inserting review:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('[Server] Review saved successfully! ID:', result.insertId);
    res.status(201).json({ message: 'Review submitted successfully', id: result.insertId });
  });
});

// --- AUTO DETECT CATEGORY SCHEMA ---
db.query("SHOW COLUMNS FROM categories", (err, columns) => {
  if (!err) {
    const names = columns.map(c => c.Field);
    if (names.includes('label')) {
      categoryNameColumn = 'label';
      console.log("[Data Integrity] Detected Category Name Column: 'label'");
    } else {
      console.log("[Data Integrity] Using Category Name Column: 'name'");
    }
  }
});

// Ensure site_settings table exists
db.query(`
  CREATE TABLE IF NOT EXISTS site_settings (
    \`key\` VARCHAR(255) PRIMARY KEY,
    \`value\` VARCHAR(255) NOT NULL
  )
`, (err) => {
  if (err) console.error('[Migration] Failed to ensure site_settings:', err.message);
});

app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [[products]] = await promiseDb.query("SELECT COUNT(*) as count FROM menu_items");
    const [[orders]] = await promiseDb.query("SELECT COUNT(*) as count FROM orders");
    const [[sales]] = await promiseDb.query("SELECT COALESCE(SUM(total_amount),0) as total FROM orders");
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

    const [[todayStats]] = await promiseDb.query("SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE DATE(created_at) = CURDATE()");
    const [[yesterdayStats]] = await promiseDb.query("SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)");

    const [[statusSetting]] = await promiseDb.query("SELECT value FROM site_settings WHERE `key` = 'store_status'");
    const mode = statusSetting ? statusSetting.value : 'auto';
    let currentState = mode;
    if (mode === 'auto') currentState = getAutoStoreStatus();
    else if (mode === 'manual_open') currentState = 'open';
    else if (mode === 'manual_closed') currentState = 'closed';

    res.json({
      totalProducts: products.count,
      totalOrders: orders.count,
      totalSales: sales.total || 0,
      todayOrders: todayStats.count || 0,
      todaySales: todayStats.revenue || 0,
      yesterdayOrders: yesterdayStats.count || 0,
      yesterdaySales: yesterdayStats.revenue || 0,
      storeStatus: currentState,
      storeMode: mode,
      lowStock: lowStockItems.length,
      lowStockItems: lowStockItems,
      dailySales: dailySales,
      categoryStats: categoryStats
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

// update an addon
app.put('/api/addons/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, inventory_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const promiseDb = db.promise();
    await promiseDb.query('UPDATE addons SET name = ?, price = ?, inventory_id = ? WHERE id = ?',
      [name.trim(), price || 0, inventory_id || null, id]);
    res.json({ success: true, id, name: name.trim(), price, inventory_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete an addon
app.delete('/api/addons/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const promiseDb = db.promise();
    // First remove from bridge table
    await promiseDb.query('DELETE FROM menu_item_addons WHERE addon_id = ?', [id]);
    // Then remove the addon itself
    await promiseDb.query('DELETE FROM addons WHERE id = ?', [id]);
    res.json({ success: true });
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

// rename a tag
app.put('/api/tags/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const promiseDb = db.promise();
    await promiseDb.query('UPDATE tags SET name = ? WHERE id = ?', [name.trim(), id]);
    res.json({ success: true, id, name: name.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete a tag and its links
app.delete('/api/tags/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const promiseDb = db.promise();
    await promiseDb.query('DELETE FROM menu_item_tags WHERE tag_id = ?', [id]);
    await promiseDb.query('DELETE FROM tags WHERE id = ?', [id]);
    res.json({ success: true });
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
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(results[0]);
  });
});

app.get('/api/order-status/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      status, 
      estimated_ready_at,
      GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), estimated_ready_at)) AS seconds_left
    FROM orders 
    WHERE id = ?`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('[Status API] SQL Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({
      status: results[0].status,
      seconds_left: results[0].seconds_left || 0
    });
  });
});

app.put('/api/extend-order/:id', (req, res) => {
  const { id } = req.params;
  const { minutes } = req.body;
  if (!minutes) return res.status(400).json({ error: 'Minutes required' });

  console.log(`[Extend API] Extending order #${id} by ${minutes}m`);
  const cleanMins = parseInt(minutes) || 2;

  // ✅ GREATEST ensures we always extend from NOW if the order already expired
  const query = `
    UPDATE orders 
    SET estimated_ready_at = DATE_ADD(GREATEST(COALESCE(estimated_ready_at, NOW()), NOW()), INTERVAL ${cleanMins} MINUTE),
        status = 'preparing' 
    WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('[Extend API] SQL Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (req.logAdminAction) req.logAdminAction('Extend Order Time', `Extended order #${id} by ${cleanMins} mins`);
    res.json({ success: true, message: `Preparation time extended by ${cleanMins} minutes` });
  });
});

app.put('/api/mark-ready/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status required' });

  console.log(`[Status API] Marking order #${id} as ${status}`);

  // 1. Update status using standard callback
  db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id], (err, result) => {
    if (err) {
      console.error('[Mark Ready Error]:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (req.logAdminAction) req.logAdminAction('Update Order Status', `Marked order #${id} as ${status}`);

    // 2. Success response
    res.json({ success: true, message: `Order status updated to ${status}` });

    // 3. Background Notifications (non-blocking)
    if (status === 'ready') {
      db.query("SELECT customer_name, email, phone FROM orders WHERE id = ?", [id], (err, rows) => {
        if (!err && rows.length > 0) {
          const order = rows[0];
          console.log(`\n🔔 [NOTIFICATION] --- Order Ready: ORD-${String(id).padStart(3, '0')} ---`);
          if (order.phone) console.log(`📱 SMS to ${order.phone}: "Hello ${order.customer_name}, your order is ready!"`);
          if (order.email) console.log(`📧 Email to ${order.email}: "Order Ready! Your order is waiting."`);
          console.log(`---------------------------------------------------------\n`);
        }
      });
    }
  });
});

app.get('/api/order-items/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`[Server] Fetching items for order_id: ${orderId}`);
    const promiseDb = db.promise();
    const [results] = await promiseDb.query(
      "SELECT oi.*, COALESCE(oi.item_name, m.name) as item_name FROM order_items oi LEFT JOIN menu_items m ON oi.product_id = m.id WHERE oi.order_id = ?",
      [orderId]
    );
    console.log(`[Server] Found ${results.length} items for order_id: ${orderId}`);
    res.status(200).json(results);
  } catch (err) {
    console.error('Order Items Fetch Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const promiseDb = db.promise();

    // 1. Fetch active offers to calculate discounted prices
    const [offers] = await promiseDb.query("SELECT * FROM offers WHERE active = 1 AND (end_date IS NULL OR end_date >= CURDATE())");

    // 2. Fetch all available addons to have a name-to-price mapping for fallback
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
          SELECT GROUP_CONCAT(DISTINCT CONCAT(a.id, '|', a.name, '|', a.price))
          FROM menu_item_addons mia
          JOIN addons a ON mia.addon_id = a.id
          WHERE mia.menu_item_id = m.id
        ) as linked_addons,
        (
          SELECT GROUP_CONCAT(DISTINCT CONCAT(t.id, '|', t.name))
          FROM menu_item_tags mit
          JOIN tags t ON mit.tag_id = t.id
          WHERE mit.menu_item_id = m.id
        ) as linked_tags
      FROM menu_items m
    `);

    const products = results.map(p => {
      // Find matching offer
      const matchingOffer = offers.find(o => {
        const prodName = (p.name || '').toLowerCase();
        const offerProd = (o.product_name || '').toLowerCase();
        return prodName.includes(offerProd) || offerProd.includes(prodName) || offerProd === 'all';
      });

      let discountedPrice = null;
      if (matchingOffer && p.price_num) {
        discountedPrice = parseFloat(p.price_num) * (1 - (matchingOffer.discount_percent / 100));
      }

      // 1. Structured Addons from bridge table
      let addonsArray = p.linked_addons ? p.linked_addons.split(',').map(pair => {
        const [id, name, price] = pair.split('|');
        return { id, name, price: parseFloat(price) };
      }) : [];

      // 2. Fallback to legacy string field if bridge table is empty
      if (addonsArray.length === 0 && p.addons) {
        addonsArray = p.addons.split(',').map((name, idx) => {
          const cleanName = name.trim();
          const matchedPrice = addonPriceMap[cleanName.toLowerCase()] || 0.50; // Default to 0.50 if not found
          return {
            id: `legacy-${idx}-${cleanName.replace(/\s+/g, '-')}`,
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
        linkedTags: tagsArray,
        discounted_price: discountedPrice
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
    db.query('INSERT INTO admin_logs (admin_email, admin_name, action, details) VALUES (?, ?, ?, ?)',
      [user.email, user.name, 'Login', 'Logged into the system'], () => { });

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
      if (req.logAdminAction) req.logAdminAction('Add Inventory Item', `Added item: ${item_name}`);
      res.status(201).json({
        id: result.insertId,
        item_name,
        quantity: cleanQty,
        unit,
        min_threshold: cleanThreshold
      });
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

    console.log('[Server] Hit Unique Update Route for ID:', id);
    const query = "UPDATE inventory SET item_name = ?, quantity = ?, unit = ?, min_threshold = ? WHERE id = ?";
    db.query(query, [item_name, cleanQty, unit, cleanThreshold, id], (err, result) => {
      if (err) {
        console.error('[Inventory] Update SQL Error:', err.message);
        return res.status(500).json({ error: `SQL Error: ${err.message}` });
      }
      if (req.logAdminAction) req.logAdminAction('Update Stock', `Updated ${item_name} to ${cleanQty} ${unit}`);
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

// --- Recipe / Ingredient Mapping ---
app.get('/api/products/:id/recipe', async (req, res) => {
  const { id } = req.params;
  try {
    const promiseDb = db.promise();
    const [results] = await promiseDb.query(`
      SELECT r.*, i.item_name, i.unit 
      FROM recipes r
      JOIN inventory i ON r.inventory_id = i.id
      WHERE r.menu_item_id = ?
    `, [id]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products/:id/recipe', async (req, res) => {
  const { id } = req.params;
  const { ingredients } = req.body; // Array of { inventory_id, quantity_required }
  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    // Clear old recipe
    await conn.query('DELETE FROM recipes WHERE menu_item_id = ?', [id]);
    // Insert new mapping
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      const values = ingredients.map(ing => [id, ing.inventory_id, ing.quantity_required]);
      await conn.query('INSERT INTO recipes (menu_item_id, inventory_id, quantity_required) VALUES ?', [values]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

app.post('/api/ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  try {
    if (!openai) {
      return res.json({ answer: "[Local Mode] AI Assistant is currently unavailable. API Key is missing." });
    }

    const now = new Date();
    const currentDateTime = now.toLocaleString('en-GB', { timeZone: 'Europe/London' });
    let context = `You are Sophie, the friendly Barista Bot for Faculty Coffee. Focus on helping customers with the menu, opening hours (Mon-Fri 07:30-17:00, Sat 09:00-18:00, Sun 10:00-16:00), and general info. Current UK time: ${currentDateTime}. Use this to know if the shop is currently open.`;
    try {
      const promiseDb = db.promise();
      const [
        menuRes,
        offersRes,
        careersRes
      ] = await Promise.allSettled([
        promiseDb.query(`SELECT name, price_display FROM menu_items WHERE available = 1`),
        promiseDb.query(`SELECT product_name, discount_percent, reason FROM offers WHERE active = 1`),
        promiseDb.query(`SELECT title, type, location FROM careers WHERE active = 1`)
      ]);
      const menuItems = menuRes.status === 'fulfilled' ? menuRes.value[0].map(m => `${m.name} (${m.price_display})`).join(', ') : '';
      const offersSummary = offersRes.status === 'fulfilled' && offersRes.value[0].length > 0 ? offersRes.value[0].map(o => `${o.discount_percent}% off ${o.product_name} (${o.reason})`).join(' | ') : 'No active offers right now.';
      const careersSummary = careersRes.status === 'fulfilled' && careersRes.value[0].length > 0 ? careersRes.value[0].map(c => `${c.title} (${c.type}) at ${c.location}`).join(' | ') : 'No active job openings right now.';
      context += `\nMenu: ${menuItems}\nOffers: ${offersSummary}\nJobs: ${careersSummary}`;
    } catch (e) {
      console.warn('[AI] Context Fetch Error:', e.message);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
    });
    const answer = response.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    console.error('[AI API] Error:', err);
    res.status(500).json({ error: 'AI service failure' });
  }
});

// (Redundant route removed)

app.post('/api/ai-assistant-logs', (req, res) => {
  const { admin_query, ai_response } = req.body;
  const q = "INSERT INTO ai_assistant_messages (admin_query, ai_response) VALUES (?, ?)";
  db.query(q, [admin_query, ai_response], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ success: true, id: result.insertId });
  });
});

app.get('/api/ai-assistant-logs', (req, res) => {
  db.query("SELECT * FROM ai_assistant_messages ORDER BY created_at DESC LIMIT 50", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
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
  fs.readdir(imgDir, (err, files) => { // Using the imgDir variable defined at the top
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
    if (req.logAdminAction) req.logAdminAction('Add Offer', `Added offer for ${product_name}`);
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
    if (req.logAdminAction) req.logAdminAction('Edit Offer', `Updated offer for ${product_name}`);
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
    if (req.logAdminAction) req.logAdminAction('Delete Offer', `Deleted offer ID: ${id}`);
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

  console.log('[Server] Received Body:', JSON.stringify(req.body, null, 2));
  let { name, price_num, description, available, category_id, image_url, tags, addons, addon_ids, tag_ids } = req.body;

  // Safety: Map legacy string IDs to numeric IDs if necessary
  if (category_id === 'espresso') category_id = '2';
  if (category_id === 'tea') category_id = '6';
  if (category_id === 'cold') category_id = '1';
  if (category_id === 'food') category_id = '3';
  if (category_id === 'sweets') category_id = '5';
  if (category_id === 'soft') category_id = '4';
  if (category_id === 'sides') category_id = '4';

  if (!name) return res.status(400).json({ error: 'Missing name' });

  try {
    const pool = db.promise();
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    // Find current ordering
    const [rows] = await conn.query('SELECT MAX(sort_order) as maxOrder FROM menu_items');
    const nextOrder = (rows[0].maxOrder || 0) + 1;

    const rawPrice = price_num ? convertNumerals(price_num.toString()).replace(/[^0-9.]/g, '') : null;
    const cleanPrice = (rawPrice && rawPrice.trim() !== '') ? rawPrice : null;
    const price_display = cleanPrice ? `£${parseFloat(cleanPrice).toFixed(2)}` : null;

    const q = 'INSERT INTO menu_items (category_id, name, price_num, price_display, description, tags, available, image_url, addons, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [category_id || null, name, cleanPrice, price_display, description || null, tags || null, available ?? 1, image_url || null, addons || null, nextOrder];
    console.log('[Server] Executing INSERT with params:', params);
    const [result] = await conn.query(q, params);

    const productId = result.insertId;

    // Sync Addons in bridge table
    if (Array.isArray(addon_ids)) {
      console.log('[Server] Syncing Addons:', addon_ids);
      for (const aid of addon_ids) {
        if (aid) {
          await conn.query('INSERT IGNORE INTO menu_item_addons (menu_item_id, addon_id) VALUES (?, ?)', [productId, aid]);
        }
      }
    }

    // Sync Tags in bridge table
    if (Array.isArray(tag_ids)) {
      console.log('[Server] Syncing Tags:', tag_ids);
      for (const tid of tag_ids) {
        if (tid) {
          await conn.query('INSERT IGNORE INTO menu_item_tags (menu_item_id, tag_id) VALUES (?, ?)', [productId, tid]);
        }
      }
    }

    await conn.commit();
    if (req.logAdminAction) req.logAdminAction('Add Product', `Added new product: ${name}`);
    res.status(201).json({ message: 'Product created successfully', id: productId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Create product error:', err);
    res.status(500).json({ error: err.sqlMessage || err.message || 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  let { name, price_num, description, available, category_id, image_url, tags, addons, addon_ids, tag_ids } = req.body;

  const pool = db.promise();
  let conn;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    let cleanPrice = null;
    if (price_num !== undefined && price_num !== null) {
      cleanPrice = convertNumerals(price_num.toString()).replace(/[^0-9.]/g, '');
    }
    const query = "UPDATE menu_items SET name = ?, price_num = ?, description = ?, available = ?, category_id = ?, image_url = ?, tags = ?, addons = ? WHERE id = ?";
    await conn.query(query, [name, cleanPrice, description, available, category_id || null, image_url || null, tags || null, addons || null, id]);

    // Sync Addons in bridge table
    if (Array.isArray(addon_ids)) {
      await conn.query('DELETE FROM menu_item_addons WHERE menu_item_id = ?', [id]);
      for (const aid of addon_ids) {
        if (aid) {
          await conn.query('INSERT INTO menu_item_addons (menu_item_id, addon_id) VALUES (?, ?)', [id, aid]);
        }
      }
    }

    // Sync Tags in bridge table
    if (Array.isArray(tag_ids)) {
      await conn.query('DELETE FROM menu_item_tags WHERE menu_item_id = ?', [id]);
      for (const tid of tag_ids) {
        if (tid) {
          await conn.query('INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES (?, ?)', [id, tid]);
        }
      }
    }

    await conn.commit();
    if (req.logAdminAction) req.logAdminAction('Edit Product', `Updated product: ${name}`);
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('[Server] Product Update Error:', err);
    res.status(500).json({ error: err.sqlMessage || err.message || 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
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

    if (req.logAdminAction) req.logAdminAction('Delete Product', `Deleted product ID: ${id}`);
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
  console.log('[Server] Applications Post Body:', req.body);
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

// =============================================
// CHAT MESSAGES (Customer Chatbot Logs)
// =============================================
// GET - fetch all chat messages for AIAssistant panel
app.get('/api/messages', (req, res) => {
  db.query('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 100', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST - save a new chat message from Chatbot
app.post('/api/messages', (req, res) => {
  const { user_msg, ai_msg } = req.body;
  if (!user_msg) return res.status(400).json({ error: 'user_msg is required' });

  // Safety check for logging
  const uLog = String(user_msg || '').substring(0, 50);
  const aLog = String(ai_msg || '').substring(0, 50);
  console.log(`[Chat Log] User: ${uLog} | AI: ${aLog}`);

  db.query(
    'INSERT INTO chat_messages (user_msg, ai_msg) VALUES (?, ?)',
    [user_msg, ai_msg || ''],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true, id: result.insertId });
    }
  );
});

// POST - save admin AI assistant conversation log
app.post('/api/ai-assistant-logs', (req, res) => {
  const { admin_query, ai_response } = req.body;
  db.query(
    'INSERT INTO ai_assistant_messages (admin_query, ai_response) VALUES (?, ?)',
    [admin_query || '', ai_response || ''],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true, id: result.insertId });
    }
  );
});

// =============================================
// AI ASSISTANT ENDPOINT (CaffAIne Intelligence)
// =============================================
app.post('/api/ai-chat', async (req, res) => {
  const { message, isAdmin } = req.body;
  console.log(`\n[AI Request] Received: "${message?.substring(0, 50)}..." (isAdmin: ${!!isAdmin})`);

  if (!message) {
    console.error('[AI Request] Error: Missing message');
    return res.status(400).json({ error: 'Message is required' });
  }

  let businessContext = "";
  const now = new Date();
  const currentDateTime = now.toLocaleString('en-GB', { timeZone: 'Europe/London' });

  if (isAdmin) {
    businessContext = `You are the CaffAIne Internal Business Intelligence AI.
Context for ADMIN ONLY: You have full access to internal sales numbers, top-selling items, revenue, and inventory. Answer the admin's questions accurately and analytically.
Current UK time is ${currentDateTime}.`;
    try {
      const promiseDb = db.promise();
      const results = await Promise.allSettled([
        promiseDb.query(`SELECT COUNT(*) as total, COALESCE(SUM(total_amount),0) as revenue FROM orders`),
        promiseDb.query(`SELECT COUNT(*) as total FROM menu_items`),
        promiseDb.query(`SELECT COUNT(*) as total FROM inventory WHERE quantity <= min_threshold`),
        promiseDb.query(`SELECT mi.name, COUNT(oi.id) as sold FROM order_items oi JOIN menu_items mi ON oi.product_id = mi.id GROUP BY oi.product_id ORDER BY sold DESC LIMIT 50`),
        promiseDb.query(`SELECT order_type, COUNT(*) as count FROM orders GROUP BY order_type`),
        promiseDb.query(`SELECT DATE(created_at) as best_date, SUM(total_amount) as daily_rev FROM orders GROUP BY DATE(created_at) ORDER BY daily_rev DESC LIMIT 1`),
        promiseDb.query(`SELECT id, customer_name, status, total_amount, order_type, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as time FROM orders ORDER BY created_at DESC LIMIT 10`),
        promiseDb.query(`SELECT item_name, quantity, min_threshold FROM inventory WHERE quantity <= min_threshold LIMIT 15`),
        promiseDb.query(`SELECT reviewer_name, rating, comment FROM general_feedback ORDER BY created_at DESC LIMIT 7`),
        promiseDb.query(`SELECT title, type, location FROM careers WHERE active = 1`),
        promiseDb.query(`SELECT * FROM offers WHERE active = 1`),
        promiseDb.query(`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 15`),
        promiseDb.query(`SELECT mi.name, mi.price_display, mi.available, mi.description, c.${categoryNameColumn} as category_name, GROUP_CONCAT(DISTINCT t.name) as tags, GROUP_CONCAT(DISTINCT a.name) as addons FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id LEFT JOIN menu_item_tags mit ON mi.id = mit.menu_item_id LEFT JOIN tags t ON mit.tag_id = t.id LEFT JOIN menu_item_addons mia ON mi.id = mia.menu_item_id LEFT JOIN addons a ON mia.addon_id = a.id GROUP BY mi.id`),
        promiseDb.query(`SELECT item_name, quantity, unit, min_threshold FROM inventory`),
        promiseDb.query(`SELECT name, message FROM contact_messages ORDER BY created_at DESC LIMIT 7`),
        promiseDb.query(`SELECT name, position, status, DATE_FORMAT(created_at, '%Y-%m-%d') as date FROM job_applications ORDER BY created_at DESC LIMIT 20`),
        promiseDb.query(`SELECT mi.id, mi.name, c.${categoryNameColumn} as category_name, DATE_FORMAT(mi.created_at, '%Y-%m-%d') as date FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id ORDER BY mi.id DESC LIMIT 15`),
        promiseDb.query(`SELECT mi.name as product_name, pr.reviewer_name, pr.rating, pr.comment FROM product_reviews pr JOIN menu_items mi ON pr.product_id = mi.id ORDER BY pr.created_at DESC LIMIT 7`),
        promiseDb.query(`SELECT value FROM site_settings WHERE \`key\` = 'store_status' LIMIT 1`)
      ]);

      const [
        ordersRes, productsRes, stockRes, topRes,
        typeRes, bestDayRes, recentOrdersRes,
        lowStockDetailsRes, feedbackRes, careersRes, offersRes, dailySalesRes,
        fullMenuRes, fullInventoryRes, contactMessagesRes, jobApplicationsRes,
        latestItemRes, productReviewsRes, storeStatusRes
      ] = results;

      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value[0][0] : { total: 0, revenue: 0 };
      const products = productsRes.status === 'fulfilled' ? productsRes.value[0][0] : { total: 0 };
      const lowStock = stockRes.status === 'fulfilled' ? stockRes.value[0][0] : { total: 0 };
      const topProducts = topRes.status === 'fulfilled' ? topRes.value[0] : [];
      const orderTypes = typeRes.status === 'fulfilled' ? typeRes.value[0] : [];
      const bestDay = bestDayRes.status === 'fulfilled' ? bestDayRes.value[0][0] : null;

      const recentOrders = recentOrdersRes.status === 'fulfilled' ? recentOrdersRes.value[0] : [];
      const lowStockDetails = lowStockDetailsRes.status === 'fulfilled' ? lowStockDetailsRes.value[0] : [];
      const recentFeedback = feedbackRes.status === 'fulfilled' ? feedbackRes.value[0] : [];
      const careers = careersRes.status === 'fulfilled' ? careersRes.value[0] : [];
      const offers = offersRes.status === 'fulfilled' ? offersRes.value[0] : [];
      const dailySales = dailySalesRes.status === 'fulfilled' ? dailySalesRes.value[0] : [];
      const fullMenu = fullMenuRes.status === 'fulfilled' ? fullMenuRes.value[0] : [];
      const fullInventory = fullInventoryRes.status === 'fulfilled' ? fullInventoryRes.value[0] : [];
      const contactMessages = contactMessagesRes.status === 'fulfilled' ? contactMessagesRes.value[0] : [];
      const jobApplications = jobApplicationsRes.status === 'fulfilled' ? jobApplicationsRes.value[0] : [];
      const productReviews = productReviewsRes.status === 'fulfilled' ? productReviewsRes.value[0] : [];
      const latestItem = latestItemRes.status === 'fulfilled' ? latestItemRes.value[0][0] : null;

      const typeSummary = orderTypes.map(t => `${t.order_type}: ${t.count}`).join(', ');
      const topSummary = topProducts.map(p => `${p.name} (${p.sold} sold)`).join(', ');
      const bestDaySummary = bestDay ? `${new Date(bestDay.best_date).toLocaleDateString()} with £${parseFloat(bestDay.daily_rev).toFixed(2)}` : 'N/A';

      const latestItemSummary = latestItem ? latestItem.name : 'Unknown';

      const recentOrdersSummary = recentOrders.length > 0
        ? recentOrders.map(o => `ORD-${String(o.id).padStart(3, '0')} (${o.customer_name}, £${parseFloat(o.total_amount).toFixed(2)}, ${o.status}, ${o.time})`).join(' | ')
        : 'No recent orders.';

      const lowStockSummary = lowStockDetails.length > 0
        ? lowStockDetails.map(i => `${i.item_name} (Qty:${i.quantity}, Min:${i.min_threshold})`).join(', ')
        : 'All stock levels are healthy.';

      const feedbackSummary = recentFeedback.length > 0
        ? recentFeedback.map(f => `${f.rating}/5 from ${f.reviewer_name}: "${f.comment}"`).join(' | ')
        : 'No recent general feedback.';

      const productReviewSummary = productReviews.length > 0
        ? productReviews.map(r => `${r.rating}/5 for ${r.product_name} by ${r.reviewer_name}: "${r.comment}"`).join(' | ')
        : 'No recent product reviews.';

      const careersSummary = careers.length > 0 ? careers.map(c => `${c.title} (${c.type}) in ${c.location}`).join(', ') : 'No active job openings.';
      const offersSummary = offers.length > 0
        ? offers.map(o => JSON.stringify(o)).join(', ')
        : 'No active offers.';

      const dailySalesSummary = dailySales.length > 0
        ? dailySales.map(d => `[${d.date}: ${d.count} orders, £${parseFloat(d.revenue).toFixed(2)}]`).join(' ')
        : 'No sales history yet.';

      const fullMenuSummary = fullMenu.length > 0
        ? fullMenu.map(m => `${m.name} [£${m.price_display}, Cat: ${m.category_name || 'General'}]`).join(', ')
        : 'Menu is empty.';

      const healthyInventorySummary = "All other items are healthy.";

      const approachingLow = fullInventory.filter(i => i.quantity > i.min_threshold && i.quantity <= i.min_threshold * 1.5);
      const approachingLowSummary = approachingLow.length > 0
        ? approachingLow.map(i => `${i.item_name} (Qty: ${i.quantity}, Min: ${i.min_threshold})`).join(', ')
        : 'No items are immediately approaching low stock.';

      const contactMessagesSummary = contactMessages.length > 0
        ? contactMessages.map(m => `${m.name}: "${m.message.substring(0, 50)}..."`).join(' | ')
        : 'No recent contact messages.';

      const jobApplicationsSummary = jobApplications.length > 0
        ? jobApplications.map(a => `${a.name} for ${a.position} (Status: ${a.status}, Date: ${a.date})`).join(', ')
        : 'No recent job applications.';

      const categoryMap = "1: Cold Drinks & Ice Cream, 2: Coffee & Espresso, 3: Food & Pastries, 5: Sweets & Cakes, 6: Tea & Infusions";

      const latestItems = latestItemRes.status === 'fulfilled' ? latestItemRes.value[0] : [];
      const latestItemsSummary = latestItems.length > 0
        ? latestItems.map(i => `[ID:${i.id}] ${i.name} (Cat: ${i.category_name || 'N/A'}, Date: ${i.date})`).join(' | ')
        : 'None';

      const storeMode = storeStatusRes.status === 'fulfilled' && storeStatusRes.value[0].length > 0 ? storeStatusRes.value[0][0].value : 'auto';
      let currentStatus = storeMode;
      if (storeMode === 'auto') currentStatus = getAutoStoreStatus();
      else if (storeMode === 'manual_open') currentStatus = 'open';
      else if (storeMode === 'manual_closed') currentStatus = 'closed';

      businessContext += `
- Store Operational Status: ${currentStatus.toUpperCase()} (Mode: ${storeMode.toUpperCase()}).
- Lifetime: ${orders.total} orders, £${parseFloat(orders.revenue).toFixed(2)} revenue.
- Historical Daily Sales (Last 15 Days): ${dailySalesSummary}.
- Best Sales Day: ${bestDaySummary}.
- Order Types: ${typeSummary || 'N/A'}.
- Top Products: ${topSummary || 'N/A'}.
- Latest Menu Items Added: ${latestItemsSummary}.
- Menu Categories Map: ${categoryMap}.
- Full Menu Catalog: ${fullMenuSummary}.

CRITICAL LIVE DATA:
- Recent Orders (Last 10): ${recentOrdersSummary}.
- Critical Low Stock (Needs immediate reorder): ${lowStockSummary}.
- Approaching Low Stock (Needs attention soon): ${approachingLowSummary}.
- Healthy Inventory (DO NOT list these when asked about low stock): ${healthyInventorySummary}.
- Recent General Customer Feedback: ${feedbackSummary}.
- Recent Specific Product Reviews: ${productReviewSummary}.
- Recent Contact Messages: ${contactMessagesSummary}.
- Active Job Openings: ${careersSummary}.
- Recent Job Applications: ${jobApplicationsSummary}.
- Active Offers/Promotions: ${offersSummary}.

Answer the admin's questions accurately using the provided data. 

### CRITICAL RULES ###
1. DIRECT ANSWER ONLY: Answer the user's question directly and concisely. 
2. NO CONTEXT DUMPING: NEVER repeat the entire menu, sales history, or context provided above unless the user explicitly asks for a "Full Report".
3. REFERENCE ONLY: The data above is for your reference only. Do not recite it.
4. RECENT DATA: When asked about "recent" or "last" items/orders/applications, ALWAYS report the most recent entries provided in the lists above. For menu items, the HIGHER THE ID, THE NEWER THE PRODUCT. Use the ID and Category to provide a precise answer. DO NOT say "No recent data" if there are items in the lists.
5. CUSTOMER DATA: As this is the ADMIN assistant, you ARE PERMITTED to share customer contact details (emails, phone numbers) from orders or messages when asked.
6. INVENTORY: Only report low stock for items in the "Critical" or "Approaching" lists.
7. ARABIC: Format dates as YYYY-MM-DD and currency as £X.XX.
8. BE PROFESSIONAL: You are a business intelligence assistant.
9. NO HALLUCINATIONS: If data is missing, say "Data unavailable".`;
    } catch (dbErr) {
      console.warn('[AI] DB Error:', dbErr.message);
      businessContext += `\n[WARNING: Database fetch failed: ${dbErr.message}]`;
    }
  } else {
    businessContext = `You are Sophie, the friendly Barista Bot for Faculty Coffee. 
Focus on helping customers with the menu, opening hours (Mon-Fri 07:30-17:00, Sat 09:00-18:00, Sun 10:00-16:00), and general info. 
Current UK time: ${currentDateTime}. Use this to tell if the shop is currently open or closed.
Do NOT mention internal sales numbers or revenue to customers.`;
    try {
      const promiseDb = db.promise();
      const [
        menuRes,
        offersRes,
        careersRes
      ] = await Promise.allSettled([
        promiseDb.query(`SELECT mi.name, mi.price_display, mi.description, GROUP_CONCAT(DISTINCT t.name) as tags, GROUP_CONCAT(DISTINCT a.name) as addons FROM menu_items mi LEFT JOIN menu_item_tags mit ON mi.id = mit.menu_item_id LEFT JOIN tags t ON mit.tag_id = t.id LEFT JOIN menu_item_addons mia ON mi.id = mia.menu_item_id LEFT JOIN addons a ON mia.addon_id = a.id WHERE mi.available = 1 GROUP BY mi.id`),
        promiseDb.query(`SELECT product_name, discount_percent, reason FROM offers WHERE active = 1`),
        promiseDb.query(`SELECT title, type, location FROM careers WHERE active = 1`)
      ]);

      const menuItems = menuRes.status === 'fulfilled' ? menuRes.value[0].map(m => `${m.name} (£${m.price_display})`).join(', ') : 'Menu unavailable.';
      const offersSummary = offersRes.status === 'fulfilled' && offersRes.value[0].length > 0 ? offersRes.value[0].map(o => `${o.discount_percent}% off ${o.product_name}`).join(', ') : 'No offers.';
      const careersSummary = careersRes.status === 'fulfilled' && careersRes.value[0].length > 0 ? careersRes.value[0].map(c => `${c.title}`).join(', ') : 'No jobs.';

      businessContext += `\nMenu: ${menuItems.substring(0, 2000)}.\nOffers: ${offersSummary}.\nJobs: ${careersSummary}.`;
    } catch (e) {
      console.warn('[AI] Customer Data Fetch Error:', e.message);
    }
  }

  try {
    if (!openai) {
      throw new Error('OpenAI not initialized');
    }

    const { history } = req.body;
    const aiMessages = [
      { role: 'system', content: `You are the CaffAIne AI. Context: ${businessContext}` }
    ];
    if (history && Array.isArray(history)) {
      aiMessages.push(...history);
    }
    aiMessages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: aiMessages,
      max_tokens: 400
    });

    const replyContent = completion.choices[0]?.message?.content || "I'm a bit stuck! Reach us at hello@facultycoffee.co.uk ☕";
    return res.json({ reply: replyContent });
  } catch (error) {
    console.error('AI Error:', error.message);
    // ALWAYS return a 200 status with a useful reply to prevent UI "Connection Error"
    return res.status(200).json({
      reply: `[System Update] I'm currently processing in Local Mode. Here's your business summary: ${businessContext}. (Note: AI service is temporarily unavailable: ${error.message})`
    });
  }
});

// Admin Audit Logs API
app.get('/api/admin/logs', (req, res) => {
  db.query('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 200', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/admin/log', (req, res) => {
  const { action, details } = req.body;
  if (req.logAdminAction) {
    req.logAdminAction(action, details);
  }
  res.json({ success: true });
});

app.get('/api/test-ai', (req, res) => {
  res.json({ message: 'AI Server is reachable!', openai: !!openai });
});

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all route to serve index.html for React Router
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});



// START SERVER
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CaffAIne Server is LIVE on port: ${PORT}`);
  console.log(`🔗 Local Access: http://127.0.0.1:${PORT}`);
});