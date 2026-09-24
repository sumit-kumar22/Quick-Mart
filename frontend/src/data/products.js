const slug = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const toVariant = ([weight, unitSize, mrp, price, stock], i, productId) => ({
  id: `${productId}-v${i + 1}`,
  weight,
  unitSize,
  mrp,
  price,
  stock,
});

function makeProduct({
  id, name, brand, category, subcategory, emoji, color, unit,
  variants, shortDescription, description, tags = [], rating, reviewCount,
  featured = false, bestseller = false, newArrival = false,
  minQty = 1, maxQty = 12, tax = 5,
  storeStock = null, usesVariants = true,
}) {
  const [first] = variants;
  const mrp = first[2];
  const price = first[3];
  const stock = first[4];
  return {
    id,
    sku: `${brand.slice(0, 2).toUpperCase()}${id.toUpperCase().replace(/\D/g, '')}`,
    name,
    slug: slug(name),
    image: `${import.meta.env.BASE_URL}images/products/${slug(name)}.jpg`,
    brand,
    category,
    subcategory,
    emoji,
    color,
    unit,
    weight: first[0],
    variants: variants.map((v, i) => toVariant(v, i, id)),
    mrp,
    sellingPrice: price,
    discount: Math.round(((mrp - price) / mrp) * 100),
    tax,
    stock,
    usesVariants,
    minQty,
    maxQty,
    shortDescription,
    description,
    tags: tags.length ? tags : slug(name).split('-').slice(0, 3),
    featured,
    bestseller,
    newArrival,
    rating,
    reviewCount,
    deliveryEligible: true,
    active: true,
    storeStock:
      storeStock ||
      st(stock),
  };
}

// default store stock spread
function st(base) {
  return {
    'st-1': Math.max(0, Math.round(base * 0.6)),
    'st-2': Math.max(0, Math.round(base * 0.4)),
    'st-3': Math.max(0, Math.round(base * 0.25)),
    'st-4': Math.max(0, Math.round(base * 0.5)),
  };
}

export const products = [
  // ---------- Fruits & Vegetables ----------
  makeProduct({ id: 'p001', name: 'Farm Fresh Tomato', brand: 'FreshHarvest', category: 'fruits-vegetables', subcategory: 'Vegetables', emoji: '🍅', color: 'from-red-100 to-rose-100', unit: 'kg', variants: [['250 g', 'gm', 30, 24, 200], ['500 g', 'gm', 58, 46, 150], ['1 kg', 'kg', 110, 88, 90]], shortDescription: 'Ripe, firm and juicy tomatoes picked fresh.', description: 'Hand-picked farm tomatoes that are ripe, firm and full of flavour. Ideal for curries, salads and sandwiches.', rating: 4.5, reviewCount: 528, bestseller: true, featured: true, tags: ['tomato', 'salad', 'vegetable'] }),
  makeProduct({ id: 'p002', name: 'Organic Onion', brand: 'FreshHarvest', category: 'fruits-vegetables', subcategory: 'Vegetables', emoji: '🧅', color: 'from-orange-100 to-amber-100', unit: 'kg', variants: [['500 g', 'gm', 35, 26, 320], ['1 kg', 'kg', 68, 50, 210]], shortDescription: 'Pungent organic onions for everyday cooking.', description: 'Organically grown onions with a strong pungent flavour. A kitchen staple for every Indian household.', rating: 4.3, reviewCount: 402, bestseller: true, tags: ['onion', 'vegetable', 'pyaaz'] }),
  makeProduct({ id: 'p003', name: 'Baby Potatoes', brand: 'FreshHarvest', category: 'fruits-vegetables', subcategory: 'Vegetables', emoji: '🥔', color: 'from-yellow-100 to-amber-100', unit: 'kg', variants: [['500 g', 'gm', 45, 32, 180], ['1 kg', 'kg', 85, 60, 120]], shortDescription: 'Smooth-skinned baby potatoes, great for roasting.', description: 'Tender baby potatoes that roast beautifully and make perfect aloo dishes.', rating: 4.4, reviewCount: 317, tags: ['potato', 'aloo', 'vegetable'] }),
  makeProduct({ id: 'p004', name: 'Green Chilli', brand: 'FreshHarvest', category: 'fruits-vegetables', subcategory: 'Vegetables', emoji: '🌶️', color: 'from-green-100 to-lime-100', unit: 'gm', variants: [['100 g', 'gm', 20, 15, 400], ['250 g', 'gm', 45, 35, 250]], shortDescription: 'Hot green chillies to spice up your meals.', description: 'Fresh green chillies that add the perfect kick of heat to any dish.', rating: 4.2, reviewCount: 210, tags: ['chilli', 'mirchi', 'spice'] }),
  makeProduct({ id: 'p005', name: 'Capsicum Mix', brand: 'FreshHarvest', category: 'fruits-vegetables', subcategory: 'Vegetables', emoji: '🫑', color: 'from-green-100 to-emerald-100', unit: 'gm', variants: [['250 g', 'gm', 32, 25, 130], ['500 g', 'gm', 60, 48, 80]], shortDescription: 'Crunchy green, red and yellow capsicum.', description: 'A colourful mix of crunchy capsicum, perfect for stir-fries, pizza and salads.', rating: 4.6, reviewCount: 274, newArrival: true, tags: ['capsicum', 'bell pepper', 'vegetable'] }),
  makeProduct({ id: 'p006', name: 'Carrot Orange', brand: 'FreshHarvest', category: 'fruits-vegetables', subcategory: 'Vegetables', emoji: '🥕', color: 'from-orange-100 to-red-100', unit: 'gm', variants: [['250 g', 'gm', 28, 20, 260], ['500 g', 'gm', 52, 38, 170]], shortDescription: 'Sweet, crunchy orange carrots.', description: 'Crunchy and naturally sweet carrots, rich in vitamin A. Ideal for salads, juice and gajar halwa.', rating: 4.5, reviewCount: 356, tags: ['carrot', 'gajar', 'vegetable'] }),
  makeProduct({ id: 'p007', name: 'Red Apple Shimla', brand: 'OrchardBest', category: 'fruits-vegetables', subcategory: 'Fruits', emoji: '🍎', color: 'from-red-100 to-pink-100', unit: 'kg', variants: [['500 g', 'gm', 120, 99, 100], ['1 kg', 'kg', 235, 189, 60]], shortDescription: 'Crisp Himalayan red apples.', description: 'Premium Shimla apples that are crisp, juicy and naturally sweet — a perfect healthy snack.', rating: 4.7, reviewCount: 642, bestseller: true, featured: true, tags: ['apple', 'fruit', 'shimla'] }),
  makeProduct({ id: 'p008', name: 'Cavendish Banana', brand: 'OrchardBest', category: 'fruits-vegetables', subcategory: 'Fruits', emoji: '🍌', color: 'from-yellow-100 to-amber-100', unit: 'dozen', variants: [['6 units', 'pc', 45, 36, 140], ['12 units', 'pc', 85, 68, 100]], shortDescription: 'Sweet dessert bananas.', description: 'Sweet and creamy Cavendish bananas, a quick energy-packed snack at any time of the day.', rating: 4.6, reviewCount: 471, bestseller: true, tags: ['banana', 'kela', 'fruit'] }),
  makeProduct({ id: 'p009', name: 'Sweet Mango Alphonso', brand: 'OrchardBest', category: 'fruits-vegetables', subcategory: 'Fruits', emoji: '🥭', color: 'from-amber-100 to-yellow-100', unit: 'kg', variants: [['500 g', 'gm', 220, 179, 55], ['1 kg', 'kg', 430, 349, 30]], shortDescription: 'Premium Alphonso mangoes.', description: 'King of fruits — Alphonso mangoes are buttery, aromatic and irresistibly sweet.', rating: 4.8, reviewCount: 389, newArrival: true, featured: true, tags: ['mango', 'aam', 'alphonso'] }),
  makeProduct({ id: 'p010', name: 'Cucumber', brand: 'FreshHarvest', category: 'fruits-vegetables', subcategory: 'Vegetables', emoji: '🥒', color: 'from-green-100 to-lime-100', unit: 'gm', variants: [['250 g', 'gm', 22, 16, 290], ['500 g', 'gm', 40, 30, 200]], shortDescription: 'Cool and refreshing cucumbers.', description: 'Fresh cucumbers that are crisp and cooling — perfect for salads and raita.', rating: 4.3, reviewCount: 232, tags: ['cucumber', 'kheera', 'vegetable'] }),
  makeProduct({ id: 'p011', name: 'Green Spinach', brand: 'FreshHarvest', category: 'fruits-vegetables', subcategory: 'Vegetables', emoji: '🥬', color: 'from-green-100 to-emerald-100', unit: 'bunch', variants: [['1 bunch', 'pc', 18, 12, 150], ['2 bunches', 'pc', 32, 24, 90]], shortDescription: 'Fresh leafy spinach (palak).', description: 'Freshly harvested palak leaves, rich in iron and nutrients. Great for saag and smoothies.', rating: 4.4, reviewCount: 198, tags: ['spinach', 'palak', 'leafy'] }),
  makeProduct({ id: 'p012', name: 'Broccoli Crowns', brand: 'FreshHarvest', category: 'fruits-vegetables', subcategory: 'Vegetables', emoji: '🥦', color: 'from-green-100 to-teal-100', unit: 'gm', variants: [['250 g', 'gm', 65, 52, 70]], shortDescription: 'Nutrient-packed broccoli crowns.', description: 'Fresh broccoli crowns, packed with vitamins and perfect for stir-fries and salads.', rating: 4.5, reviewCount: 143, tags: ['broccoli', 'vegetable', 'healthy'] }),

  // ---------- Dairy & Breakfast ----------
  makeProduct({ id: 'p020', name: 'Pure Cow Milk', brand: 'DailyDairy', category: 'dairy-breakfast', subcategory: 'Milk', emoji: '🥛', color: 'from-sky-100 to-blue-100', unit: 'L', variants: [['500 ml', 'ml', 27, 25, 400], ['1 L', 'L', 52, 48, 350]], shortDescription: 'Pure and fresh toned cow milk.', description: 'Farm-fresh toned milk, pasteurised and packed at dawn. Rich in calcium and protein.', rating: 4.7, reviewCount: 812, bestseller: true, featured: true, tags: ['milk', 'doodh', 'dairy'] }),
  makeProduct({ id: 'p021', name: 'Full Cream Milk', brand: 'DailyDairy', category: 'dairy-breakfast', subcategory: 'Milk', emoji: '🥛', color: 'from-blue-100 to-indigo-100', unit: 'L', variants: [['500 ml', 'ml', 31, 29, 300], ['1 L', 'L', 60, 55, 240]], shortDescription: 'Thick and creamy full cream milk.', description: 'Full cream milk with a thick, creamy consistency. Perfect for tea, coffee and desserts.', rating: 4.6, reviewCount: 540, bestseller: true, tags: ['milk', 'full cream', 'dairy'] }),
  makeProduct({ id: 'p022', name: 'Curd (Dahi)', brand: 'DailyDairy', category: 'dairy-breakfast', subcategory: 'Dairy', emoji: '🥣', color: 'from-slate-100 to-gray-100', unit: 'gm', variants: [['200 g', 'gm', 22, 18, 220], ['400 g', 'gm', 40, 34, 160]], shortDescription: 'Thick and creamy fresh curd.', description: 'Freshly set thick curd made from pure milk. Great with meals or as a healthy snack.', rating: 4.6, reviewCount: 466, tags: ['curd', 'dahi', 'yogurt'] }),
  makeProduct({ id: 'p023', name: 'Butter', brand: 'DailyDairy', category: 'dairy-breakfast', subcategory: 'Dairy', emoji: '🧈', color: 'from-yellow-100 to-amber-100', unit: 'gm', variants: [['100 g', 'gm', 55, 48, 180]], shortDescription: 'Salted table butter.', description: 'Creamy salted butter made from fresh cream. Perfect for toast, baking and cooking.', rating: 4.5, reviewCount: 274, tags: ['butter', 'makhan', 'dairy'] }),
  makeProduct({ id: 'p024', name: 'Farm Eggs', brand: 'SunrisePoultry', category: 'dairy-breakfast', subcategory: 'Eggs', emoji: '🥚', color: 'from-amber-100 to-orange-100', unit: 'pack', variants: [['6 pack', 'pc', 54, 48, 260], ['12 pack', 'pc', 104, 92, 200], ['30 pack', 'pc', 245, 218, 90]], shortDescription: 'Protein-rich farm fresh eggs.', description: 'Farm-fresh eggs from healthy hens, high in protein and great for a nutritious breakfast.', rating: 4.6, reviewCount: 628, bestseller: true, tags: ['eggs', 'ande', 'protein'] }),
  makeProduct({ id: 'p025', name: 'Oats Classic', brand: 'NutriWave', category: 'dairy-breakfast', subcategory: 'Cereals', emoji: '🌾', color: 'from-amber-100 to-yellow-100', unit: 'gm', variants: [['500 g', 'gm', 145, 119, 140], ['1 kg', 'kg', 260, 219, 80]], shortDescription: 'Whole grain rolled oats.', description: '100% whole-grain rolled oats, rich in fibre. The perfect base for a healthy breakfast bowl.', rating: 4.5, reviewCount: 301, newArrival: true, tags: ['oats', 'cereal', 'healthy'] }),
  makeProduct({ id: 'p026', name: 'Paneer Fresh', brand: 'DailyDairy', category: 'dairy-breakfast', subcategory: 'Dairy', emoji: '🧀', color: 'from-white to-slate-100', unit: 'gm', variants: [['200 g', 'gm', 95, 79, 90]], shortDescription: 'Soft, fresh cottage cheese.', description: 'Soft and creamy fresh paneer, high in protein. Ideal for curries, grills and snacks.', rating: 4.4, reviewCount: 387, tags: ['paneer', 'cottage cheese', 'dairy'] }),

  // ---------- Snacks & Munchies ----------
  makeProduct({ id: 'p040', name: 'Original Potato Chips', brand: 'CrunchCo', category: 'snacks-munchies', subcategory: 'Chips', emoji: '🍟', color: 'from-amber-100 to-yellow-100', unit: 'gm', variants: [['62 g', 'gm', 20, 18, 420], ['135 g', 'gm', 45, 40, 320]], shortDescription: 'Classic salted potato chips.', description: 'Crispy, golden potato chips with the perfect amount of salt. A timeless snack.', rating: 4.4, reviewCount: 723, bestseller: true, tags: ['chips', 'snack', 'potato'] }),
  makeProduct({ id: 'p041', name: 'Masala Peanuts', brand: 'TastyBites', category: 'snacks-munchies', subcategory: 'Nuts', emoji: '🥜', color: 'from-orange-100 to-red-100', unit: 'gm', variants: [['150 g', 'gm', 35, 29, 260]], shortDescription: 'Roasted peanuts with tangy masala.', description: 'Crunchy peanuts roasted and tossed in a spicy, tangy masala mix. Perfect tea-time snack.', rating: 4.3, reviewCount: 345, tags: ['peanut', 'masala', 'snack'] }),
  makeProduct({ id: 'p042', name: 'Chocolate Cookies', brand: 'Bakehouse', category: 'snacks-munchies', subcategory: 'Biscuits', emoji: '🍪', color: 'from-amber-100 to-orange-100', unit: 'gm', variants: [['150 g', 'gm', 60, 49, 200], ['300 g', 'gm', 112, 92, 130]], shortDescription: 'Choco-chip cookies with real chocolate.', description: 'Buttery cookies loaded with real chocolate chips. Baked fresh & packaged.', rating: 4.6, reviewCount: 512, bestseller: true, featured: true, tags: ['cookie', 'chocolate', 'biscuit'] }),
  makeProduct({ id: 'p043', name: 'Khari Biscuit', brand: 'Bakehouse', category: 'snacks-munchies', subcategory: 'Biscuits', emoji: '🥐', color: 'from-yellow-100 to-amber-100', unit: 'gm', variants: [['200 g', 'gm', 40, 32, 280], ['400 g', 'gm', 75, 60, 180]], shortDescription: 'Flaky salted khari.', description: 'Light, flaky and airy khari biscuits with a touch of salt — a classic tea-time favourite.', rating: 4.4, reviewCount: 288, tags: ['khari', 'biscuit', 'snack'] }),
  makeProduct({ id: 'p044', name: 'Roasted Almonds', brand: 'TastyBites', category: 'snacks-munchies', subcategory: 'Nuts', emoji: '🌰', color: 'from-amber-100 to-stone-100', unit: 'gm', variants: [['180 g', 'gm', 240, 199, 120], ['400 g', 'gm', 460, 389, 70]], shortDescription: 'Lightly salted roasted almonds.', description: 'Premium almonds roasted to perfection with a light salt. A healthy, protein-rich snack.', rating: 4.7, reviewCount: 264, newArrival: true, tags: ['almond', 'badam', 'nuts'] }),

  // ---------- Beverages ----------
  makeProduct({ id: 'p060', name: 'Orange Juice', brand: 'Sunshine', category: 'beverages', subcategory: 'Juices', emoji: '🍊', color: 'from-orange-100 to-amber-100', unit: 'L', variants: [['1 L', 'L', 110, 89, 160], ['500 ml', 'ml', 60, 49, 220]], shortDescription: '100% pulp-rich orange juice.', description: 'Refreshing orange juice made from real oranges, with no added colours.', rating: 4.5, reviewCount: 342, bestseller: true, tags: ['juice', 'orange', 'drink'] }),
  makeProduct({ id: 'p061', name: 'Lemon Soda', brand: 'FizzPop', category: 'beverages', subcategory: 'Soft Drinks', emoji: '🍋', color: 'from-lime-100 to-yellow-100', unit: 'ml', variants: [['750 ml', 'ml', 35, 29, 380]], shortDescription: 'Zesty fizzy lemon soda.', description: 'Zesty and fizzy lemon-flavoured carbonated drink, ice-cold refreshment.', rating: 4.2, reviewCount: 411, tags: ['soda', 'lemon', 'cold drink'] }),
  makeProduct({ id: 'p062', name: 'Green Tea Bags', brand: 'NutriWave', category: 'beverages', subcategory: 'Tea & Coffee', emoji: '🍵', color: 'from-green-100 to-teal-100', unit: 'box', variants: [['25 bags', 'pc', 95, 79, 140], ['50 bags', 'pc', 175, 145, 90]], shortDescription: 'Refreshing pure green tea.', description: 'Pure green tea bags with antioxidants. A refreshing cup any time of the day.', rating: 4.5, reviewCount: 289, newArrival: true, tags: ['green tea', 'tea', 'healthy'] }),
  makeProduct({ id: 'p063', name: 'Instant Coffee', brand: 'BeanBrew', category: 'beverages', subcategory: 'Tea & Coffee', emoji: '☕', color: 'from-stone-100 to-amber-100', unit: 'gm', variants: [['100 g', 'gm', 320, 269, 110]], shortDescription: 'Bold aromatic instant coffee.', description: 'Bold, aromatic instant coffee granules brewed from premium Arabica beans.', rating: 4.6, reviewCount: 376, featured: true, tags: ['coffee', 'instant', 'cafe'] }),
  makeProduct({ id: 'p064', name: 'Cold Brew Cola', brand: 'FizzPop', category: 'beverages', subcategory: 'Soft Drinks', emoji: '🥤', color: 'from-amber-100 to-rose-100', unit: 'ml', variants: [['330 ml', 'ml', 25, 20, 500], ['750 ml', 'ml', 45, 38, 340]], shortDescription: 'Classic cola, extra fizzy.', description: 'The classic cola taste with extra fizz. Serve chilled for the best experience.', rating: 4.3, reviewCount: 458, bestseller: true, tags: ['cola', 'cold drink', 'soda'] }),

  // ---------- Personal Care ----------
  makeProduct({ id: 'p080', name: 'Herbal Shampoo', brand: 'PureGlow', category: 'personal-care', subcategory: 'Hair Care', emoji: '🧴', color: 'from-violet-100 to-purple-100', unit: 'ml', variants: [['340 ml', 'ml', 185, 149, 90], ['650 ml', 'ml', 330, 269, 60]], shortDescription: 'Nourishing herbal shampoo.', description: 'Herbal shampoo with natural extracts that cleanses and nourishes hair without stripping moisture.', rating: 4.4, reviewCount: 387, tags: ['shampoo', 'hair', 'care'] }),
  makeProduct({ id: 'p081', name: 'Aloe Body Lotion', brand: 'PureGlow', category: 'personal-care', subcategory: 'Skin Care', emoji: '🧴', color: 'from-green-100 to-teal-100', unit: 'ml', variants: [['200 ml', 'ml', 150, 119, 110]], shortDescription: '24hr hydrating aloe body lotion.', description: 'Lightweight body lotion infused with aloe vera for all-day hydration and soft skin.', rating: 4.5, reviewCount: 233, newArrival: true, tags: ['lotion', 'skin', 'aloe'] }),
  makeProduct({ id: 'p082', name: 'Toothpaste Mint', brand: 'PureGlow', category: 'personal-care', subcategory: 'Oral Care', emoji: '🦷', color: 'from-sky-100 to-blue-100', unit: 'gm', variants: [['100 g', 'gm', 65, 55, 180]], shortDescription: 'Fluoride toothpaste with fresh mint.', description: 'Anti-cavity fluoride toothpaste with a fresh mint taste for complete protection.', rating: 4.5, reviewCount: 421, bestseller: true, tags: ['toothpaste', 'oral', 'mint'] }),
  makeProduct({ id: 'p083', name: 'Soap Bar Bath', brand: 'PureGlow', category: 'personal-care', subcategory: 'Bath', emoji: '🧼', color: 'from-rose-100 to-pink-100', unit: 'pack', variants: [['3 pack', 'pc', 80, 66, 300], ['6 pack', 'pc', 148, 122, 200]], shortDescription: 'Gentle moisturising soap bars.', description: 'Mild, moisturising soap bars that leave skin soft and delicately fragranced.', rating: 4.4, reviewCount: 339, tags: ['soap', 'bath', 'personal'] }),

  // ---------- Home & Cleaning ----------
  makeProduct({ id: 'p100', name: 'All-Purpose Cleaner', brand: 'SparkleCo', category: 'home-cleaning', subcategory: 'Surface Cleaners', emoji: '🧽', color: 'from-cyan-100 to-teal-100', unit: 'ml', variants: [['500 ml', 'ml', 95, 79, 90], ['1 L', 'L', 165, 139, 60]], shortDescription: 'Kills 99.9% germs on surfaces.', description: 'Powerful all-purpose cleaner for floors, tiles and surfaces. Fresh fragrance.', rating: 4.4, reviewCount: 287, tags: ['cleaner', 'cleaning', 'home'] }),
  makeProduct({ id: 'p101', name: 'Dishwash Liquid', brand: 'SparkleCo', category: 'home-cleaning', subcategory: 'Kitchen', emoji: '🍽️', color: 'from-amber-100 to-yellow-100', unit: 'ml', variants: [['500 ml', 'ml', 85, 72, 160], ['2 L', 'L', 280, 239, 70]], shortDescription: 'Cut & degrease tough dishes.', description: 'Concentrated dishwash gel that cuts through grease for sparkling clean dishes.', rating: 4.5, reviewCount: 402, bestseller: true, tags: ['dishwash', 'kitchen', 'cleaning'] }),
  makeProduct({ id: 'p102', name: 'Laundry Detergent Powder', brand: 'FreshWash', category: 'home-cleaning', subcategory: 'Laundry', emoji: '🧺', color: 'from-blue-100 to-indigo-100', unit: 'kg', variants: [['1 kg', 'kg', 95, 82, 130], ['2 kg', 'kg', 175, 149, 100]], shortDescription: 'Removes stains, brightens whites.', description: 'High-foam detergent powder with stain-removal boosters. Keeps colours bright.', rating: 4.3, reviewCount: 456, tags: ['detergent', 'laundry', 'wash'] }),

  // ---------- Baby Care ----------
  makeProduct({ id: 'p120', name: 'Baby Wipes', brand: 'TenderCare', category: 'baby-care', subcategory: 'Wipes', emoji: '👶', color: 'from-yellow-100 to-amber-100', unit: 'pack', variants: [['80 wipes', 'pc', 120, 96, 150], ['200 wipes', 'pc', 260, 219, 80]], shortDescription: 'Gentle alcohol-free baby wipes.', description: 'Soft, alcohol-free wipes enriched with aloe for your baby’s delicate skin.', rating: 4.6, reviewCount: 310, bestseller: true, tags: ['wipes', 'baby', 'care'] }),
  makeProduct({ id: 'p121', name: 'Baby Diaper Pants', brand: 'TenderCare', category: 'baby-care', subcategory: 'Diapers', emoji: '🧷', color: 'from-sky-100 to-blue-100', unit: 'pack', variants: [['M - 20', 'pc', 249, 209, 60], ['L - 18', 'pc', 279, 239, 55]], shortDescription: 'Ultra-soft leak-proof diapers.', description: 'Ultra-soft, breathable diaper pants with superior leak protection and all-night dryness.', rating: 4.6, reviewCount: 274, tags: ['diaper', 'baby', 'wets'] }),

  // ---------- Pet Care ----------
  makeProduct({ id: 'p140', name: 'Dog Food Chicken', brand: 'PawFeast', category: 'pet-care', subcategory: 'Dog Food', emoji: '🐶', color: 'from-orange-100 to-amber-100', unit: 'kg', variants: [['1 kg', 'kg', 420, 349, 45], ['3 kg', 'kg', 1150, 949, 25]], shortDescription: 'Complete nutrition for adult dogs.', description: 'Balanced chicken-flavoured dog food with essential vitamins for adult dogs.', rating: 4.5, reviewCount: 198, bestseller: true, tags: ['dog', 'pet', 'food'] }),
  makeProduct({ id: 'p141', name: 'Cat Food Special', brand: 'PawFeast', category: 'pet-care', subcategory: 'Cat Food', emoji: '🐱', color: 'from-violet-100 to-purple-100', unit: 'kg', variants: [['1.2 kg', 'kg', 520, 439, 40]], shortDescription: 'Tasty crunchy bites for cats.', description: 'Crunchy, tasty cat food bites packed with protein for healthy, active cats.', rating: 4.4, reviewCount: 143, tags: ['cat', 'pet', 'food'] }),

  // ---------- Bakery ----------
  makeProduct({ id: 'p160', name: 'Classic White Bread', brand: 'Bakehouse', category: 'bakery', subcategory: 'Breads', emoji: '🍞', color: 'from-amber-100 to-orange-100', unit: 'pack', variants: [['400 g', 'gm', 40, 34, 180]], shortDescription: 'Soft and fluffy sandwich bread.', description: 'Soft, fluffy white bread, perfect for toast and sandwiches. Baked fresh daily.', rating: 4.4, reviewCount: 512, bestseller: true, tags: ['bread', 'pav', 'bakery'] }),
  makeProduct({ id: 'p161', name: 'Whole Wheat Bread', brand: 'Bakehouse', category: 'bakery', subcategory: 'Breads', emoji: '🍞', color: 'from-stone-100 to-amber-100', unit: 'pack', variants: [['400 g', 'gm', 52, 44, 140]], shortDescription: '100% whole wheat bread.', description: 'Healthy whole-wheat bread made with real wheat flour and no maida.', rating: 4.5, reviewCount: 366, tags: ['bread', 'wheat', 'healthy'] }),
  makeProduct({ id: 'p162', name: 'Cup Cakes Pack', brand: 'Bakehouse', category: 'bakery', subcategory: 'Cakes', emoji: '🧁', color: 'from-pink-100 to-rose-100', unit: 'pack', variants: [['4 pack', 'pc', 99, 79, 80]], shortDescription: 'Four fluffy vanilla cupcakes.', description: 'Moist vanilla cupcakes topped with creamy frosting. A treat for every occasion.', rating: 4.6, reviewCount: 245, newArrival: true, tags: ['cake', 'cupcake', 'dessert'] }),

  // ---------- Meat & Seafood ----------
  makeProduct({ id: 'p180', name: 'Chicken Breast', brand: 'MeatHub', category: 'meat-seafood', subcategory: 'Chicken', emoji: '🍗', color: 'from-red-100 to-rose-100', unit: 'gm', variants: [['500 g', 'gm', 160, 139, 60], ['1 kg', 'kg', 310, 269, 35]], shortDescription: 'Boneless skinless chicken breast.', description: 'Fresh, hygienically-packed boneless chicken breast. High protein, low fat.', rating: 4.3, reviewCount: 321, tags: ['chicken', 'meat', 'protein'] }),
  makeProduct({ id: 'p181', name: 'River Fish Steaks', brand: 'SeaFresh', category: 'meat-seafood', subcategory: 'Fish', emoji: '🐟', color: 'from-cyan-100 to-blue-100', unit: 'gm', variants: [['250 g', 'gm', 130, 109, 40], ['500 g', 'gm', 250, 209, 25]], shortDescription: 'Fresh cut river fish steaks.', description: 'Fresh river fish steaks, cleaned and cut. Rich in omega-3 fatty acids.', rating: 4.2, reviewCount: 187, tags: ['fish', 'fish steaks', 'seafood'] }),

  // ---------- Stationery ----------
  makeProduct({ id: 'p200', name: 'Gel Pen Set', brand: 'WriteWell', category: 'stationery', subcategory: 'Pens', emoji: '🖊️', color: 'from-indigo-100 to-blue-100', unit: 'pack', variants: [['4 pack', 'pc', 60, 49, 120], ['10 pack', 'pc', 140, 119, 60]], shortDescription: 'Smooth-writing gel pens.', description: 'Set of smooth-writing gel pens with a comfortable grip. Ideal for school and office.', rating: 4.5, reviewCount: 210, tags: ['pen', 'stationery'] }),
  makeProduct({ id: 'p201', name: 'A4 Paper Ream', brand: 'WriteWell', category: 'stationery', subcategory: 'Paper', emoji: '📄', color: 'from-slate-100 to-gray-200', unit: 'ream', variants: [['500 sheets', 'pc', 260, 219, 50]], shortDescription: 'Bright white A4 printing paper.', description: 'High-quality 75 GSM A4 paper, ideal for printing and photocopying.', rating: 4.4, reviewCount: 156, tags: ['paper', 'a4', 'stationery'] }),

  // ---------- Household ----------
  makeProduct({ id: 'p220', name: 'Tissues Box', brand: 'SoftTouch', category: 'household', subcategory: 'Tissues', emoji: '🧻', color: 'from-sky-100 to-blue-100', unit: 'box', variants: [['100 sheets', 'pc', 70, 58, 160]], shortDescription: 'Soft 2-ply facial tissues.', description: 'Extra-soft 2-ply facial tissues for everyday use across the house.', rating: 4.3, reviewCount: 268, tags: ['tissue', 'household'] }),
  makeProduct({ id: 'p221', name: 'Garbage Bags', brand: 'SoftTouch', category: 'household', subcategory: 'Storage', emoji: '🗑️', color: 'from-slate-100 to-gray-200', unit: 'pack', variants: [['30 pack', 'pc', 90, 75, 110]], shortDescription: 'Strong 38L garbage bags.', description: 'Leak-proof, strong garbage bags for everyday household waste.', rating: 4.2, reviewCount: 143, tags: ['garbage', 'bags', 'household'] }),
];

export function getProduct(slugOrId) {
  return products.find((p) => p.slug === slugOrId || p.id === slugOrId);
}

export function getProductsByCategory(slug) {
  return products.filter((p) => p.category === slug);
}

export function getFeaturedProducts() {
  return products.filter((p) => p.featured);
}

export function getBestsellers() {
  return products.filter((p) => p.bestseller);
}

export function getNewArrivals() {
  return products.filter((p) => p.newArrival);
}

export function searchProducts(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return products.filter((p) =>
    [p.name, p.brand, p.category.replace(/-/g, ' '), p.subcategory, p.tags.join(' '), p.sku]
      .join(' ')
      .toLowerCase()
      .includes(q)
  );
}

export default products;