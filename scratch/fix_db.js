const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'graduation_project',
  port: 3307
});

db.connect(err => {
  if (err) throw err;
  const queries = [
    "REPLACE INTO menu_items (id, category_id, name, price_num, price_display, description, tags, available, sort_order, addons, image_url) VALUES (1, 'espresso', 'Espresso', 2.80, '£2.80', 'A pure, bold single origin shot with a clean and bright finish. The ultimate classic coffee experience.', 'Vegan,Classic,Hot', 1, 1, 'Extra Shot,Caramel Syrup,Vanilla Syrup', 'Espresso.jpg')",
    "REPLACE INTO menu_items (id, category_id, name, price_num, price_display, description, tags, available, sort_order, addons, image_url) VALUES (18, 'espresso', 'Con Panna', 3.50, '£3.50', 'A rich, bold shot of espresso crowned with a smooth layer of velvety whipped cream for a luxurious, indulgent finish.', 'Vegetarian,Classic,Hot', 1, 20, 'Extra Whipped Cream,Cocoa Dust,Cinnamon Sprinkle', 'Con Panna.jpg')"
  ];
  
  db.query(queries[0], (err) => {
    if (err) console.error(err);
    else console.log('Espresso inserted/replaced.');
    
    db.query(queries[1], (err) => {
        if (err) console.error(err);
        else console.log('Con Panna inserted/replaced.');
        db.end();
    });
  });
});
