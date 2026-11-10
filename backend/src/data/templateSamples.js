// Server-side template sample menus for Phase 3 import
// Extracted from frontend/src/templates/data/templates.ts (sampleMenu arrays)

function makeItem(id, name, description, price, image, extra = {}) {
  return { id, name, description, price, compareAt: null, image, featured: false, popular: false, available: true, ...extra };
}
function makeCategory(id, name, note, items) {
  return { id, name, note, items };
}

const TEMPLATE_SAMPLES = {
  'burger-district': [
    makeCategory('cat-bd-1', 'Burgers', 'Smashed to order, no substitutions', [
      makeItem('item-bd-1', 'The District', 'Double patty, american cheese, house sauce', 13.5, '/images/food/food-15.jpg', { featured: true, popular: true }),
      makeItem('item-bd-2', 'Classic Smash', 'Single, pickles, onion, ketchup', 10.5, '/images/food/food-33.jpg'),
      makeItem('item-bd-3', 'Tower Stack', 'Triple patty, bacon jam, cheddar', 17, '/images/food/food-46.jpg', { featured: true }),
    ]),
    makeCategory('cat-bd-2', 'Loaded', 'Fries engineered for gravity', [
      makeItem('item-bd-4', 'District Loaded Fries', 'Cheese sauce, brisket, jalapeño', 9.5, '/images/food/food-50.jpg'),
      makeItem('item-bd-5', 'The Works Dog', 'Smoked sausage, kraut, mustard', 8.5, '/images/food/food-30.jpg'),
      makeItem('item-bd-6', 'Buttermilk Chicken', 'Slaw, hot honey, pickles', 14, '/images/food/food-21.jpg'),
    ]),
    makeCategory('cat-bd-3', 'Shakes', 'Thick. Cold. Worth it.', [
      makeItem('item-bd-7', 'Salted Malt Shake', 'Vanilla malt, sea salt', 6.5, '/images/food/food-8.jpg', { popular: true }),
      makeItem('item-bd-8', 'Espresso Shake', 'Cold brew, chocolate cream', 7, '/images/food/food-12.jpg'),
      makeItem('item-bd-9', 'Filter Coffee', 'Bottomless, diner style', 3.5, '/images/food/food-5.jpg'),
    ]),
    makeCategory('cat-bd-4', 'Sweet Finish', 'Because you said you had room', [
      makeItem('item-bd-10', 'Warm Cookie Skillet', 'Chocolate chunk, soft serve', 7.5, '/images/food/food-40.jpg'),
      makeItem('item-bd-11', 'Stack of Hotcakes', 'Maple, banana, butter', 8, '/images/food/food-19.jpg'),
    ]),
  ],
  'bella-italia': [
    makeCategory('cat-bi-1', 'Antipasti', 'To share, or not', [
      makeItem('item-bi-1', 'Bruschetta al Pomodoro', 'Sourdough, garlic, basil, olive oil', 9, '/images/food/food-33.jpg', { popular: true }),
      makeItem('item-bi-2', 'Insalata della Casa', 'Leaves, shaved parmigiano, lemon', 11, '/images/food/food-15.jpg'),
      makeItem('item-bi-3', 'Polpette della Nonna', 'Beef & pork meatballs, sugo, parmesan', 13, '/images/food/food-30.jpg'),
    ]),
    makeCategory('cat-bi-2', 'Pasta', 'Rolled fresh every morning', [
      makeItem('item-bi-4', 'Tagliatelle ai Funghi', 'Wild mushroom, thyme, cream', 19, '/images/food/food-37.jpg', { featured: true, popular: true }),
      makeItem('item-bi-5', 'Spaghetti ai Frutti di Mare', 'Clams, mussels, chilli, white wine', 23, '/images/food/food-49.jpg', { featured: true }),
      makeItem('item-bi-6', 'Penne all’Arrabbiata', 'Tomato, garlic, calabrian chilli', 16, '/images/food/food-28.jpg'),
      makeItem('item-bi-7', 'Pasta alla Zucchina', 'Courgette ribbons, mint, pecorino', 18, '/images/food/food-20.jpg'),
    ]),
    makeCategory('cat-bi-3', 'Pizza', '48-hour dough, wood fired', [
      makeItem('item-bi-8', 'Margherita D.O.P.', 'San marzano, fior di latte, basil', 16, '/images/food/food-22.jpg', { popular: true }),
      makeItem('item-bi-9', 'Quattro Formaggi', 'Gorgonzola, taleggio, provolone, mozzarella', 19, '/images/food/food-22.jpg'),
      makeItem('item-bi-10', 'Diavola', 'Spicy salami, chilli honey', 18, '/images/food/food-23.jpg'),
    ]),
    makeCategory('cat-bi-4', 'Secondi', 'From the grill', [
      makeItem('item-bi-11', 'Tagliata di Manzo', 'Sliced ribeye, rocket, balsamic', 32, '/images/food/food-50.jpg', { featured: true }),
      makeItem('item-bi-12', 'Bistecca alla Fiorentina', 'For two, 600g, rosemary potatoes', 68, '/images/food/food-33.jpg'),
      makeItem('item-bi-13', 'Costolette d’Agnello', 'Slow braised, tomato, olives', 29, '/images/food/food-30.jpg'),
    ]),
    makeCategory('cat-bi-5', 'Dolci', 'Made by Marta', [
      makeItem('item-bi-14', 'Tiramisù Classico', 'Mascarpone, espresso, cocoa', 9, '/images/food/food-8.jpg', { featured: true }),
      makeItem('item-bi-15', 'Torta al Cioccolato', 'Warm dark chocolate centre', 10, '/images/food/food-8.jpg'),
      makeItem('item-bi-16', 'Biscotti della Casa', 'Almond, cantuccini, vin santo', 7, '/images/food/food-40.jpg'),
    ]),
  ],
  'urban-cafe': [
    makeCategory('cat-uc-1', 'Coffee', 'Espresso, filter, cold', [
      makeItem('item-uc-1', 'Flat White', 'Double ristretto, silk milk', 4.5, '/images/food/food-5.jpg', { popular: true }),
      makeItem('item-uc-2', 'House Latte', '12h cold steep, no bitterness', 5, '/images/food/food-12.jpg', { featured: true }),
      makeItem('item-uc-3', 'Nitro Cold Brew', 'Cascading, on tap', 5.5, '/images/food/food-8.jpg'),
    ]),
    makeCategory('cat-uc-2', 'Brunch', 'Served until 15:00', [
      makeItem('item-uc-4', 'Smashed Avo', 'Sourdough, chilli, poached egg', 13.5, '/images/food/food-20.jpg', { featured: true, popular: true }),
      makeItem('item-uc-5', 'Banana Brioche French Toast', 'Maple, mascarpone, berries', 12, '/images/food/food-19.jpg'),
      makeItem('item-uc-6', 'Buttermilk Stack', 'Berry compote, whipped honey butter', 11.5, '/images/food/food-19.jpg'),
    ]),
    makeCategory('cat-uc-3', 'Lunch', 'Kitchen closes 16:00', [
      makeItem('item-uc-7', 'The Bond Sandwich', 'Roast chicken, aioli, pickles', 12.5, '/images/food/food-30.jpg'),
      makeItem('item-uc-8', 'Green Goddess Bowl', 'Grains, avocado, seeds, herbs', 14, '/images/food/food-15.jpg'),
      makeItem('item-uc-9', 'Pesto Penne', 'Basil, pine nut, pecorino', 13, '/images/food/food-28.jpg'),
    ]),
    makeCategory('cat-uc-4', 'Sweet', 'Baked here each morning', [
      makeItem('item-uc-10', 'Brown Butter Cookie', 'Sea salt, dark chocolate', 3.8, '/images/food/food-40.jpg', { popular: true }),
      makeItem('item-uc-11', 'Vanilla Cupcake', 'Vanilla bean buttercream', 4.2, '/images/food/food-8.jpg'),
      makeItem('item-uc-12', 'Fudge Slice', 'Single origin, 70%', 5.5, '/images/food/food-8.jpg'),
    ]),
  ],
  'the-royal': [
    makeCategory('cat-tr-1', 'Overture', 'First bites and cold openings', [
      makeItem('item-tr-1', 'Hand Dived Scallop', 'Brown butter, cauliflower, caviar', 26, '/images/food/food-33.jpg', { featured: true }),
      makeItem('item-tr-2', 'Heritage Beetroot', 'Chèvre, walnut, aged balsamic', 18, '/images/food/food-15.jpg'),
      makeItem('item-tr-3', 'Velouté of Celeriac', 'Truffle, chive oil, crème fraîche', 16, '/images/food/food-8.jpg', { popular: true }),
    ]),
    makeCategory('cat-tr-2', 'Principal', 'From the fire, carved to order', [
      makeItem('item-tr-4', '45-Day Aged Ribeye', 'Bone marrow, watercress, triple cooked chips', 62, '/images/food/food-33.jpg', { featured: true, popular: true }),
      makeItem('item-tr-5', 'Slow Cooked Lamb Shoulder', 'White bean, rosemary jus, salsa verde', 44, '/images/food/food-30.jpg'),
      makeItem('item-tr-6', 'Herb Crusted Pork', 'Apple, mustard seed, fondant potato', 40, '/images/food/food-21.jpg'),
    ]),
    makeCategory('cat-tr-3', 'Garden', 'Vegetable plates from our growers', [
      makeItem('item-tr-7', 'Charred Hispi Cabbage', 'Anchovy butter, breadcrumb, lemon', 22, '/images/food/food-15.jpg'),
      makeItem('item-tr-8', 'Garden Leaf Salad', 'Herbs, shallot, champagne dressing', 15, '/images/food/food-15.jpg'),
      makeItem('item-tr-9', 'Heirloom Tomato', 'Stracciatella, basil oil, sea salt', 21, '/images/food/food-21.jpg'),
    ]),
    makeCategory('cat-tr-4', 'Finale', 'Desserts and petit fours', [
      makeItem('item-tr-10', 'Salted Caramel Custard', 'Toasted honey, crème double', 14, '/images/food/food-8.jpg', { popular: true }),
      makeItem('item-tr-11', 'Dark Chocolate Marquise', 'Malt, sour cherry, vanilla cream', 15, '/images/food/food-8.jpg', { featured: true }),
      makeItem('item-tr-12', 'Petits Fours', 'Two of each, with coffee', 11, '/images/food/food-40.jpg'),
    ]),
  ],
};

function getTemplateSampleMenu(templateId) {
  return TEMPLATE_SAMPLES[templateId] || TEMPLATE_SAMPLES['burger-district'];
}

module.exports = { TEMPLATE_SAMPLES, getTemplateSampleMenu };
