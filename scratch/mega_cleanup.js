const fs = require('fs');
const path = require('path');

const targets = [
  { search: /JOD/g, replace: 'JOD' },
  { search: //g, replace: '' },
  { search: /JOD/g, replace: 'JOD' },
  { search: //g, replace: '' },
  { search: /\uFFFD/g, replace: '' },
  { search: /->/g, replace: '->' },
  { search: /.../g, replace: '...' },
  { search: /☕/g, replace: '☕' },
  { search: /✅/g, replace: '✅' },
  { search: /⚠️/g, replace: '⚠️' },
  { search: /📱/g, replace: '📱' },
  { search: /📧/g, replace: '📧' },
  { search: /🚀/g, replace: '🚀' },
  { search: /🔗/g, replace: '🔗' },
  { search: /🤖/g, replace: '🤖' },
  { search: /×/g, replace: '×' },
  { search: /✓/g, replace: '✓' },
  { search: /📝/g, replace: '📝' },
  { search: /×/g, replace: '×' },
  { search: /📞/g, replace: '📞' },
  { search: /📍/g, replace: '📍' },
  { search: /☕/g, replace: '☕' },
  { search: /✅/g, replace: '✅' },
  { search: /JOD/g, replace: 'JOD' }
];

function cleanFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('build')) return;
  
  const stats = fs.statSync(filePath);
  if (stats.isDirectory()) {
    fs.readdirSync(filePath).forEach(file => cleanFile(path.join(filePath, file)));
  } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    targets.forEach(t => {
      content = content.replace(t.search, t.replace);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned: ${filePath}`);
    }
  }
}

const root = process.cwd();
console.log(`Starting Mega Cleanup (V2) in ${root}...`);
cleanFile(root);
console.log('Cleanup complete.');
