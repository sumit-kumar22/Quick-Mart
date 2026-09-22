import { nanoid } from 'nanoid';

/**
 * Minimal in-memory document store that emulates the subset of MongoDB
 * query behaviour used across the QuickMart API. It lets the backend run
 * without a MongoDB instance while keeping the exact same repository API.
 */
const collections = new Map();

function getCollection(name) {
  if (!collections.has(name)) collections.set(name, []);
  return collections.get(name);
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function looseEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function matchOperator(value, op, expected) {
  switch (op) {
    case '$eq': return looseEqual(value, expected);
    case '$ne': return !looseEqual(value, expected);
    case '$in': return Array.isArray(expected) && expected.some((e) => looseEqual(value, e));
    case '$nin': return Array.isArray(expected) && !expected.some((e) => looseEqual(value, e));
    case '$gt': return value != null && value > expected;
    case '$gte': return value != null && value >= expected;
    case '$lt': return value != null && value < expected;
    case '$lte': return value != null && value <= expected;
    case '$exists': return expected ? value !== undefined : value === undefined;
    case '$regex': {
      if (value == null) return false;
      const re = expected instanceof RegExp ? expected : new RegExp(expected, 'i');
      return re.test(String(value));
    }
    case '$size': return Array.isArray(value) && value.length === expected;
    case '$all': return Array.isArray(value) && Array.isArray(expected) && expected.every((e) => value.some((v) => looseEqual(v, e)));
    case '$elemMatch': return Array.isArray(value) && value.some((v) => matchCondition(v, expected));
    default: return true;
  }
}

function matchCondition(value, condition) {
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    const keys = Object.keys(condition);
    if (keys.some((k) => k.startsWith('$'))) {
      return keys.every((k) => matchOperator(value, k, condition[k]));
    }
    return keys.every((k) => matchCondition(value?.[k], condition[k]));
  }
  if (Array.isArray(value)) return value.some((v) => looseEqual(v, condition));
  return looseEqual(value, condition);
}

export function matches(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;
  return Object.keys(filter).every((key) => {
    if (key === '$and') return filter[key].every((f) => matches(doc, f));
    if (key === '$or') return filter[key].some((f) => matches(doc, f));
    if (key === '$nor') return !filter[key].some((f) => matches(doc, f));
    if (key === '$not') return !matches(doc, filter[key]);
    return matchCondition(getPath(doc, key), filter[key]);
  });
}

function applyProjection(doc, projection) {
  if (!projection || Object.keys(projection).length === 0) return doc;
  const keys = Object.keys(projection);
  const inclusive = keys.some((k) => projection[k] === 1 || projection[k] === true);
  if (inclusive) {
    const out = {};
    for (const k of keys) if (projection[k] === 1 || projection[k] === true) setPath(out, k, getPath(doc, k));
    if (projection._id !== 0 && projection._id !== false) out._id = doc._id;
    return out;
  }
  const out = structuredClone(doc);
  for (const k of keys) if (projection[k] === 0 || projection[k] === false) {
    const parts = k.split('.');
    let cur = out;
    for (let i = 0; i < parts.length - 1 && cur; i += 1) cur = cur[parts[i]];
    if (cur) delete cur[parts[parts.length - 1]];
  }
  return out;
}

function sortDocs(docs, sort) {
  if (!sort) return docs;
  const entries = Array.isArray(sort) ? sort : Object.entries(sort);
  return [...docs].sort((a, b) => {
    for (const [field, dir] of entries) {
      const av = getPath(a, field);
      const bv = getPath(b, field);
      if (av === bv) continue;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av > bv ? 1 : -1;
      return dir < 0 ? -cmp : cmp;
    }
    return 0;
  });
}

function applyUpdate(doc, update) {
  const operatorKeys = Object.keys(update || {}).filter((k) => k.startsWith('$'));
  if (operatorKeys.length === 0) {
    Object.assign(doc, update);
    return;
  }
  if (update.$set) for (const [k, v] of Object.entries(update.$set)) setPath(doc, k, v);
  if (update.$setOnInsert) {
    for (const [k, v] of Object.entries(update.$setOnInsert)) {
      if (getPath(doc, k) === undefined) setPath(doc, k, v);
    }
  }
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) setPath(doc, k, (getPath(doc, k) || 0) + v);
  }
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      if (!Array.isArray(getPath(doc, k))) setPath(doc, k, []);
      getPath(doc, k).push(v);
    }
  }
  if (update.$addToSet) {
    for (const [k, v] of Object.entries(update.$addToSet)) {
      if (!Array.isArray(getPath(doc, k))) setPath(doc, k, []);
      const arr = getPath(doc, k);
      if (!arr.some((x) => JSON.stringify(x) === JSON.stringify(v))) arr.push(v);
    }
  }
  if (update.$pull) {
    for (const [k, v] of Object.entries(update.$pull)) {
      const arr = getPath(doc, k);
      if (Array.isArray(arr)) {
        const next = arr.filter((x) => !matches(x, typeof v === 'object' && !Array.isArray(v) ? v : { $eq: v }));
        setPath(doc, k, next);
      }
    }
  }
}

export const memory = {
  name: 'memory',

  reset() {
    collections.clear();
  },

  raw(name) {
    return getCollection(name);
  },

  async findMany(name, filter = {}, opts = {}) {
    const { sort, skip = 0, limit, projection } = opts;
    let docs = getCollection(name).filter((d) => matches(d, filter));
    docs = sortDocs(docs, sort);
    if (skip) docs = docs.slice(skip);
    if (limit != null) docs = docs.slice(0, limit);
    return docs.map((d) => applyProjection(structuredClone(d), projection));
  },

  async findOne(name, filter = {}, opts = {}) {
    const doc = getCollection(name).find((d) => matches(d, filter));
    return doc ? applyProjection(structuredClone(doc), opts.projection) : null;
  },

  async findById(name, id, opts = {}) {
    return memory.findOne(name, { _id: id }, opts);
  },

  async insertOne(name, doc) {
    const now = new Date().toISOString();
    const record = {
      _id: doc._id || `${name.slice(0, 3)}-${nanoid(10)}`,
      createdAt: doc.createdAt || now,
      updatedAt: now,
      ...doc,
    };
    getCollection(name).push(record);
    return structuredClone(record);
  },

  async insertMany(name, docs) {
    const out = [];
    for (const d of docs) out.push(await memory.insertOne(name, d));
    return out;
  },

  async updateOne(name, filter, update, opts = {}) {
    const arr = getCollection(name);
    let doc = arr.find((d) => matches(d, filter));
    if (!doc) {
      if (!opts.upsert) return null;
      doc = { _id: `${name.slice(0, 3)}-${nanoid(10)}`, ...filter };
      arr.push(doc);
    }
    applyUpdate(doc, update);
    doc.updatedAt = new Date().toISOString();
    return structuredClone(doc);
  },

  async updateById(name, id, update, opts = {}) {
    return memory.updateOne(name, { _id: id }, update, opts);
  },

  async deleteOne(name, filter) {
    const arr = getCollection(name);
    const idx = arr.findIndex((d) => matches(d, filter));
    if (idx === -1) return { deletedCount: 0 };
    arr.splice(idx, 1);
    return { deletedCount: 1 };
  },

  async deleteById(name, id) {
    return memory.deleteOne(name, { _id: id });
  },

  async count(name, filter = {}) {
    return getCollection(name).filter((d) => matches(d, filter)).length;
  },
};

export default memory;
