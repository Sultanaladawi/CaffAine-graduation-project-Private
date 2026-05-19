const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');

// We want to see the queries around indices 32000, 35000, 29000, 37000
const indexRanges = [
  { label: 'analytics-monthly', start: 32000, length: 2500 },
  { label: 'analytics-range', start: 35000, length: 2500 },
  { label: 'dashboard-stats', start: 28800, length: 2000 },
  { label: 'analytics-all-sold-products', start: 37100, length: 1500 }
];

indexRanges.forEach(r => {
  console.log(`============================= ${r.label} =============================`);
  console.log(content.substring(r.start, r.start + r.length));
  console.log(`======================================================================\n`);
});
