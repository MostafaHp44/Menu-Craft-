const fs = require('fs');
const files = fs.readdirSync('src', {recursive: true}).filter(f => f.endsWith('.js'));
for (const f of files) {
  try {
    let content = fs.readFileSync('src/' + f, 'utf8');
    if (content.includes('$') && (content.includes('.query') || content.includes('.Query'))) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('$') && (lines[i].includes('.query') || lines[i].includes('.Query'))) {
          console.log(f + ':' + (i+1) + ': ' + lines[i].substring(0, 200));
        }
      }
    }
  } catch(e) {}
}
console.log('Done scanning');