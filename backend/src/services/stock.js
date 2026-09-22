import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { AppError } from '../utils/response.js';

async function productStoreStock(product, storeId) {
  if (!product) return 0;
  const stock = product.storeStock?.[storeId];
  return typeof stock === 'number' ? stock : product.stock || 0;
}

/**
 * Checks that each requested quantity is available in the given store.
 * Returns the list of unavailable items, or throws when `throwErr` is true.
 */
export async function validateStock(storeId, items, { throwErr = true } = {}) {
  const unavailable = [];
  for (const it of items || []) {
    const product = await repo.findById(COLLECTIONS.PRODUCTS, it.productId);
    if (!product) {
      unavailable.push({ productId: it.productId, name: 'Unknown product', requested: it.quantity, available: 0 });
      continue;
    }
    const inv = await repo.findOne(COLLECTIONS.INVENTORY, { storeId, productId: it.productId });
    const available = inv ? inv.stock : await productStoreStock(product, storeId);
    if (it.quantity > available) {
      unavailable.push({ productId: it.productId, name: product.name, requested: it.quantity, available });
    }
  }
  if (unavailable.length && throwErr) {
    throw new AppError('Some items are out of stock', {
      status: 409,
      code: 'INSUFFICIENT_STOCK',
      details: unavailable,
    });
  }
  return unavailable;
}

/** Decrement inventory safely for all items. Call validateStock first. */
export async function reserveItems(storeId, items) {
  for (const it of items || []) {
    const dec = { $inc: { stock: -it.quantity } };
    await repo.updateOne(COLLECTIONS.INVENTORY, { storeId, productId: it.productId }, dec);
    await repo.updateOne(
      COLLECTIONS.PRODUCTS,
      { _id: it.productId },
      { $inc: { stock: -it.quantity, [`storeStock.${storeId}`]: -it.quantity } }
    );
  }
}

/** Add stock back when an order is cancelled or fails. */
export async function releaseItems(storeId, items) {
  for (const it of items || []) {
    const inc = { $inc: { stock: it.quantity } };
    await repo.updateOne(COLLECTIONS.INVENTORY, { storeId, productId: it.productId }, inc);
    await repo.updateOne(
      COLLECTIONS.PRODUCTS,
      { _id: it.productId },
      { $inc: { stock: it.quantity, [`storeStock.${storeId}`]: it.quantity } }
    );
  }
}

const stock = { validateStock, reserveItems, releaseItems };
export default stock;