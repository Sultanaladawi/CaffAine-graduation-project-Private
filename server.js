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
  limits: { fileSize: 10 * 1024 * 1024 },
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
  console.log(`ًں¤– AI PROVIDER: ${IS_GITHUB ? 'GitHub Models' : 'Standard OpenAI'} Detected`);
  console.log(`ًں”— BASE URL: ${BASE_URL}`);
  console.log('------------------------------------------');
} else {
  console.warn('[WARNING] AI API Key missing or default. AI Assistant in Fallback Mode.');
}

const app = express();

// âœ… Azure uses process.env.PORT; locally falls back to SERVER_PORT to avoid conflict with React client
const PORT = process.env.PORT || process.env.SERVER_PORT || 8080;

// âœ… FIXED: CORS now allows Azure and localhost
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-admin-email', 'x-admin-name']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// âœ… ENFORCE HTTPS (For Azure Production)
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
});

// --- CHROME FIX: case-insensitive image serving ---
// Chrome is stricter than Edge/Brave with URL case. This middleware
// tries the exact path first, then falls back to the lowercase version.
app.use('/images', (req, res, next) => {
  const exactPath = path.resolve(__dirname, 'public/images', req.url.replace(/^\//, ''));
  const lowerPath = path.resolve(__dirname, 'public/images', req.url.replace(/^\//, '').toLowerCase());

  // Set headers that Chrome needs for proper image caching
  res.set({
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    'Access-Control-Allow-Origin': '*',
    'Vary': 'Accept-Encoding',
    'X-Content-Type-Options': 'nosniff'
  });

  if (fs.existsSync(exactPath)) {
    return res.sendFile(exactPath);
  } else if (fs.existsSync(lowerPath)) {
    return res.sendFile(lowerPath);
  } else {
    // Try scanning directory for case-insensitive match
    const filename = req.url.replace(/^\//, '').toLowerCase();
    try {
      const files = fs.readdirSync(imgDir);
      const match = files.find(f => f.toLowerCase() === filename);
      if (match) {
        return res.sendFile(path.join(imgDir, match));
      }
    } catch (e) {}
    next();
  }
});

// --- STATIC FILES SERVING (HARDENED) ---
// Serve static assets from build and public
app.use(express.static(path.resolve(__dirname, 'build')));
app.use(express.static(path.resolve(__dirname, 'public')));

// 3. Specific favicon and manifest routes for stability
app.get('/favicon.ico', (req, res) => res.sendFile(path.resolve(__dirname, 'public/favicon.ico')));
app.get('/favicon.jpg', (req, res) => res.sendFile(path.resolve(__dirname, 'public/favicon.jpg')));
app.get('/manifest.json', (req, res) => res.sendFile(path.resolve(__dirname, 'public/manifest.json')));



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

// Export/Audit Log endpoint for Leader
app.get('/api/admin-logs', (req, res) => {
  db.query('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 200', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/log-action', (req, res) => {
  const { action, details } = req.body;
  if (req.logAdminAction) {
    req.logAdminAction(action, details);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Logging middleware not initialized' });
  }
});

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
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'graduation_project',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
ssl: {
    rejectUnauthorized: false
  }
});

// Force all MySQL connections to use Jordan Time (Asia/Amman = UTC+3)
pool.on('connection', (connection) => {
  connection.query("SET time_zone = 'Asia/Amman'", (err) => {
    if (err) {
      // Fallback in case Azure/MySQL lacks the timezone dictionary
      connection.query("SET time_zone = '+03:00'");
    }
  });
});

const db = pool;

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

  const checkColumns = async () => {
    try {
      const promiseDb = db.promise();
      const [columns] = await promiseDb.query("SHOW COLUMNS FROM orders");
      const columnNames = columns.map(c => c.Field);

      if (!columnNames.includes('phone')) {
        await promiseDb.query("ALTER TABLE orders ADD COLUMN phone VARCHAR(50) DEFAULT NULL");
      }
      if (!columnNames.includes('delivery_address')) {
        await promiseDb.query("ALTER TABLE orders ADD COLUMN delivery_address TEXT DEFAULT NULL");
      }

      try {
        const [zeroItems] = await promiseDb.query("SELECT id, item_name, order_id, quantity FROM order_items WHERE price = 0 OR price IS NULL");
        for (const zi of zeroItems) {
          const [addRes] = await promiseDb.query("SELECT price FROM addons WHERE name = ?", [zi.item_name]);
          if (addRes && addRes.length > 0 && parseFloat(addRes[0].price) > 0) {
            const fixedPrice = parseFloat(addRes[0].price);
            await promiseDb.query("UPDATE order_items SET price = ? WHERE id = ?", [fixedPrice, zi.id]);
            await promiseDb.query("UPDATE orders SET total_amount = total_amount + ? WHERE id = ?", [fixedPrice * zi.quantity, zi.order_id]);
          }
        }
      } catch (e) {
        console.error('[Migration] Addon price fix failed:', e.message);
      }

      // Ensure all legacy and existing price displays are formatted as JOD
      const [migrationResult] = await promiseDb.query(`
        UPDATE menu_items 
        SET price_display = CONCAT('JOD ', FORMAT(price_num, 2)) 
        WHERE price_num IS NOT NULL AND (price_display LIKE '£%' OR price_display NOT LIKE 'JOD %')
      `);
      if (migrationResult.affectedRows > 0) {
        console.log(`[Migration] Updated ${migrationResult.affectedRows} legacy price formats to JOD in menu_items.`);
      }

      console.log('[Migration] Schema verification complete.');
    } catch (dbErr) {
      console.error('[Migration] Schema check failed:', dbErr.message);
    }
  };
  checkColumns();

  if (connection) connection.release();
});

app.post('/api/orders', async (req, res) => {
  console.log('[Server] Body:', JSON.stringify(req.body, null, 2));
  const { customer_name, email, total_amount, cartItems, order_type, delivery_address, phone } = req.body;

  if (!customer_name || !Array.isArray(cartItems) || cartItems.length === 0 || !phone) {
    return res.status(400).json({ error: 'Missing required contact information' });
  }

  const totalAmount = parseFloat(total_amount);
  const promiseDb = db.promise();
  const conn = await promiseDb.getConnection();

  try {
    await conn.beginTransaction();

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

    // --- Smart Prep Time: scale with active orders ---
    const [[activeOrdersRow]] = await conn.query(
      "SELECT COUNT(*) as cnt FROM orders WHERE status IN ('preparing', 'pending')"
    );
    const activeCount = parseInt(activeOrdersRow.cnt) || 0;
    let prepMinutes = 3;
    if (activeCount >= 4 && activeCount <= 7)  prepMinutes = 5;
    else if (activeCount >= 8 && activeCount <= 12) prepMinutes = 8;
    else if (activeCount > 12) prepMinutes = 12;

    const [orderInsertResult] = await conn.query(
      `INSERT INTO orders (customer_name, email, total_amount, status, created_at, estimated_ready_at, order_type, delivery_address, phone) VALUES (?, ?, ?, 'preparing', NOW(), DATE_ADD(NOW(), INTERVAL ${prepMinutes} MINUTE), ?, ?, ?)`,
      [customer_name, email, totalAmount, order_type || 'takeaway', delivery_address || null, phone || null]
    );
    const orderId = orderInsertResult.insertId;

    let calculatedTotal = 0;

    for (const item of cartItems) {
      const productId = parseInt(item.id, 10);
      const quantity = parseFloat(item.qty);
      let price = parseFloat(item.priceNum);

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

      if (!isNaN(productId)) {
        const [recipeSteps] = await conn.query("SELECT inventory_id, quantity_required FROM recipes WHERE menu_item_id = ?", [productId]);
        for (const ingredient of recipeSteps) {
          const deductAmount = parseFloat(ingredient.quantity_required) * quantity;
          await conn.query("UPDATE inventory SET quantity = GREATEST(quantity - ?, 0) WHERE id = ?", [deductAmount, ingredient.inventory_id]);
        }
      }

      if (Array.isArray(item.addons)) {
        for (const addon of item.addons) {
          // Get addon price and inventory link
          const [addonRows] = await conn.query("SELECT price, inventory_id FROM addons WHERE name = ? OR id = ?", [addon.name, addon.id]);
          let addonPrice = 0;
          if (addonRows && addonRows.length > 0) {
            addonPrice = parseFloat(addonRows[0].price) || 0;
            
            // Deduct addon from inventory if linked
            if (addonRows[0].inventory_id) {
              await conn.query("UPDATE inventory SET quantity = GREATEST(quantity - ?, 0) WHERE id = ?", [1 * quantity, addonRows[0].inventory_id]);
            }
          }

          calculatedTotal += addonPrice * quantity;

          // Record addon as an order item for accurate revenue/sales tracking
          await conn.query(
            "INSERT INTO order_items (order_id, product_id, item_name, quantity, price) VALUES (?, ?, ?, ?, ?)",
            [orderId, null, `+ ${addon.name}`, quantity, addonPrice]
          );
        }
      }
    }

    if (calculatedTotal > totalAmount) {
      await conn.query("UPDATE orders SET total_amount = ? WHERE id = ?", [calculatedTotal, orderId]);
    }

    await conn.commit();
    res.status(201).json({ success: true, orderId });

  } catch (err) {
    console.error('[Server] CRITICAL Order Error:', err.message);
    await conn.rollback();
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  } finally {
    conn.release();
  }
});

const getAutoStoreStatus = () => {
  // Use Jordan Time (Asia/Amman = UTC+3) for auto-calculation
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Amman' }));
  const day = now.getDay();
  const currentTime = now.getHours() * 100 + now.getMinutes();

  if (day >= 1 && day <= 5) {
    return (currentTime >= 730 && currentTime < 1700) ? 'open' : 'closed';
  }
  if (day === 6) {
    return (currentTime >= 900 && currentTime < 1800) ? 'open' : 'closed';
  }
  if (day === 0) {
    return (currentTime >= 1000 && currentTime < 1600) ? 'open' : 'closed';
  }
  return 'closed';
};

app.get('/api/store-status', (req, res) => {
  db.query('SELECT value FROM site_settings WHERE `key` = ? LIMIT 1', ['store_status'], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    let mode = results.length > 0 ? results[0].value : 'auto';
    let currentState = mode;
    if (mode === 'auto') currentState = getAutoStoreStatus();
    else if (mode === 'manual_open') currentState = 'open';
    else if (mode === 'manual_closed') currentState = 'closed';
    res.json({ mode, status: currentState, display: mode === 'auto' ? `Automatic (${currentState.toUpperCase()})` : mode.replace('_', ' ').toUpperCase() });
  });
});

app.post('/api/store-status', (req, res) => {
  const { status } = req.body;
  // Use a two-step process to be 100% sure on all MySQL versions
  db.query('DELETE FROM site_settings WHERE `key` = ?', ['store_status'], (err) => {
    if (err) console.error('Delete old status error:', err);
    db.query('INSERT INTO site_settings (`key`, `value`) VALUES (?, ?)', ['store_status', status], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, mode: status });
    });
  });
});

db.query(`CREATE TABLE IF NOT EXISTS contact_messages (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, message TEXT NOT NULL, status VARCHAR(50) DEFAULT 'new', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure contact_messages table error:', err); });
db.query(`CREATE TABLE IF NOT EXISTS job_applications (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(60) DEFAULT NULL, position VARCHAR(255) DEFAULT NULL, cover_letter TEXT DEFAULT NULL, resume_url VARCHAR(1024) DEFAULT NULL, status VARCHAR(50) DEFAULT 'new', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure job_applications table error:', err); });
db.query(`CREATE TABLE IF NOT EXISTS careers (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, type VARCHAR(100) DEFAULT 'Full-time', location VARCHAR(255) DEFAULT 'As-Salt', description TEXT, active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure careers table error:', err); });
db.query(`CREATE TABLE IF NOT EXISTS site_settings (\`key\` VARCHAR(255) PRIMARY KEY, \`value\` TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure site_settings table error:', err); });
db.query(`CREATE TABLE IF NOT EXISTS offers (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, discount_percent DECIMAL(5,2), active TINYINT(1) DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure offers table error:', err); });
db.query(`CREATE TABLE IF NOT EXISTS chat_messages (id INT AUTO_INCREMENT PRIMARY KEY, user_msg TEXT, ai_msg TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure chat_messages table error:', err); });
db.query(`CREATE TABLE IF NOT EXISTS ai_assistant_messages (id INT AUTO_INCREMENT PRIMARY KEY, admin_query TEXT, ai_response TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure ai_assistant_messages table error:', err); });

let categoryNameColumn = 'name';

db.query("SELECT * FROM categories", (err, categories) => {
  if (err) return console.error('Category Check Error:', err);

  if (categories.length === 0) {
    db.query("INSERT INTO categories (name) VALUES ('Coffee'), ('Drinks'), ('Food'), ('Sweets')", (iErr) => {
      if (!iErr) console.log('[Data Integrity] Initialized default categories.');
    });
  } else {
    const firstRow = categories[0];
    categoryNameColumn = Object.keys(firstRow).find(key =>
      ['name', 'label', 'title', 'category_name', 'name_ar'].includes(key.toLowerCase())
    ) || Object.keys(firstRow)[1];

    console.log(`[Data Integrity] Detected Category Name Column: '${categoryNameColumn}'`);

    const catMap = {
      'espresso': categories.find(c => String(c[categoryNameColumn] || '').toLowerCase().includes('coffee'))?.id,
      'tea': categories.find(c => String(c[categoryNameColumn] || '').toLowerCase().includes('tea'))?.id,
      'cold': categories.find(c => String(c[categoryNameColumn] || '').toLowerCase().includes('cold'))?.id,
      'food': categories.find(c => String(c[categoryNameColumn] || '').toLowerCase().includes('food'))?.id,
      'sweets': categories.find(c => String(c[categoryNameColumn] || '').toLowerCase().includes('sweet'))?.id,
      'soft': categories.find(c => String(c[categoryNameColumn] || '').toLowerCase().includes('soft'))?.id
    };

    Object.keys(catMap).forEach(oldKey => {
      const newId = catMap[oldKey];
      if (newId && newId != oldKey) {
        db.query("UPDATE menu_items SET category_id = ? WHERE category_id = ?", [newId, oldKey]);
      }
    });

    db.query("UPDATE menu_items SET category_id = ? WHERE category_id IS NULL OR category_id = ''", [categories[0].id]);
  }
});

db.query("SHOW COLUMNS FROM menu_items LIKE 'image_url'", (err, results) => {
  if (!err && results.length === 0) db.query("ALTER TABLE menu_items ADD COLUMN image_url VARCHAR(1024) DEFAULT NULL");
});
db.query("SHOW COLUMNS FROM menu_items LIKE 'created_at'", (err, results) => {
  if (!err && results.length === 0) db.query("ALTER TABLE menu_items ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
});
db.query(`CREATE TABLE IF NOT EXISTS product_reviews (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, reviewer_name VARCHAR(255) DEFAULT NULL, comment TEXT DEFAULT NULL, rating TINYINT(1) DEFAULT 5, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES menu_items(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure product_reviews table error:', err); });
db.query(`CREATE TABLE IF NOT EXISTS general_feedback (id INT AUTO_INCREMENT PRIMARY KEY, reviewer_name VARCHAR(255) DEFAULT 'Anonymous', comment TEXT DEFAULT NULL, rating TINYINT(1) DEFAULT 5, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure general_feedback table error:', err); });
db.query(`CREATE TABLE IF NOT EXISTS store_reviews (id INT AUTO_INCREMENT PRIMARY KEY, reviewer_name VARCHAR(255) DEFAULT 'Anonymous', comment TEXT DEFAULT NULL, rating TINYINT(1) DEFAULT 5, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure store_reviews table error:', err); });
    // Enhanced migration check for Azure MySQL compatibility
    db.query("SHOW COLUMNS FROM orders LIKE 'estimated_ready_at'", (err, results) => {
      if (!err && results.length === 0) {
        db.query("ALTER TABLE orders ADD COLUMN estimated_ready_at DATETIME DEFAULT NULL", (err) => {
          if (!err) console.log("[Migration] Added estimated_ready_at to orders");
        });
      }
    });

    db.query("SHOW COLUMNS FROM orders LIKE 'delivery_address'", (err, results) => {
      if (!err && results.length === 0) {
        db.query("ALTER TABLE orders ADD COLUMN delivery_address TEXT DEFAULT NULL", (err) => {
          if (!err) console.log("[Migration] Added delivery_address to orders");
        });
      }
    });

    db.query("SHOW COLUMNS FROM orders LIKE 'phone'", (err, results) => {
      if (!err && results.length === 0) {
        db.query("ALTER TABLE orders ADD COLUMN phone VARCHAR(50) DEFAULT NULL", (err) => {
          if (!err) console.log("[Migration] Added phone to orders");
        });
      }
    });
db.query(`CREATE TABLE IF NOT EXISTS ai_insights_cache (id INT AUTO_INCREMENT PRIMARY KEY, topic VARCHAR(100) UNIQUE, content TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure ai_insights_cache table error:', err); });
db.query(`CREATE TABLE IF NOT EXISTS admin_logs (id INT AUTO_INCREMENT PRIMARY KEY, admin_email VARCHAR(255) NOT NULL, admin_name VARCHAR(255) DEFAULT NULL, action VARCHAR(255) NOT NULL, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure admin_logs table error:', err); });
db.query(`CREATE TABLE IF NOT EXISTS ai_assistant_logs (id INT AUTO_INCREMENT PRIMARY KEY, admin_query TEXT, ai_response TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`, (err) => { if (err) console.error('Ensure ai_assistant_logs table error:', err); });
db.query("UPDATE addons SET price = 0.50 WHERE price = 0", (err) => { if (err) console.error('Update addon prices error:', err); });

db.query("SHOW COLUMNS FROM categories", (err, columns) => {
  if (!err) {
    const names = columns.map(c => c.Field);
    categoryNameColumn = names.includes('label') ? 'label' : 'name';
    console.log(`[Data Integrity] Using Category Name Column: '${categoryNameColumn}'`);
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields required' });
  db.query('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)', [name, email, message], (err, result) => {
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

app.get('/api/feedback', async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [generalFeedback] = await promiseDb.query('SELECT * FROM general_feedback ORDER BY created_at DESC');
    const [storeReviews] = await promiseDb.query('SELECT * FROM store_reviews ORDER BY created_at DESC');
    const [productReviews] = await promiseDb.query(`SELECT pr.*, m.name as product_name FROM product_reviews pr JOIN menu_items m ON pr.product_id = m.id ORDER BY pr.created_at DESC`);
    res.status(200).json({ general: generalFeedback, store: storeReviews, products: productReviews });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/feedback/general', (req, res) => {
  const { reviewer_name, comment, rating } = req.body;
  db.query('INSERT INTO general_feedback (reviewer_name, comment, rating) VALUES (?, ?, ?)', [reviewer_name || 'Anonymous', comment, rating || 5], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Feedback submitted successfully', id: result.insertId });
  });
});

app.post('/api/feedback/product', (req, res) => {
  const { product_id, reviewer_name, comment, rating } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Product ID is required' });
  db.query('INSERT INTO product_reviews (product_id, reviewer_name, comment, rating) VALUES (?, ?, ?, ?)', [product_id, reviewer_name || 'Anonymous', comment, rating || 5], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Review submitted successfully', id: result.insertId });
  });
});

app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [[products]] = await promiseDb.query("SELECT COUNT(*) as count FROM menu_items");
    const [[orders]] = await promiseDb.query("SELECT COUNT(*) as count FROM orders");
    const [[sales]] = await promiseDb.query("SELECT COALESCE(SUM(total_amount),0) as total FROM orders");
    const [lowStockItems] = await promiseDb.query("SELECT item_name, quantity, min_threshold FROM inventory WHERE quantity <= min_threshold");
    const [dailySales] = await promiseDb.query(`SELECT DATE(created_at) as date, SUM(total_amount) as total FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC`);
    const [categoryStats] = await promiseDb.query(`SELECT COALESCE(c.${categoryNameColumn}, 'Other') as name, COUNT(oi.id) as count FROM order_items oi JOIN menu_items mi ON oi.product_id = mi.id LEFT JOIN categories c ON mi.category_id = c.id GROUP BY COALESCE(c.${categoryNameColumn}, 'Other')`);
    const [[todayStats]] = await promiseDb.query("SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE DATE(created_at) = CURDATE()");
    const [[yesterdayStats]] = await promiseDb.query("SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)");
    const [[statusSetting]] = await promiseDb.query("SELECT value FROM site_settings WHERE `key` = 'store_status'");
    const mode = statusSetting ? statusSetting.value : 'auto';
    let currentState = mode;
    if (mode === 'auto') currentState = getAutoStoreStatus();
    else if (mode === 'manual_open') currentState = 'open';
    else if (mode === 'manual_closed') currentState = 'closed';

    const [topProducts] = await promiseDb.query(`
      SELECT mi.name as item_name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as revenue 
      FROM order_items oi 
      JOIN menu_items mi ON oi.product_id = mi.id 
      GROUP BY oi.product_id 
      ORDER BY total_sold DESC 
      LIMIT 6
    `);

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
      lowStockItems, 
      dailySales, 
      categoryStats,
      topProducts: topProducts || []
    });
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// â”€â”€ Monthly Analytics API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics-monthly?year=2026&month=5
app.get('/api/analytics-monthly', async (req, res) => {
  try {
    const promiseDb = db.promise();
    const year  = parseInt(req.query.year)  || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

    // Total revenue & orders for the month
    const [[monthStats]] = await promiseDb.query(
      `SELECT COUNT(*) as totalOrders, COALESCE(SUM(total_amount),0) as totalSales
       FROM orders WHERE YEAR(created_at)=? AND MONTH(created_at)=?`,
      [year, month]
    );

    // Active products count (unchanged, always current)
    const [[products]] = await promiseDb.query(`SELECT COUNT(*) as count FROM menu_items`);

    // Top products this month (name, units sold, revenue)
    const [topProducts] = await promiseDb.query(
      `SELECT mi.name as item_name,
              SUM(oi.quantity) as total_sold,
              SUM(oi.quantity * oi.price) as revenue
       FROM order_items oi
       JOIN menu_items mi ON oi.product_id = mi.id
       JOIN orders o ON oi.order_id = o.id
       WHERE YEAR(o.created_at)=? AND MONTH(o.created_at)=?
       GROUP BY oi.product_id
       ORDER BY total_sold DESC
       LIMIT 6`,
      [year, month]
    );

    // Daily sales within that month (for the bar chart)
    const [dailySales] = await promiseDb.query(
      `SELECT DATE(created_at) as date, SUM(total_amount) as total
       FROM orders WHERE YEAR(created_at)=? AND MONTH(created_at)=?
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [year, month]
    );

    // Category stats for that month
    const [categoryStats] = await promiseDb.query(
      `SELECT COALESCE(c.${categoryNameColumn}, 'Other') as name, COUNT(oi.id) as count 
       FROM order_items oi 
       JOIN menu_items mi ON oi.product_id = mi.id 
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN categories c ON mi.category_id = c.id 
       WHERE YEAR(o.created_at)=? AND MONTH(o.created_at)=?
       GROUP BY COALESCE(c.${categoryNameColumn}, 'Other')`,
      [year, month]
    );

    const totalOrders = monthStats.totalOrders || 0;
    const totalSales  = parseFloat(monthStats.totalSales) || 0;

    res.json({
      totalOrders,
      totalSales,
      totalProducts: products.count,
      avgOrderValue: totalOrders > 0 ? (totalSales / totalOrders) : 0,
      topProducts: topProducts || [],
      dailySales: dailySales || [],
      categoryStats: categoryStats || []
    });
  } catch (err) {
    console.error('[Monthly Analytics Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// â”€â”€ Date-Range Analytics API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics-range?from=2026-01-01&to=2026-05-15
app.get('/api/analytics-range', async (req, res) => {
  try {
    const promiseDb = db.promise();
    const from = req.query.from || '2000-01-01';
    const to   = req.query.to   || new Date().toISOString().split('T')[0];

    const [[rangeStats]] = await promiseDb.query(
      `SELECT COUNT(*) as totalOrders, COALESCE(SUM(total_amount),0) as totalSales
       FROM orders WHERE DATE(created_at) BETWEEN ? AND ?`,
      [from, to]
    );

    const [dailySales] = await promiseDb.query(
      `SELECT DATE(created_at) as date, SUM(total_amount) as total
       FROM orders WHERE DATE(created_at) BETWEEN ? AND ?
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [from, to]
    );

    const [topProducts] = await promiseDb.query(
      `SELECT mi.name as item_name,
              SUM(oi.quantity) as total_sold,
              SUM(oi.quantity * oi.price) as revenue
       FROM order_items oi
       JOIN menu_items mi ON oi.product_id = mi.id
       JOIN orders o ON oi.order_id = o.id
       WHERE DATE(o.created_at) BETWEEN ? AND ?
       GROUP BY oi.product_id
       ORDER BY total_sold DESC
       LIMIT 6`,
      [from, to]
    );

    // Category stats for that range
    const [categoryStats] = await promiseDb.query(
      `SELECT COALESCE(c.${categoryNameColumn}, 'Other') as name, COUNT(oi.id) as count 
       FROM order_items oi 
       JOIN menu_items mi ON oi.product_id = mi.id 
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN categories c ON mi.category_id = c.id 
       WHERE DATE(o.created_at) BETWEEN ? AND ?
       GROUP BY COALESCE(c.${categoryNameColumn}, 'Other')`,
      [from, to]
    );

    const totalOrders = rangeStats.totalOrders || 0;
    const totalSales  = parseFloat(rangeStats.totalSales) || 0;

    res.json({
      totalOrders,
      totalSales,
      avgOrderValue: totalOrders > 0 ? (totalSales / totalOrders) : 0,
      topProducts: topProducts || [],
      dailySales: dailySales || [],
      categoryStats: categoryStats || []
    });
  } catch (err) {
    console.error('[Range Analytics Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/offers', (req, res) => {
  db.query('SELECT * FROM offers ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/offers', (req, res) => {
  const { product_name, discount_percent, reason, end_date, active } = req.body;
  db.query('INSERT INTO offers (product_name, discount_percent, reason, end_date, active) VALUES (?, ?, ?, ?, ?)', [product_name, discount_percent, reason, end_date || null, active ?? 1], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (req.logAdminAction) req.logAdminAction('Add Offer', `Added offer for ${product_name}`);
    res.json({ message: 'Offer created', id: result.insertId });
  });
});

app.put('/api/offers/:id', (req, res) => {
  const { id } = req.params;
  const { product_name, discount_percent, reason, end_date, active } = req.body;
  db.query('UPDATE offers SET product_name = ?, discount_percent = ?, reason = ?, end_date = ?, active = ? WHERE id = ?', [product_name, discount_percent, reason, end_date || null, active ?? 1, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (req.logAdminAction) req.logAdminAction('Edit Offer', `Updated offer for ${product_name}`);
    res.json({ message: 'Offer updated' });
  });
});

app.delete('/api/offers/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM offers WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (req.logAdminAction) req.logAdminAction('Delete Offer', `Deleted offer ID: ${id}`);
    res.json({ message: 'Offer deleted' });
  });
});

app.get('/api/categories', (req, res) => {
  db.query('SELECT * FROM categories', (err, results) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
    res.json(results);
  });
});

app.get('/api/addons', (req, res) => {
  db.query('SELECT * FROM addons ORDER BY name ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/addons', async (req, res) => {
  const { name, price, inventory_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const promiseDb = db.promise();
  try {
    const [existing] = await promiseDb.query('SELECT * FROM addons WHERE name = ?', [name]);
    if (existing.length > 0) return res.json(existing[0]);
    const [result] = await promiseDb.query('INSERT INTO addons (name, price, inventory_id) VALUES (?, ?, ?)', [name, price || 0, inventory_id || null]);
    res.status(201).json({ id: result.insertId, name, price, inventory_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/addons/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, inventory_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    await db.promise().query('UPDATE addons SET name = ?, price = ?, inventory_id = ? WHERE id = ?', [name.trim(), price || 0, inventory_id || null, id]);
    res.json({ success: true, id, name: name.trim(), price, inventory_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/addons/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query('DELETE FROM menu_item_addons WHERE addon_id = ?', [id]);
    await db.promise().query('DELETE FROM addons WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tags', (req, res) => {
  db.query('SELECT * FROM tags ORDER BY name ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/tags', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const [existing] = await db.promise().query('SELECT * FROM tags WHERE name = ?', [name]);
    if (existing.length > 0) return res.json(existing[0]);
    const [result] = await db.promise().query('INSERT INTO tags (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tags/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    await db.promise().query('UPDATE tags SET name = ? WHERE id = ?', [name.trim(), id]);
    res.json({ success: true, id, name: name.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tags/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query('DELETE FROM menu_item_tags WHERE tag_id = ?', [id]);
    await db.promise().query('DELETE FROM tags WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', (req, res) => {
  db.query("SELECT * FROM orders ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
    res.status(200).json(results);
  });
});

app.get('/api/orders/:id', (req, res) => {
  db.query("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(results[0]);
  });
});

app.get('/api/order-status/:id', (req, res) => {
  const sql = `SELECT status, estimated_ready_at, GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), estimated_ready_at)) AS seconds_left FROM orders WHERE id = ?`;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ status: results[0].status, seconds_left: results[0].seconds_left || 0 });
  });
});

app.put('/api/extend-order/:id', (req, res) => {
  const { id } = req.params;
  const { minutes } = req.body;
  if (!minutes) return res.status(400).json({ error: 'Minutes required' });
  const cleanMins = parseInt(minutes) || 2;
  const query = `UPDATE orders SET estimated_ready_at = DATE_ADD(GREATEST(COALESCE(estimated_ready_at, NOW()), NOW()), INTERVAL ${cleanMins} MINUTE), status = 'preparing' WHERE id = ?`;
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (req.logAdminAction) req.logAdminAction('Extend Order Time', `Extended order #${id} by ${cleanMins} mins`);
    res.json({ success: true, message: `Preparation time extended by ${cleanMins} minutes` });
  });
});

app.put('/api/mark-ready/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status required' });
  db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (req.logAdminAction) req.logAdminAction('Update Order Status', `Marked order #${id} as ${status}`);
    res.json({ success: true, message: `Order status updated to ${status}` });
    if (status === 'ready') {
      db.query("SELECT customer_name, email, phone FROM orders WHERE id = ?", [id], (err, rows) => {
        if (!err && rows.length > 0) {
          const order = rows[0];
          if (order.phone) console.log(`ًں“± SMS to ${order.phone}: "Hello ${order.customer_name}, your order is ready!"`);
          if (order.email) console.log(`ًں“§ Email to ${order.email}: "Order Ready!"`);
        }
      });
    }
  });
});

app.get('/api/order-items/:orderId', async (req, res) => {
  try {
    const [results] = await db.promise().query("SELECT oi.*, COALESCE(oi.item_name, m.name) as item_name FROM order_items oi LEFT JOIN menu_items m ON oi.product_id = m.id WHERE oi.order_id = ?", [req.params.orderId]);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const promiseDb = db.promise();
    const [offers] = await promiseDb.query("SELECT * FROM offers WHERE active = 1 AND (end_date IS NULL OR end_date >= CURDATE())");
    const [allAddons] = await promiseDb.query('SELECT name, price FROM addons');
    const addonPriceMap = {};
    allAddons.forEach(a => { addonPriceMap[a.name.toLowerCase().trim()] = parseFloat(a.price); });

    const [results] = await promiseDb.query(`
      SELECT m.*, 
        CASE WHEN m.available = 0 THEN 1 WHEN EXISTS (SELECT 1 FROM recipes r JOIN inventory i ON r.inventory_id = i.id WHERE r.menu_item_id = m.id AND i.quantity < r.quantity_required) THEN 1 ELSE 0 END as isOutOfStock,
        (SELECT GROUP_CONCAT(DISTINCT CONCAT(a.id, '|', a.name, '|', a.price)) FROM menu_item_addons mia JOIN addons a ON mia.addon_id = a.id WHERE mia.menu_item_id = m.id) as linked_addons,
        (SELECT GROUP_CONCAT(DISTINCT CONCAT(t.id, '|', t.name)) FROM menu_item_tags mit JOIN tags t ON mit.tag_id = t.id WHERE mit.menu_item_id = m.id) as linked_tags
      FROM menu_items m
    `);

    const products = results.map(p => {
      const matchingOffer = offers.find(o => {
        const prodName = (p.name || '').toLowerCase();
        const offerProd = (o.product_name || '').toLowerCase();
        return prodName.includes(offerProd) || offerProd.includes(prodName) || offerProd === 'all';
      });
      let discountedPrice = null;
      if (matchingOffer && p.price_num) discountedPrice = parseFloat(p.price_num) * (1 - (matchingOffer.discount_percent / 100));

      let addonsArray = p.linked_addons ? p.linked_addons.split(',').map(pair => { const [id, name, price] = pair.split('|'); return { id, name, price: parseFloat(price) }; }) : [];
      if (addonsArray.length === 0 && p.addons) {
        addonsArray = p.addons.split(',').map((name, idx) => { const cleanName = name.trim(); return { id: `legacy-${idx}-${cleanName.replace(/\s+/g, '-')}`, name: cleanName, price: addonPriceMap[cleanName.toLowerCase()] || 0.50 }; });
      }
      const tagsArray = p.linked_tags ? p.linked_tags.split(',').map(pair => { const [id, name] = pair.split('|'); return { id, name }; }) : [];
      return { ...p, isOutOfStock: !!p.isOutOfStock, linkedAddons: addonsArray, linkedTags: tagsArray, discounted_price: discountedPrice };
    });

    res.status(200).json(products);
  } catch (err) {
    console.error('Products Fetch Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/inventory', (req, res) => {
  db.query("SELECT * FROM inventory", (err, results) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
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
    db.query('INSERT INTO admin_logs (admin_email, admin_name, action, details) VALUES (?, ?, ?, ?)', [user.email, user.name, 'Login', 'Logged into the system'], () => { });
    res.json({ success: true, user: { id: user.email, email: user.email, name: user.name, role: user.role } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/inventory', (req, res) => {
  try {
    let { item_name, quantity, unit, min_threshold } = req.body;
    const cleanQty = parseFloat(convertNumerals(quantity).replace(/[^0-9.]/g, '')) || 0;
    const cleanThreshold = parseInt(convertNumerals(min_threshold).replace(/[^0-9.]/g, '')) || 0;
    db.query("INSERT INTO inventory (item_name, quantity, unit, min_threshold) VALUES (?, ?, ?, ?)", [item_name, cleanQty, unit, cleanThreshold], (err, result) => {
      if (err) return res.status(500).json({ error: `SQL Error: ${err.message}` });
      if (req.logAdminAction) req.logAdminAction('Add Inventory Item', `Added item: ${item_name}`);
      res.status(201).json({ id: result.insertId, item_name, quantity: cleanQty, unit, min_threshold: cleanThreshold });
    });
  } catch (error) {
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
});

app.put('/api/update-stock-item/:id', (req, res) => {
  try {
    const { id } = req.params;
    let { item_name, quantity, unit, min_threshold } = req.body;
    const cleanQty = parseFloat(convertNumerals(quantity).replace(/[^0-9.]/g, '')) || 0;
    const cleanThreshold = parseInt(convertNumerals(min_threshold).replace(/[^0-9.]/g, '')) || 0;
    db.query("UPDATE inventory SET item_name = ?, quantity = ?, unit = ?, min_threshold = ? WHERE id = ?", [item_name, cleanQty, unit, cleanThreshold, id], (err) => {
      if (err) return res.status(500).json({ error: `SQL Error: ${err.message}` });
      if (req.logAdminAction) req.logAdminAction('Update Stock', `Updated ${item_name} to ${cleanQty} ${unit}`);
      res.json({ message: 'Item updated' });
    });
  } catch (error) {
    res.status(500).json({ error: `Server Error: ${error.message}` });
  }
});

app.delete('/api/inventory/:id', (req, res) => {
  db.query("DELETE FROM inventory WHERE id = ?", [req.params.id], (err) => {
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
  db.query('DELETE FROM careers WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Job deleted' });
  });
});

app.get('/api/products/:id/recipe', async (req, res) => {
  try {
    const [results] = await db.promise().query(`SELECT r.*, i.item_name, i.unit FROM recipes r JOIN inventory i ON r.inventory_id = i.id WHERE r.menu_item_id = ?`, [req.params.id]);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products/:id/recipe', async (req, res) => {
  const { id } = req.params;
  const { ingredients } = req.body;
  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM recipes WHERE menu_item_id = ?', [id]);
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
    if (!openai) return res.json({ answer: "[Local Mode] AI Assistant is currently unavailable." });
    const now = new Date();
    const currentDateTime = now.toLocaleString('en-GB', { timeZone: 'Asia/Amman' });
    let context = `You are Sophie, the friendly Barista Bot for CaffAIne. Focus on helping customers with the menu, opening hours (Mon-Fri 07:30-17:00, Sat 09:00-18:00, Sun 10:00-16:00). Current time: ${currentDateTime}.`;
    const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: context }, { role: 'user', content: prompt }], max_tokens: 500 });
    res.json({ answer: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'AI service failure' });
  }
});

app.post('/api/ai-assistant-logs', (req, res) => {
  const { admin_query, ai_response } = req.body;
  db.query("INSERT INTO ai_assistant_messages (admin_query, ai_response) VALUES (?, ?)", [admin_query, ai_response], (err, result) => {
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

app.get('/api/contact-messages', (req, res) => {
  db.query("SELECT * FROM contact_messages ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
    res.json(results);
  });
});

app.post('/api/apply', (req, res) => {
  const { name, email, phone, position, cover_letter, resume_url } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Missing name or email' });
  db.query(`INSERT INTO job_applications (name, email, phone, position, cover_letter, resume_url) VALUES (?, ?, ?, ?, ?, ?)`, [name, email, phone || null, position || null, cover_letter || null, resume_url || null], (err, result) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
    res.status(201).json({ message: 'Application received' });
  });
});

app.get('/api/applications', (req, res) => {
  db.query('SELECT * FROM job_applications ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/applications', (req, res) => {
  const { name, email, phone, position, cover_letter, resume_url } = req.body;
  db.query('INSERT INTO job_applications (name, email, phone, position, cover_letter, resume_url) VALUES (?, ?, ?, ?, ?, ?)', [name, email, phone, position, cover_letter, resume_url], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Application submitted successfully', id: result.insertId });
  });
});

app.put('/api/applications/:id/status', (req, res) => {
  const { status } = req.body;
  db.query('UPDATE job_applications SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Status updated' });
  });
});

app.delete('/api/applications/:id', (req, res) => {
  db.query('DELETE FROM job_applications WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Application deleted' });
  });
});

app.get('/api/messages', (req, res) => {
  db.query('SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 100', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/messages', (req, res) => {
  const { user_msg, ai_msg } = req.body;
  if (!user_msg) return res.status(400).json({ error: 'user_msg is required' });
  db.query('INSERT INTO chat_messages (user_msg, ai_msg) VALUES (?, ?)', [user_msg, ai_msg || ''], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ success: true, id: result.insertId });
  });
});

app.get('/api/reviews', (req, res) => {
  const { product_id } = req.query;
  let q = 'SELECT * FROM product_reviews';
  const params = [];
  if (product_id) { q += ' WHERE product_id = ?'; params.push(product_id); }
  q += ' ORDER BY created_at DESC';
  db.query(q, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
    res.json(results);
  });
});

app.post('/api/reviews', (req, res) => {
  const { product_id, reviewer_name, comment, rating } = req.body;
  if (!product_id || typeof rating === 'undefined') return res.status(400).json({ error: 'Missing fields' });
  db.query('INSERT INTO product_reviews (product_id, reviewer_name, comment, rating) VALUES (?, ?, ?, ?)', [product_id, reviewer_name || null, comment || null, rating], (err) => {
    if (err) return res.status(500).json({ error: 'Internal Server Error' });
    res.status(201).json({ message: 'Review saved' });
  });
});

app.get('/api/images', (req, res) => {
  fs.readdir(imgDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Cannot read images folder' });
    res.json(files.filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f)));
  });
});

app.put('/api/products/reorder', async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid payload' });
  try {
    for (const item of order) {
      if (!item.id) continue;
      await db.promise().query('UPDATE menu_items SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
    res.json({ message: 'Order saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  let { name, price_num, description, available, category_id, image_url, tags, addons, addon_ids, tag_ids } = req.body;
  if (category_id === 'espresso') category_id = '2';
  if (category_id === 'tea') category_id = '6';
  if (category_id === 'cold') category_id = '1';
  if (category_id === 'food') category_id = '3';
  if (category_id === 'sweets') category_id = '5';
  if (category_id === 'soft') category_id = '4';
  if (!name) return res.status(400).json({ error: 'Missing name' });

  let conn;
  try {
    conn = await db.promise().getConnection();
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT MAX(sort_order) as maxOrder FROM menu_items');
    const nextOrder = (rows[0].maxOrder || 0) + 1;
    const rawPrice = price_num ? convertNumerals(price_num.toString()).replace(/[^0-9.]/g, '') : null;
    const cleanPrice = (rawPrice && rawPrice.trim() !== '') ? rawPrice : null;
    const price_display = cleanPrice ? `JOD ${parseFloat(cleanPrice).toFixed(2)}` : null;
    const [result] = await conn.query('INSERT INTO menu_items (category_id, name, price_num, price_display, description, tags, available, image_url, addons, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [category_id || null, name, cleanPrice, price_display, description || null, tags || null, available ?? 1, image_url || null, addons || null, nextOrder]);
    const productId = result.insertId;
    if (Array.isArray(addon_ids)) for (const aid of addon_ids) if (aid) await conn.query('INSERT IGNORE INTO menu_item_addons (menu_item_id, addon_id) VALUES (?, ?)', [productId, aid]);
    if (Array.isArray(tag_ids)) for (const tid of tag_ids) if (tid) await conn.query('INSERT IGNORE INTO menu_item_tags (menu_item_id, tag_id) VALUES (?, ?)', [productId, tid]);
    await conn.commit();
    if (req.logAdminAction) req.logAdminAction('Add Product', `Added new product: ${name}`);
    res.status(201).json({ message: 'Product created successfully', id: productId });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.sqlMessage || err.message || 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  let { name, price_num, description, available, category_id, image_url, tags, addons, addon_ids, tag_ids } = req.body;
  let conn;
  try {
    conn = await db.promise().getConnection();
    await conn.beginTransaction();
    let cleanPrice = null;
    if (price_num !== undefined && price_num !== null) cleanPrice = convertNumerals(price_num.toString()).replace(/[^0-9.]/g, '');
    const price_display = cleanPrice ? `JOD ${parseFloat(cleanPrice).toFixed(2)}` : null;
    await conn.query("UPDATE menu_items SET name = ?, price_num = ?, price_display = ?, description = ?, available = ?, category_id = ?, image_url = ?, tags = ?, addons = ? WHERE id = ?", [name, cleanPrice, price_display, description, available, category_id || null, image_url || null, tags || null, addons || null, id]);
    if (Array.isArray(addon_ids)) {
      await conn.query('DELETE FROM menu_item_addons WHERE menu_item_id = ?', [id]);
      for (const aid of addon_ids) if (aid) await conn.query('INSERT INTO menu_item_addons (menu_item_id, addon_id) VALUES (?, ?)', [id, aid]);
    }
    if (Array.isArray(tag_ids)) {
      await conn.query('DELETE FROM menu_item_tags WHERE menu_item_id = ?', [id]);
      for (const tid of tag_ids) if (tid) await conn.query('INSERT INTO menu_item_tags (menu_item_id, tag_id) VALUES (?, ?)', [id, tid]);
    }
    await conn.commit();
    if (req.logAdminAction) req.logAdminAction('Edit Product', `Updated product: ${name}`);
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.sqlMessage || err.message || 'Internal Server Error' });
  } finally {
    if (conn) conn.release();
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.promise().query("DELETE FROM recipes WHERE menu_item_id = ?", [req.params.id]);
    await db.promise().query("DELETE FROM menu_items WHERE id = ?", [req.params.id]);
    if (req.logAdminAction) req.logAdminAction('Delete Product', `Deleted product ID: ${req.params.id}`);
    res.json({ message: 'Product and associated recipes deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(400).json({ error: 'Cannot delete this product because it has associated sales orders.' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai-chat', async (req, res) => {
  const { message, isAdmin, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const now = new Date();
  const currentDateTime = now.toLocaleString('en-GB', { timeZone: 'Asia/Amman' });
  let businessContext = isAdmin
    ? `You are the CaffAIne Internal Business Intelligence AI. Current Jordan time is ${currentDateTime}.`
    : `You are Sophie, the friendly Barista Bot for CaffAIne. Opening hours: Mon-Fri 07:30-17:00, Sat 09:00-18:00, Sun 10:00-16:00. Current time: ${currentDateTime}.`;

  try {
    const promiseDb = db.promise();
    // Force boolean conversion to handle any type mismatches
    const isActuallyAdmin = String(isAdmin) === 'true';
    
    if (isActuallyAdmin) {
      console.log(`[AI] Processing Admin Query with full business context. (UK Time: ${currentDateTime})`);
      try {
        const promiseDb = db.promise();
        const results = await Promise.allSettled([
          /* 0 */ promiseDb.query(`SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount),0) as total_revenue FROM orders`),
          /* 1 */ promiseDb.query(`SELECT COUNT(*) as today_orders, COALESCE(SUM(total_amount),0) as today_revenue FROM orders WHERE DATE(created_at) = CURDATE()`),
          /* 2 */ promiseDb.query(`SELECT COUNT(*) as yesterday_orders, COALESCE(SUM(total_amount),0) as yesterday_revenue FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`),
          /* 3 */ promiseDb.query(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`),
          /* 4 */ promiseDb.query(`SELECT mi.name, COUNT(oi.id) as sold FROM order_items oi JOIN menu_items mi ON oi.product_id = mi.id GROUP BY oi.product_id ORDER BY sold DESC LIMIT 8`),
          /* 5 */ promiseDb.query(`SELECT DATE(created_at) as best_date, SUM(total_amount) as daily_rev FROM orders GROUP BY DATE(created_at) ORDER BY daily_rev DESC LIMIT 1`),
          /* 6 */ promiseDb.query(`SELECT DATE_FORMAT(created_at,'%Y-%m-%d') as date, COUNT(*) as orders, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 15 DAY) GROUP BY DATE(created_at) ORDER BY date DESC`),
          /* 7 */ promiseDb.query(`SELECT item_name, quantity, unit, min_threshold, CASE WHEN quantity <= min_threshold THEN 'LOW' ELSE 'OK' END as stock_status FROM inventory ORDER BY stock_status DESC, item_name`),
          /* 8 */ promiseDb.query(`SELECT name, price_display, available FROM menu_items WHERE available = 1`),
          /* 9 */ promiseDb.query(`SELECT * FROM offers`),
          /* 10 */ promiseDb.query(`SELECT name, message, DATE_FORMAT(created_at,'%Y-%m-%d') as date FROM contact_messages ORDER BY created_at DESC LIMIT 10`),
          /* 11 */ promiseDb.query(`SELECT name, position, status FROM job_applications ORDER BY created_at DESC LIMIT 10`),
          /* 12 */ promiseDb.query(`SELECT title, type, location FROM careers WHERE active = 1`),
          /* 13 */ promiseDb.query(`SELECT ROUND(AVG(rating),1) as avg_rating, COUNT(*) as total FROM general_feedback`),
          /* 14 */ promiseDb.query(`SELECT reviewer_name, rating, comment FROM general_feedback ORDER BY created_at DESC LIMIT 5`),
          /* 15 */ promiseDb.query(`SELECT admin_name, action, details, DATE_FORMAT(created_at,'%Y-%m-%d %H:%i') as time FROM admin_logs ORDER BY created_at DESC LIMIT 20`),
          /* 16 */ promiseDb.query(`SELECT customer_name, total_amount, status, order_type, DATE_FORMAT(created_at,'%H:%i') as time FROM orders WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC`),
          /* 17 */ promiseDb.query(`SELECT mi.name as product, ROUND(AVG(pr.rating),1) as rating, COUNT(pr.id) as count FROM menu_items mi LEFT JOIN product_reviews pr ON mi.id = pr.product_id GROUP BY mi.id HAVING count > 0`)
        ]);

        const getRes = (idx, def = []) => (results[idx] && results[idx].status === 'fulfilled' ? results[idx].value[0] : def);

        const allTime         = getRes(0,  [{total_orders:0, total_revenue:0}])[0];
        const todayRow        = getRes(1,  [{today_orders:0, today_revenue:0}])[0];
        const yesterdayRow    = getRes(2,  [{yesterday_orders:0, yesterday_revenue:0}])[0];
        const orderStatuses   = getRes(3);
        const topProducts     = getRes(4);
        const bestDay         = getRes(5,  [null])[0];
        const salesTrend      = getRes(6);
        const inventory       = getRes(7);
        const menuItems       = getRes(8);
        const offers          = getRes(9);
        const messages        = getRes(10);
        const applications    = getRes(11);
        const activeJobs      = getRes(12);
        const feedbackSummary = getRes(13, [{avg_rating:'N/A', total:0}])[0];
        const recentFeedback  = getRes(14);
        const teamActivity    = getRes(15);
        const todayOrders     = getRes(16);
        const productRatings  = getRes(17);

        const lowStock = inventory.filter(i => i.stock_status === 'LOW');
        const okStock  = inventory.filter(i => i.stock_status === 'OK');

        businessContext = `You are the CaffAIne Business Intelligence Expert for CaffAIne, As-Salt.
Current UK Date/Time: ${currentDateTime}

=== TODAY ===
Revenue: JOD${parseFloat(todayRow.today_revenue).toFixed(2)} | Orders: ${todayRow.today_orders}
Orders Detail: ${todayOrders.map(o => `${o.customer_name} JOD${o.total_amount} (${o.status}) at ${o.time}`).join(' | ') || 'None yet'}

=== YESTERDAY ===
Revenue: JOD${parseFloat(yesterdayRow.yesterday_revenue).toFixed(2)} | Orders: ${yesterdayRow.yesterday_orders}

=== ALL-TIME ===
Total Revenue: JOD${allTime.total_revenue} | Total Orders: ${allTime.total_orders}
Best Day Ever: ${bestDay ? `${bestDay.best_date}: JOD${bestDay.daily_rev}` : 'N/A'}
By Status: ${orderStatuses.map(s => `${s.status}: ${s.count}`).join(', ')}

=== TOP PRODUCTS ===
${topProducts.map((p,i) => `${i+1}. ${p.name} (${p.sold} sold)`).join(' | ')}

=== SALES TREND (15 DAYS) ===
${salesTrend.map(d => `${d.date}: JOD${d.revenue} (${d.orders} orders)`).join(' | ')}

=== INVENTORY ===
âڑ ï¸ڈ LOW (${lowStock.length}): ${lowStock.map(i => `${i.item_name} ${i.quantity}${i.unit||''}`).join(', ') || 'None'}
âœ… OK: ${okStock.map(i => `${i.item_name}: ${i.quantity}${i.unit||''}`).join(', ')}

=== MENU & RATINGS ===
Items: ${menuItems.map(m => `${m.name} (${m.price_display})`).join(', ') || 'None'}
Ratings: ${productRatings.map(p => `${p.product}: ${p.rating}â­گ (${p.count} reviews)`).join(' | ') || 'No ratings yet'}

=== OFFERS ===
${offers.filter(o => o.active == 1).map(o => `${o.product_name}: ${o.discount_percent}% OFF (${o.reason})`).join(' | ') || 'No active offers'}

=== MESSAGES & JOBS ===
Recent Messages: ${messages.map(m => `[${m.date}] ${m.name}: "${m.message}"`).join(' | ') || 'None'}
Job Applications: ${applications.map(a => `${a.name} for ${a.position} (${a.status})`).join(' | ') || 'None'}
Active Listings: ${activeJobs.map(j => `${j.title} (${j.type}) in ${j.location}`).join(', ') || 'None'}

=== FEEDBACK ===
Avg: ${feedbackSummary.avg_rating}/5 (${feedbackSummary.total} reviews)
Recent: ${recentFeedback.map(f => `${f.reviewer_name} (${f.rating}/5): "${f.comment}"`).join(' | ') || 'None'}

=== TEAM ACTIVITY ===
${teamActivity.map(log => `[${log.time}] ${log.admin_name}: ${log.action} â€” ${log.details}`).join('\n')}

Rule: Answer ONLY from the data above. Be precise and professional.`;
      } catch (dbError) {
        console.error('[AI] Data Merge Error:', dbError);
        businessContext = `You are the CaffAIne BI Assistant. System status: Operational. Please ask your business questions.`;
      }
    } else {
      const [menuRes] = await promiseDb.query(`SELECT name, price_display FROM menu_items WHERE available = 1`);
      const menuItems = menuRes.map(m => `${m.name} (${m.price_display})`).join(', ');
      businessContext += `\nMenu: ${menuItems}`;
    }
  } catch (e) {
    console.warn('[AI] Context Fetch Error:', e.message);
  }

  try {
    if (!openai) throw new Error('OpenAI not initialized');
    const aiMessages = [{ role: 'system', content: businessContext }];
    if (history && Array.isArray(history)) aiMessages.push(...history);
    aiMessages.push({ role: 'user', content: message });
    
    const completion = await openai.chat.completions.create({ 
      model: 'gpt-4o-mini', 
      messages: aiMessages, 
      max_tokens: 500,
      temperature: 0.7
    });
    return res.json({ reply: completion.choices[0]?.message?.content || "I'm a bit stuck! Reach us at hello@CaffAInecoffee.co.uk âک•" });
  } catch (error) {
    console.error('[AI] Chat Error:', error.message);
    return res.status(200).json({ reply: `[Local Mode] AI service temporarily unavailable. Please try again later.` });
  }
});

app.get('/api/admin/logs', (req, res) => {
  db.query('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 200', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/admin/log', (req, res) => {
  const { action, details } = req.body;
  if (req.logAdminAction) req.logAdminAction(action, details);
  res.json({ success: true });
});

app.get('/api/test-ai', (req, res) => {
  res.json({ message: 'AI Server is reachable!', openai: !!openai });
});

app.post('/api/ai-assistant-logs', (req, res) => {
  const { admin_query, ai_response } = req.body;
  db.query('INSERT INTO ai_assistant_logs (admin_query, ai_response) VALUES (?, ?)', [admin_query, ai_response], (err) => {
    if (err) console.error('AI Log Error:', err);
    res.json({ success: true });
  });
});

app.get('/api/debug-images', (req, res) => {
  try {
    const dir = path.resolve(__dirname, 'public/images');
    if (!fs.existsSync(dir)) return res.json({ error: 'Directory not found', path: dir });
    const files = fs.readdirSync(dir);
    res.json({ 
      cwd: process.cwd(),
      dirname: __dirname,
      imageDir: dir,
      count: files.length,
      files: files.slice(0, 50) // only first 50 to avoid huge response
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});


// Production static files already served at top

// âœ… Catch-all for React Router
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// âœ… START SERVER - Single PORT definition
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ًںڑ€ CaffAIne Server is LIVE on port: ${PORT}`);
  console.log(`ًں”— Local Access: http://127.0.0.1:${PORT}`);
});
