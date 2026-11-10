require('./load_env.js');
const { importTemplateSampleMenu } = require('./src/services/restaurant.service');
(async () => {
  try {
    const result = await importTemplateSampleMenu('rest-bella-mw1xq4wc-8pa9o', 'burger-district', true);
    console.log('IMPORTED OK');
    console.log('draft_menu categories:', result.draft_menu ? JSON.parse(result.draft_menu).length : 'none');
    console.log('items total:', JSON.parse(result.draft_menu || '[]').reduce((s,c)=>s+(c.items||[]).length,0));
    console.log('templateId:', result.templateId);
  } catch (e) {
    console.error('ERROR:', e.message, 'code:', e.code);
  }
})();
