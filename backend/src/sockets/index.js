import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';

let io = null;
const partnerSockets = new Map(); // partnerId -> socket.id

export function setupSocketIO(server) {
  io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      socket.userId = payload.sub;
      socket.role = payload.role;
      return next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  // Authorize the connection against the live DB (not the possibly-stale JWT).
  io.use(async (socket, next) => {
    try {
      const user = await repo.findById(COLLECTIONS.USERS, socket.userId);
      if (!user || user.status !== 'ACTIVE') return next(new Error('Unauthorized'));
      socket.dbRole = user.role;
      socket.dbUser = user;
      return next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const { userId } = socket;
    const role = socket.dbRole || socket.role;
    socket.join(`user:${userId}`);
    if (role) socket.join(`role:${role}`);

    // Delivery partner presence + live location streaming
    if (role === 'DELIVERY_PARTNER') {
      const partner = await repo.findOne(COLLECTIONS.DELIVERY_PARTNERS, { userId });
      if (partner) {
        partnerSockets.set(partner._id, socket.id);
        await repo.updateById(COLLECTIONS.DELIVERY_PARTNERS, partner._id, { $set: { online: true } });
      }
      socket.on('delivery:location', async ({ orderId, latitude, longitude }) => {
        const order = orderId ? await repo.findById(COLLECTIONS.ORDERS, orderId) : null;
        // Scope: a partner may stream location only for an order actually assigned to them.
        const assigned = order && order.deliveryPartnerId && String(order.deliveryPartnerId) === String(partner?._id);
        if (!assigned) return;
        const payload = { orderId, latitude, longitude, partnerId: partner?._id, partnerName: partner?.name, at: new Date().toISOString() };
        if (order.userId) io.to(`user:${order.userId}`).emit('delivery:location', payload);
        io.to(`role:ADMIN`).emit('delivery:location', payload);
        if (order.storeId) io.to(`store:${order.storeId}`).emit('delivery:location', payload);
      });
      socket.on('disconnect', async () => {
        if (partner) {
          partnerSockets.delete(partner._id);
          await repo.updateById(COLLECTIONS.DELIVERY_PARTNERS, partner._id, { $set: { online: false } });
        }
      });
      io.to(`role:ADMIN`).emit('delivery:partner_status', { partnerId: partner?._id, online: true });
    }

    socket.emit('connected', { ok: true, userId, role });
  });

  console.log('[socket] Socket.IO ready');
  return io;
}

export function emitAll(event, payload) {
  if (io) io.emit(event, payload);
}

export function emitUser(event, payload, userId) {
  if (io && userId) io.to(`user:${userId}`).emit(event, payload);
}

export function emitRole(event, payload, role) {
  if (io && role) io.to(`role:${role}`).emit(event, payload);
}

export function getIO() {
  return io;
}

const sockets = { setupSocketIO, emitAll, emitUser, emitRole, getIO, partnerSockets };
export default sockets;