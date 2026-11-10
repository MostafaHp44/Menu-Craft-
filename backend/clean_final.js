const fs = require('fs');
const files = [
  'backend/test_idemp.js', 'backend/fix_idemp_index.js', 'backend/fix_idemp_index2.js',
  'backend/_cleanup.js', 'backend/debug_insert2.js', 'backend/debug_insert3.js',
  'backend/debug_order_insert.js', 'backend/check_order_schema.js', 'backend/test_order_conv.js'
];
for (const f of files) {
  try {
    fs.unlinkSync(f.replace('backend/', 'D:\\MBN Group\\Test Menu\\backend\\'));
    // Actually the file is relative to current directory
    fs.unlinkSync(f);
    console.log('cleaned', f);
  } catch (e) {
    console.log('skipped (not found):', f);
  }
}
