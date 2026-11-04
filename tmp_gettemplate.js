const fs = require('fs');
const t = fs.readFileSync('frontend/src/templates/data/templates.ts', 'utf8');
const idx = t.indexOf('export function getTemplate');
console.log(t.substring(idx, idx + 900));
