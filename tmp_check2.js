const fs = require('fs');
const t = fs.readFileSync('frontend/src/templates/data/templates.ts', 'utf8');
const ids = ['the-royal','urban-cafe','sweet-atelier','burger-district','bella-italia','bean-brew','green-table','maison-patisserie'];
for (const id of ids) {
  const idx = t.indexOf("id: '" + id + "'");
  const snippet = t.substring(idx, idx + 400);
  const hasDefault = snippet.includes('defaultDesign');
  console.log(id + ' => defaultDesign=' + hasDefault + ' | snippet start: ' + snippet.trim().slice(0, 120).replace(/\n/g, ' '));
}
