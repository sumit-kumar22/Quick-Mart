import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const bool = (v, def = false) => (v === undefined || v === '' ? def : String(v).toLowerCase() === 'true');
const num = (v, def) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? def : Number(v));

const isProd = (process.env.NODE_ENV || 'development') === 'production';
const jwtSecret = process.env.JWT_SECRET || 'insecure_dev_secret_change_me';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'insecure_dev_refresh_secret_change_me';

if (isProd && (jwtSecret.length < 32 || jwtRefreshSecret.length < 32 || jwtSecret.startsWith('insecure_dev') || jwtRefreshSecret.startsWith('insecure_dev'))) {
  throw new Error('Refusing to start in production: JWT_SECRET / JWT_REFRESH_SECRET must be strong random values (>=32 chars).');
}
if (isProd && process.env.PAYMENTS_MOCK_ENABLED === 'true') {
  throw new Error('Refusing to start in production: PAYMENTS_MOCK_ENABLED must not be true.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  port: num(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apiPrefix: '/api/v1',

  dbEngine: (process.env.DB_ENGINE || 'auto').toLowerCase(),
  mongoUri: process.env.MONGODB_URI || '',
  seedOnStart: bool(process.env.SEED_ON_START, true),

  jwtSecret,
  jwtRefreshSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  redisUrl: process.env.REDIS_URL || '',

  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  // Mock payment driver is a development aid. It is never allowed in production.
  paymentsMockEnabled: !(process.env.NODE_ENV === 'production') && bool(process.env.PAYMENTS_MOCK_ENABLED, true),

  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',

  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: num(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  mailFrom: process.env.MAIL_FROM || 'QuickMart <no-reply@quickmart.co>',

  deliveryFee: num(process.env.DELIVERY_FEE, 39),
  freeDeliveryThreshold: num(process.env.FREE_DELIVERY_THRESHOLD, 499),
  defaultRadiusKm: num(process.env.DEFAULT_DELIVERY_RADIUS_KM, 8),
};

export default env;
