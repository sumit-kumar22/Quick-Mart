import memory from './memory.js';
import mongo from './mongoRepo.js';

let active = memory;

export function setEngine(name) {
  active = name === 'mongo' ? mongo : memory;
}

export function engineName() {
  return active.name;
}

/**
 * Storage-agnostic repository. Every service/controller talks to `repo`
 * and never cares whether the data lives in MongoDB or the in-memory store.
 */

// Defence-in-depth: object/operator-shaped ids (e.g. {$ne: ...}) must never
// reach a query. Route params arrive as strings, but request bodies can be objects.
function assertPlainId(id, caller) {
  if (id != null && (typeof id !== 'string' || id.startsWith('$') || id.includes('{') || id.length > 128)) {
    throw new Error(`Invalid id supplied to ${caller}`);
  }
  return id;
}

export const repo = {
  findMany: (name, filter, opts) => active.findMany(name, filter, opts),
  findOne: (name, filter, opts) => active.findOne(name, filter, opts),
  findById: (name, id, opts) => active.findById(name, assertPlainId(id, 'findById'), opts),
  insertOne: (name, doc) => active.insertOne(name, doc),
  insertMany: (name, docs) => active.insertMany(name, docs),
  updateOne: (name, filter, update, opts) => active.updateOne(name, filter, update, opts),
  updateById: (name, id, update, opts) => active.updateById(name, assertPlainId(id, 'updateById'), update, opts),
  deleteOne: (name, filter) => active.deleteOne(name, filter),
  deleteById: (name, id) => active.deleteById(name, assertPlainId(id, 'deleteById')),
  count: (name, filter) => active.count(name, filter),
};

export default repo;
