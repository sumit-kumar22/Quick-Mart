import { repo } from '../data-access/repo.js';
import { COLLECTIONS } from '../config/constants.js';
import { id } from '../utils/ids.js';

export async function audit(req, { action, entity, entityId, details }) {
  try {
    const actor = req.user || null;
    const entry = {
      _id: id('aud'),
      action,
      actorId: actor?._id || null,
      actorName: actor?.name || null,
      actorRole: actor?.role || 'anonymous',
      entity,
      entityId,
      details: details || {},
      ip: req.ip || req.headers['x-forwarded-for'] || '',
    };
    await repo.insertOne(COLLECTIONS.AUDIT_LOGS, entry);
  } catch (err) {
    console.warn('[audit] failed to write log', err.message);
  }
}

export default audit;