const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');

const queries = ['analytics-monthly', 'analytics-range', 'dashboard-stats', 'all-sold-products'];
queries.forEach(q => {
  let idx = 0;
  while ((idx = content.indexOf(q, idx)) !== -1) {
    const start = Math.max(0, idx - 100);
    const end = Math.min(content.length, idx + 400);
    console.log(`=== MATCH FOR '${q}' at index ${idx} ===`);
    console.log(content.substring(start, end));
    console.log('======================================\n');
    idx += q.length;
  }
});
