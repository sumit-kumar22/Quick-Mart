import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { AppError, asyncHandler, ok, parsePagination } from '../utils/response.js';

const sortMap = {
  'price-asc': { sellingPrice: 1 },
  'price-desc': { sellingPrice: -1 },
  discount: { discount: -1 },
  rating: { rating: -1 },
  newest: { createdAt: -1 },
  relevance: { bestseller: -1, createdAt: -1 },
};

function withId(doc) {
  if (!doc) return doc;
  const has = Object.prototype.hasOwnProperty.call(doc, 'id');
  return has ? doc : { ...doc, id: doc._id };
}

function buildProductFilter(query) {
  const filter = { active: true };
  const { category, search, featured, bestseller, newArrival, filters = {} } = query;

  if (category) filter.category = category;
  if (featured) filter.featured = true;
  if (bestseller) filter.bestseller = true;
  if (newArrival) filter.newArrival = true;

  if (search) filter.$or = [
    { name: { $regex: String(search), $options: 'i' } },
    { brand: { $regex: String(search), $options: 'i' } },
    { subcategory: { $regex: String(search), $options: 'i' } },
    { tags: { $regex: String(search), $options: 'i' } },
  ];

  const f = typeof filters === 'string' ? JSON.parse(filters) : filters;
  if (f) {
    if (f.priceMin != null) filter.sellingPrice = { ...(filter.sellingPrice || {}), $gte: Number(f.priceMin) };
    if (f.priceMax != null) filter.sellingPrice = { ...(filter.sellingPrice || {}), $lte: Number(f.priceMax) };
    if (f.brands && Array.isArray(f.brands) && f.brands.length) filter.brand = { $in: f.brands };
    if (f.maxDiscount != null) filter.discount = { $gte: Number(f.maxDiscount) };
    if (f.rating != null) filter.rating = { $gte: Number(f.rating) };
    if (f.inStock) filter.stock = { $gt: 0 };
  }
  return filter;
}

export const getProducts = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const filter = buildProductFilter(req.query);
  const sort = sortMap[req.query.sort] || sortMap.relevance;

  const [rows, total] = await Promise.all([
    repo.findMany(COLLECTIONS.PRODUCTS, filter, { sort, skip: (page - 1) * limit, limit }),
    repo.count(COLLECTIONS.PRODUCTS, filter),
  ]);
  return ok(res, rows.map(withId), {
    message: 'Products fetched successfully',
    meta: { page, limit, total },
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const key = req.params.id;
  const product = await repo.findOne(COLLECTIONS.PRODUCTS, { active: true, $or: [{ _id: key }, { slug: key }] });
  if (!product) throw new AppError('Product not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, withId(product), { message: 'Product fetched successfully' });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await repo.findById(COLLECTIONS.PRODUCTS, req.params.id);
  if (!product) throw new AppError('Product not found', { status: 404, code: 'NOT_FOUND' });
  const related = await repo.findMany(
    COLLECTIONS.PRODUCTS,
    { active: true, category: product.category, _id: { $ne: product._id } },
    { sort: { bestseller: -1 }, limit: 8 }
  );
  return ok(res, related.map(withId), { message: 'Related products fetched' });
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await repo.findMany(COLLECTIONS.REVIEWS, { productId: req.params.id }, { sort: { createdAt: -1 } });
  return ok(res, reviews, { message: 'Reviews fetched' });
});

export const getSearchSuggestions = asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  const filter = {
    active: true,
    ...(q ? { $or: [{ name: { $regex: q, $options: 'i' } }, { brand: { $regex: q, $options: 'i' } }, { tags: { $regex: q, $options: 'i' } }] } : { bestseller: true }),
  };
  const rows = await repo.findMany(COLLECTIONS.PRODUCTS, filter, { sort: { bestseller: -1 }, limit: 6 });
  return ok(res, rows.map((p) => ({ id: p._id, name: p.name, emoji: p.emoji || '📦', price: p.sellingPrice })), { message: 'Suggestions fetched' });
});

export const getCategories = asyncHandler(async (req, res) => {
  const cats = await repo.findMany(COLLECTIONS.CATEGORIES, { active: true }, { sort: { name: 1 } });
  return ok(res, cats.map(withId), { message: 'Categories fetched' });
});

export const getCategory = asyncHandler(async (req, res) => {
  const cat = await repo.findById(COLLECTIONS.CATEGORIES, req.params.id);
  if (!cat) throw new AppError('Category not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, withId(cat), { message: 'Category fetched' });
});

const storePublic = (s) => {
  const { adminId, ...rest } = s;
  return rest;
};

export const getStores = asyncHandler(async (_req, res) => {
  const stores = await repo.findMany(COLLECTIONS.STORES, { status: 'active' }, { sort: { name: 1 } });
  return ok(res, stores.map(storePublic), { message: 'Stores fetched' });
});

export const getStore = asyncHandler(async (req, res) => {
  const store = await repo.findById(COLLECTIONS.STORES, req.params.id);
  if (!store) throw new AppError('Store not found', { status: 404, code: 'NOT_FOUND' });
  return ok(res, storePublic(store), { message: 'Store fetched' });
});

export const getBanners = asyncHandler(async (_req, res) => {
  const banners = await repo.findMany(COLLECTIONS.BANNERS, { active: true, type: 'main' }, { sort: { position: 1 } });
  return ok(res, banners.map(withId), { message: 'Banners fetched' });
});

export const getFreshnessBanners = asyncHandler(async (_req, res) => {
  const banners = await repo.findMany(COLLECTIONS.BANNERS, { active: true, type: 'freshness' }, { sort: { position: 1 } });
  return ok(res, banners.map(withId), { message: 'Freshness banners fetched' });
});

export const getOffers = asyncHandler(async (_req, res) => {
  const offers = await repo.findMany(COLLECTIONS.OFFERS, { active: true });
  return ok(res, offers, { message: 'Offers fetched' });
});

const catalogController = {
  getProducts, getProduct, getRelatedProducts, getProductReviews, getSearchSuggestions,
  getCategories, getCategory, getStores, getStore, getBanners, getFreshnessBanners, getOffers,
};
export default catalogController;