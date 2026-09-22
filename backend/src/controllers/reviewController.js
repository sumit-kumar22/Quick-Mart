import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { AppError, asyncHandler, ok } from '../utils/response.js';
import { id } from '../utils/ids.js';

export const addReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment } = req.body;
  if (!productId || !rating || rating < 1 || rating > 5) throw new AppError('Valid productId and rating (1-5) are required', { code: 'VALIDATION_ERROR' });
  const product = await repo.findById(COLLECTIONS.PRODUCTS, productId);
  if (!product) throw new AppError('Product not found', { status: 404, code: 'NOT_FOUND' });

  const existing = await repo.findOne(COLLECTIONS.REVIEWS, { productId, userId: req.user._id });
  if (existing) {
    const updated = await repo.updateById(COLLECTIONS.REVIEWS, existing._id, { $set: { rating: Number(rating), title: title || existing.title, comment: comment || existing.comment } });
    return ok(res, updated, { message: 'Review updated' });
  }

  const purchased = await repo.findOne(COLLECTIONS.ORDERS, { userId: req.user._id, 'items.productId': productId });
  const review = await repo.insertOne(COLLECTIONS.REVIEWS, {
    _id: id('rev'),
    productId,
    userId: req.user._id,
    userName: req.user.name,
    rating: Number(rating),
    title: title || '',
    comment: comment || '',
    helpfulCount: 0,
    verified: Boolean(purchased),
  });

  const newCount = (product.reviewCount || 0) + 1;
  const newRating = Math.round(((product.rating || 0) * (product.reviewCount || 0) + Number(rating)) / newCount * 10) / 10;
  await repo.updateById(COLLECTIONS.PRODUCTS, productId, { $set: { reviewCount: newCount, rating: newRating } });
  return ok(res, review, { message: 'Review added successfully', status: 201 });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await repo.findById(COLLECTIONS.REVIEWS, req.params.id);
  if (!review) throw new AppError('Review not found', { status: 404, code: 'NOT_FOUND' });
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
  if (review.userId !== req.user._id && !isAdmin) throw new AppError('Not authorized', { status: 403, code: 'FORBIDDEN' });
  await repo.deleteById(COLLECTIONS.REVIEWS, review._id);
  return ok(res, { deleted: true }, { message: 'Review deleted' });
});

export const getAdminReviews = asyncHandler(async (_req, res) => {
  const reviews = await repo.findMany(COLLECTIONS.REVIEWS, {}, { sort: { createdAt: -1 } });
  return ok(res, reviews, { message: 'Reviews fetched' });
});

const reviewController = { addReview, deleteReview, getAdminReviews };
export default reviewController;