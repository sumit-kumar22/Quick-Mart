export class AppError extends Error {
  constructor(message, { status = 400, code = 'BAD_REQUEST', details = null, errors = null } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.errors = errors;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Standard success payload per PRD §51.
 * {
 *   success: true,
 *   message,
 *   data,
 *   meta: { page, limit, total }
 * }
 */
export function ok(res, data = null, { message = 'OK', meta = null, status = 200 } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export const PAGE_DEFAULTS = { page: 1, limit: 20, maxLimit: 100 };

export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(PAGE_DEFAULTS.maxLimit, Math.max(1, parseInt(query.limit, 10) || PAGE_DEFAULTS.limit));
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Pick only allow-listed scalar fields from an update body so admin patches
 * can never overwrite system fields (_id, role, passwordHash, etc.).
 */
export function pickPatch(allow, body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const patch = {};
  for (const key of allow) {
    if (key in body) patch[key] = body[key];
  }
  return patch;
}