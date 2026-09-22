export const categories = [
  { id: 'cat-fv', name: 'Fruits & Vegetables', slug: 'fruits-vegetables', image: '/images/categories/fruits-vegetables.jpg', icon: 'Carrot', color: 'from-green-100 to-lime-100', productCount: 14 },
  { id: 'cat-db', name: 'Dairy & Breakfast', slug: 'dairy-breakfast', image: '/images/categories/dairy-breakfast.jpg', icon: 'Milk', color: 'from-sky-100 to-blue-100', productCount: 10 },
  { id: 'cat-sm', name: 'Snacks & Munchies', slug: 'snacks-munchies', image: '/images/categories/snacks-munchies.jpg', icon: 'Cookie', color: 'from-amber-100 to-orange-100', productCount: 9 },
  { id: 'cat-bv', name: 'Beverages', slug: 'beverages', image: '/images/categories/beverages.jpg', icon: 'Wine', color: 'from-violet-100 to-purple-100', productCount: 8 },
  { id: 'cat-pc', name: 'Personal Care', slug: 'personal-care', image: '/images/categories/personal-care.jpg', icon: 'Bath', color: 'from-rose-100 to-pink-100', productCount: 7 },
  { id: 'cat-hc', name: 'Home & Cleaning', slug: 'home-cleaning', image: '/images/categories/home-cleaning.jpg', icon: 'SprayCan', color: 'from-cyan-100 to-teal-100', productCount: 6 },
  { id: 'cat-bc', name: 'Baby Care', slug: 'baby-care', image: '/images/categories/baby-care.jpg', icon: 'Baby', color: 'from-yellow-100 to-amber-100', productCount: 5 },
  { id: 'cat-pet', name: 'Pet Care', slug: 'pet-care', image: '/images/categories/pet-care.jpg', icon: 'PawPrint', color: 'from-orange-100 to-amber-100', productCount: 3 },
  { id: 'cat-bk', name: 'Bakery', slug: 'bakery', image: '/images/categories/bakery.jpg', icon: 'Croissant', color: 'from-amber-100 to-yellow-100', productCount: 6 },
  { id: 'cat-ms', name: 'Meat & Seafood', slug: 'meat-seafood', image: '/images/categories/meat-seafood.jpg', icon: 'Fish', color: 'from-red-100 to-rose-100', productCount: 5 },
  { id: 'cat-st', name: 'Stationery', slug: 'stationery', image: '/images/categories/stationery.jpg', icon: 'PenTool', color: 'from-indigo-100 to-blue-100', productCount: 3 },
  { id: 'cat-hh', name: 'Household', slug: 'household', image: '/images/categories/household.jpg', icon: 'Shirt', color: 'from-slate-100 to-gray-200', productCount: 5 },
];

export function getCategory(slug) {
  return categories.find((c) => c.slug === slug);
}

export default categories;