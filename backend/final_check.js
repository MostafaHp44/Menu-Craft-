const fs = require('fs');
const content = fs.readFileSync('backend/src/services/menu.service.js', 'utf8');
const lines = content.split('\n');

const patterns = ['getPool', '.request(', '.input(', 'sql.', 'mssql', 'Transaction', 'GETDATE', 'NEWID', 'NVarChar', 'VarChar', 'Bit', 'Decimal'];
const found = patterns.filter(p => content.includes(p)).map(p => p + ' found at lines: ' + lines.filter((l, i) => l.includes(p)).length);
console.log('Line count:', lines.length);
if (found.length === 0) console.log('No MSSQL references found. Conversion clean.');
else console.log('MSSQL references found:', found.join(', '));
