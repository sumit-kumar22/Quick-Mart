import mongoose from 'mongoose';
import { env } from './env.js';
import { setEngine, engineName } from '../data-access/repo.js';

export const dbState = {
  engine: 'memory',
  connected: false,
  reason: 'not connected yet',
};

export async function connectDb() {
  if (env.dbEngine === 'mongo') {
    await connectMongo(true);
    return;
  }
  if (env.dbEngine === 'memory') {
    useMemory('DB_ENGINE=memory configured');
    return;
  }
  // auto
  try {
    await connectMongo(false);
  } catch (err) {
    dbState.reason = err.message;
  }
  if (!dbState.connected) useMemory(dbState.reason);
}

async function connectMongo(required) {
  if (!env.mongoUri) {
    return fail(required, 'MONGODB_URI is not set');
  }
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    dbState.engine = 'mongo';
    dbState.connected = true;
    dbState.reason = 'MongoDB connected';
    setEngine('mongo');
    console.log(`[db] ${dbState.reason} (${env.mongoUri.split('@')[1] || env.mongoUri})`);
  } catch (err) {
    return fail(required, `MongoDB connection failed: ${err.message}`);
  }
}

function useMemory(reason) {
  dbState.engine = 'memory';
  dbState.connected = true;
  dbState.reason = `In-memory store active (${reason || 'fallback'})`;
  setEngine('memory');
  console.warn(`[db] ${dbState.reason}`);
}

function fail(required, reason) {
  dbState.reason = reason;
  if (required) {
    console.error(`[db] ${reason}`);
    process.exit(1);
  }
  console.warn(`[db] ${reason} -> ${engineName()}`);
}

export async function disconnectDb() {
  if (mongoose.connection.readyState === 1) await mongoose.disconnect();
}

export default connectDb;