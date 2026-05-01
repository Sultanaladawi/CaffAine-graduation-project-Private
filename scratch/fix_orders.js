const fs = require('fs');
const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'graduation_project', port: 3307 });

const sql = fs.readFileSync('graduation_project.sql', 'utf8');

const ordersInsertMatch = sql.match(/INSERT INTO `orders` \([^)]+\) VALUES\s+([^;]+);/is);
const orderItemsInsertMatch = sql.match(/INSERT INTO `order_items` \([^)]+\) VALUES\s+([^;]+);/is);

if (ordersInsertMatch && orderItemsInsertMatch) {
  const ordersQuery = 'REPLACE INTO `orders` (`id`, `customer_name`, `email`, `total_amount`, `status`, `created_at`, `store_rating`, `store_comment`) VALUES ' + ordersInsertMatch[1] + ';';
  const orderItemsQuery = 'REPLACE INTO `order_items` (`id`, `order_id`, `product_id`, `item_name`, `quantity`, `price`, `addons`, `notes`, `rating`) VALUES ' + orderItemsInsertMatch[1] + ';';
  
  db.query(ordersQuery, err => {
    if(err) console.error('Orders Error:', err);
    else console.log('Orders replaced successfully.');
    
    db.query(orderItemsQuery, err2 => {
       if(err2) console.error('Order Items Error:', err2);
       else console.log('Order Items replaced successfully.');
       db.end();
    });
  });
} else {
  console.log('Could not find insert statements.');
  db.end();
}
