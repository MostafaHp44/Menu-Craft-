const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k && v) process.env[k] = v;
  }
});
require('./src/app.js');
