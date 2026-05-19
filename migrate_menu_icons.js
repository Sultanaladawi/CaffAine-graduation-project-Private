const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/ECC/Downloads/Graduation-project--main/src/components/Menu.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Lucide imports at the top
const importReplacement = `import { useState, useEffect } from 'react';
import { 
  Coffee, 
  CupSoda, 
  Utensils, 
  Cookie, 
  Mic, 
  Square, 
  Search, 
  XCircle, 
  Plus, 
  PlusCircle 
} from 'lucide-react';`;

content = content.replace("import { useState, useEffect } from 'react';", importReplacement);

// 2. Add renderCategoryIcon helper function
const helperFunction = `
const renderCategoryIcon = (iconName, color, size = 18) => {
  const name = String(iconName || '').toLowerCase();
  if (name.includes('coffee') || name.includes('mug') || name.includes('glass-martini')) return <Coffee size={size} color={color} />;
  if (name.includes('soda') || name.includes('drink') || name.includes('wine') || name.includes('glass')) return <CupSoda size={size} color={color} />;
  if (name.includes('utensils') || name.includes('food') || name.includes('bread')) return <Utensils size={size} color={color} />;
  if (name.includes('cookie') || name.includes('sweet') || name.includes('cake') || name.includes('ice-cream')) return <Cookie size={size} color={color} />;
  return <Coffee size={size} color={color} />;
};
`;

content = content.replace("function Tags({ tags = [], linkedTags = [] }) {", helperFunction + "\nfunction Tags({ tags = [], linkedTags = [] }) {");

// 3. Replace Search icon
content = content.replace('<i className="fas fa-search" />', '<Search size={20} />');

// 4. Replace Clear Search icon
content = content.replace('<i className="fas fa-times-circle" />', '<XCircle size={20} />');

// 5. Replace Voice Search icon
content = content.replace('<i className={`fas ${listening ? \'fa-stop\' : \'fa-microphone\'}`} />', '{listening ? <Square size={16} fill="#fff" style={{ color: \'#fff\' }} /> : <Mic size={16} style={{ color: \'#fff\' }} />}');

// 6. Replace Category icons
content = content.replace("<i className={`fas ${cat.icon || 'fa-coffee'}`} style={{ fontSize: '1rem', color: isActive ? '#fff' : catColor }} />", '{renderCategoryIcon(cat.icon, isActive ? \'#fff\' : catColor, 18)}');

// 7. Replace Add small button icon
content = content.replace('<i className="fas fa-plus" />', '<Plus size={16} style={{ color: \'#fff\' }} />');

// 8. Replace empty search results state icon
content = content.replace('<i className="fas fa-mug-hot" style={{ fontSize: \'3rem\', marginBottom: \'20px\', display: \'block\', opacity: 0.3 }} />', '<Coffee size={60} style={{ margin: \'0 auto 20px\', display: \'block\', opacity: 0.3, color: \'var(--espresso)\' }} />');

// 9. Replace available customizations title icon
content = content.replace('<i className="fas fa-plus-circle" />', '<PlusCircle size={16} style={{ display: \'inline-block\', verticalAlign: \'middle\', marginRight: \'6px\' }} />');

// 10. Replace available customizations plus icon
content = content.replace('<i className="fas fa-plus" style={{ fontSize: \'0.7rem\', opacity: 0.7 }} />', '<Plus size={12} style={{ opacity: 0.7 }} />');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully migrated Menu.js FontAwesome icons to premium Lucide React icons!');
