const fs = require('fs');
const t = fs.readFileSync('frontend/src/templates/data/templates.ts', 'utf8');
const lines = t.split('\n');
const ids = lines.filter(l => l.includes('id:'));
console.log('Matches:', ids.length);
ids.slice(0, 40).forEach(i => console.log(i));
