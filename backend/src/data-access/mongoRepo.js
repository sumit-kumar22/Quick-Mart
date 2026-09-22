import { models } from '../models/index.js';

function model(name) {
  const m = models[name];
  if (!m) throw new Error(`No model registered for collection "${name}"`);
  return m;
}

function normalize(doc) {
  if (!doc) return doc;
  const out = { ...doc };
  if (out._id != null && typeof out._id !== 'string') out._id = String(out._id);
  for (const [k, v] of Object.entries(out)) {
    if (v instanceof Date) out[k] = v.toISOString();
  }
  return out;
}

/**
 * MongoDB (Mongoose) repository implementing the same primitives as the
 * in-memory store, so controllers/services stay storage-agnostic.
 */
export const mongo = {
  name: 'mongo',

  async findMany(name, filter = {}, opts = {}) {
    const { sort, skip = 0, limit, projection } = opts;
    let q = model(name).find(filter);
    if (sort) q = q.sort(sort);
    if (skip) q = q.skip(skip);
    if (limit != null) q = q.limit(limit);
    if (projection) q = q.select(projection);
    const docs = await q.lean();
    return docs.map(normalize);
  },

  async findOne(name, filter = {}, opts = {}) {
    let q = model(name).findOne(filter);
    if (opts.projection) q = q.select(opts.projection);
    return normalize(await q.lean());
  },

  async findById(name, id, opts = {}) {
    return mongo.findOne(name, { _id: id }, opts);
  },

  async insertOne(name, doc) {
    const created = await model(name).create(doc);
    return normalize(created.toObject());
  },

  async insertMany(name, docs) {
    const created = await model(name).insertMany(docs);
    return created.map((d) => normalize(d.toObject()));
  },

  async updateOne(name, filter, update, opts = {}) {
    const doc = await model(name)
      .findOneAndUpdate(filter, update, { new: true, upsert: !!opts.upsert, setDefaultsOnInsert: true })
      .lean();
    return normalize(doc);
  },

  async updateById(name, id, update, opts = {}) {
    return mongo.updateOne(name, { _id: id }, update, opts);
  },

  async deleteOne(name, filter) {
    const res = await model(name).deleteOne(filter);
    return { deletedCount: res.deletedCount || 0 };
  },

  async deleteById(name, id) {
    return mongo.deleteOne(name, { _id: id });
  },

  async count(name, filter = {}) {
    return model(name).countDocuments(filter);
  },
};

export default mongo;
