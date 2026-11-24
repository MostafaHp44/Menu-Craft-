// Server-side template sample menus for Phase 3 import
// Extracted from frontend/src/templates/data/templates.ts (sampleMenu arrays)
// Stock templates: kreme-deals + aurum-lounge.

function makeItem(id, name, description, price, image, extra = {}) {
  return { id, name, description, price, compareAt: null, image, featured: false, popular: false, available: true, ...extra };
}
function makeCategory(id, name, note, items) {
  return { id, name, note, items };
}

const TEMPLATE_SAMPLES = {
  'kreme-deals': [
    makeCategory('cat-kd-1', 'Doughnuts — Best Deal', 'Dozen deals', [
      makeItem('item-kd-1', 'Dozen — 35% OFF', 'Twelve donuts, assorted', 299, '/images/food/food-28.jpg', { featured: true }),
      makeItem('item-kd-2', 'Half Dozen — 25% OFF', 'Six donuts, assorted', 179, '/images/food/food-40.jpg', { popular: true }),
      makeItem('item-kd-3', 'Better Together — 99 EGP', 'Coffee + donut', 99, '/images/food/food-25.jpg', { featured: true }),
      makeItem('item-kd-4', 'Better Together — 119 EGP', 'Cold drink + chocolate donut', 119, '/images/food/food-22.jpg'),
    ]),
    makeCategory('cat-kd-2', 'Minis', 'Boxes', [
      makeItem('item-kd-5', 'Assorted 4 Minis', '', 125, '/images/food/food-40.jpg'),
      makeItem('item-kd-6', 'Assorted 16 Minis', '', 370, '/images/food/food-28.jpg', { popular: true }),
    ]),
  ],
};

function getTemplateSampleMenu(templateId) {
  return TEMPLATE_SAMPLES[templateId] || TEMPLATE_SAMPLES['kreme-deals'];
}

module.exports = { TEMPLATE_SAMPLES, getTemplateSampleMenu };
