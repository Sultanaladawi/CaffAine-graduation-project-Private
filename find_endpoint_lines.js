const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('/api/analytics-monthly') || 
      lines[i].includes('/api/analytics-range') || 
      lines[i].includes('/api/dashboard-stats') || 
      lines[i].includes('/api/analytics-all-sold-products')) {
    console.log(`MATCH AT LINE ${i + 1}: ${lines[i].trim()}`);
  }
}
