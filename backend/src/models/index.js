import mongoose from 'mongoose';
import { COLLECTIONS } from '../config/constants.js';

const { Schema } = mongoose;

// All models use String `_id` so the in-memory engine and MongoDB produce
// byte-identical documents for every collection.
const id = { type: String, required: true };

const addressSchema = new Schema(
  {
    id: id,
    label: { type: String, default: 'Home' },
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    landmark: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const schemas = {
  [COLLECTIONS.USERS]: new Schema(
    {
      _id: id,
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, trim: true },
      passwordHash: { type: String },
      role: { type: String, default: 'CUSTOMER' },
      roles: { type: [String], default: ['CUSTOMER'] },
      permissions: { type: [String], default: [] },
      status: { type: String, enum: ['active', 'suspended', 'blocked'], default: 'active' },
      avatar: { type: String, default: null },
      addresses: { type: [addressSchema], default: [] },
      wishlist: { type: [String], default: [] },
      coupons: { type: [String], default: [] },
      notificationPrefs: { type: Schema.Types.Mixed, default: {} },
      passwordResetToken: { type: String, default: null },
      passwordResetExpires: { type: String, default: null },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.STORES]: new Schema(
    {
      _id: id,
      name: { type: String, required: true },
      code: { type: String, required: true },
      address: { type: String, default: '' },
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
      phone: { type: String, default: '' },
      manager: { type: String, default: '' },
      openingTime: { type: String, default: '06:00' },
      closingTime: { type: String, default: '23:00' },
      deliveryRadius: { type: Number, default: 5 },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      inventoryCount: { type: Number, default: 0 },
      ordersToday: { type: Number, default: 0 },
      deliveryPartners: { type: Number, default: 0 },
      rating: { type: Number, default: 4.5 },
      adminId: { type: String, default: null },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.CATEGORIES]: new Schema(
    {
      _id: id,
      name: { type: String, required: true },
      slug: { type: String, required: true },
      icon: { type: String, default: 'Carrot' },
      color: { type: String, default: 'from-green-100 to-lime-100' },
      image: { type: String, default: '' },
      productCount: { type: Number, default: 0 },
      subcategories: { type: [String], default: [] },
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.PRODUCTS]: new Schema(
    {
      _id: id,
      sku: { type: String, default: '' },
      name: { type: String, required: true },
      slug: { type: String, required: true },
      brand: { type: String, default: '' },
      category: { type: String, required: true },
      subcategory: { type: String, default: '' },
      emoji: { type: String, default: '📦' },
      color: { type: String, default: 'from-slate-100 to-slate-200' },
      image: { type: String, default: '' },
      unit: { type: String, default: '' },
      weight: { type: String, default: '' },
      variants: { type: Schema.Types.Mixed, default: [] },
      mrp: { type: Number, default: 0 },
      sellingPrice: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 5 },
      stock: { type: Number, default: 0 },
      usesVariants: { type: Boolean, default: true },
      minQty: { type: Number, default: 1 },
      maxQty: { type: Number, default: 12 },
      shortDescription: { type: String, default: '' },
      description: { type: String, default: '' },
      tags: { type: [String], default: [] },
      images: { type: [String], default: [] },
      featured: { type: Boolean, default: false },
      bestseller: { type: Boolean, default: false },
      newArrival: { type: Boolean, default: false },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      deliveryEligible: { type: Boolean, default: true },
      active: { type: Boolean, default: true },
      storeStock: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.INVENTORY]: new Schema(
    {
      _id: id,
      storeId: { type: String, required: true },
      productId: { type: String, required: true },
      variantId: { type: String, default: null },
      name: { type: String, default: '' },
      emoji: { type: String, default: '' },
      unit: { type: String, default: '' },
      mrp: { type: Number, default: 0 },
      price: { type: Number, default: 0 },
      stock: { type: Number, default: 0 },
      reorderLevel: { type: Number, default: 10 },
      status: { type: String, enum: ['in_stock', 'low_stock', 'out_of_stock'], default: 'in_stock' },
      updatedAt: { type: String, default: () => new Date().toISOString() },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.CARTS]: new Schema(
    {
      _id: id,
      userId: { type: String, required: true },
      storeId: { type: String, default: null },
      items: { type: Schema.Types.Mixed, default: [] },
      couponCode: { type: String, default: null },
      couponName: { type: String, default: null },
      couponDiscount: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.WISHLISTS]: new Schema(
    {
      _id: id,
      userId: { type: String, required: true },
      items: { type: [String], default: [] },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.ORDERS]: new Schema(
    {
      _id: id,
      orderId: { type: String },
      userId: { type: String, required: true },
      userName: { type: String, default: '' },
      userPhone: { type: String, default: '' },
      storeId: { type: String, default: '' },
      storeName: { type: String, default: '' },
      items: { type: Schema.Types.Mixed, default: [] },
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      couponCode: { type: String, default: null },
      deliveryFee: { type: Number, default: 0 },
      tax: { type: Number, default: 5 },
      taxAmount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      paymentMethod: { type: String, default: 'COD' },
      paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded_or_cancelled'], default: 'pending' },
      paymentId: { type: String, default: null },
      status: { type: String, default: 'PENDING' },
      etd: { type: String, default: '35-40 min' },
      otp: { type: String, default: null },
      deliveryPartnerId: { type: String, default: null },
      deliveryPartnerName: { type: String, default: null },
      otpVerifiedAt: { type: String, default: null },
      address: { type: Schema.Types.Mixed, default: {} },
      deliveryLocation: { type: Schema.Types.Mixed, default: null },
      statusTimeline: { type: Schema.Types.Mixed, default: [] },
      cancelReason: { type: String, default: null },
      cancelledBy: { type: String, default: null },
      rating: { type: Number, default: null },
      reviewId: { type: String, default: null },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.PAYMENTS]: new Schema(
    {
      _id: id,
      orderId: { type: String, default: null },
      userId: { type: String, required: true },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      method: { type: String, enum: ['COD', 'UPI', 'CARD', 'NETBANKING', 'RAZORPAY', 'STRIPE', 'WALLET'], default: 'RAZORPAY' },
      provider: { type: String, default: 'mock' },
      status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
      gatewayOrderId: { type: String, default: null },
      gatewayPaymentId: { type: String, default: null },
      signature: { type: String, default: null },
      transactionId: { type: String, default: null },
      refundId: { type: String, default: null },
      metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.DELIVERY_PARTNERS]: new Schema(
    {
      _id: id,
      userId: { type: String, default: null },
      name: { type: String, required: true },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      vehicle: { type: String, default: '' },
      vehicleNumber: { type: String, default: '' },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      online: { type: Boolean, default: false },
      rating: { type: Number, default: 5 },
      completed: { type: Number, default: 0 },
      earnings: { type: Number, default: 0 },
      storeId: { type: String, default: null },
      currentOrder: { type: String, default: null },
      joinedAt: { type: String, default: null },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.COUPONS]: new Schema(
    {
      _id: id,
      code: { type: String, required: true, uppercase: true },
      description: { type: String, default: '' },
      type: { type: String, enum: ['flat', 'percentage', 'free_delivery'], default: 'flat' },
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      minCartValue: { type: Number, default: 0 },
      maxDiscount: { type: Number, default: null },
      startDate: { type: String, default: '' },
      endDate: { type: String, default: '' },
      usageLimit: { type: Number, default: 0 },
      perUserLimit: { type: Number, default: 1 },
      usedCount: { type: Number, default: 0 },
      applicableCategories: { type: [String], default: [] },
      applicableProducts: { type: [String], default: [] },
      stores: { type: [String], default: [] },
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.OFFERS]: new Schema(
    {
      _id: id,
      title: { type: String, required: true },
      description: { type: String, default: '' },
      tag: { type: String, default: '' },
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.REVIEWS]: new Schema(
    {
      _id: id,
      productId: { type: String, required: true },
      userId: { type: String, required: true },
      userName: { type: String, default: '' },
      rating: { type: Number, required: true, min: 1, max: 5 },
      title: { type: String, default: '' },
      comment: { type: String, default: '' },
      helpfulCount: { type: Number, default: 0 },
      verified: { type: Boolean, default: true },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.NOTIFICATIONS]: new Schema(
    {
      _id: id,
      userId: { type: String, default: null },
      title: { type: String, default: '' },
      message: { type: String, default: '' },
      type: { type: String, default: 'info' },
      read: { type: Boolean, default: false },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.SUPPORT_TICKETS]: new Schema(
    {
      _id: id,
      userId: { type: String, required: true },
      subject: { type: String, default: '' },
      message: { type: String, default: '' },
      orderId: { type: String, default: null },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      status: { type: String, enum: ['open', 'pending', 'resolved', 'closed'], default: 'open' },
      category: { type: String, default: 'general' },
      replies: { type: Schema.Types.Mixed, default: [] },
      attachments: { type: [String], default: [] },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.BANNERS]: new Schema(
    {
      _id: id,
      title: { type: String, required: true },
      subtitle: { type: String, default: '' },
      image: { type: String, default: null },
      imageUrl: { type: String, default: '' },
      emoji: { type: String, default: '' },
      color: { type: String, default: '' },
      link: { type: String, default: '' },
      type: { type: String, enum: ['main', 'freshness'], default: 'main' },
      active: { type: Boolean, default: true },
      position: { type: Number, default: 0 },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.SETTINGS]: new Schema(
    {
      _id: id,
      storeName: { type: String, default: 'QuickMart' },
      deliveryFee: { type: Number, default: 39 },
      freeDeliveryThreshold: { type: Number, default: 499 },
      defaultRadiusKm: { type: Number, default: 8 },
      support: { type: Schema.Types.Mixed, default: {} },
      social: { type: Schema.Types.Mixed, default: {} },
      maintenanceMode: { type: Boolean, default: false },
      security: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
  ),

  [COLLECTIONS.AUDIT_LOGS]: new Schema(
    {
      _id: id,
      action: { type: String, required: true },
      actorId: { type: String, default: null },
      actorName: { type: String, default: null },
      actorRole: { type: String, default: null },
      entity: { type: String, default: null },
      entityId: { type: String, default: null },
      details: { type: Schema.Types.Mixed, default: {} },
      ip: { type: String, default: '' },
    },
    { timestamps: true }
  ),
};

export const models = {};
for (const [name, schema] of Object.entries(schemas)) {
  models[name] = mongoose.models[name] || mongoose.model(name, schema, name);
}

export default models;