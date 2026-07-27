// A tiny in-memory stand-in for a Mongoose model. Used when MongoDB isn't
// reachable (see config/db.js + config/mockState.js). Supports just enough
// of the Mongoose API for this app's routes: find, findOne, findById,
// create, findByIdAndUpdate, findByIdAndDelete, deleteMany, countDocuments.

let counter = 0;
function nextId() {
  return "mock_" + Date.now().toString(36) + "_" + (counter++);
}

function matches(item, filter) {
  return Object.keys(filter).every((key) => {
    const want = filter[key];
    const have = item[key];
    if (want && want._bqIn) return want._bqIn.includes(String(have));
    return String(have) === String(want);
  });
}

function clone(item) {
  return item ? { ...item } : item;
}

function createMockModel() {
  const store = [];

  return {
    _store: store,

    async find(filter = {}) {
      return store.filter((item) => matches(item, filter)).map(clone);
    },

    async findOne(filter = {}) {
      const found = store.find((item) => matches(item, filter));
      return found ? clone(found) : null;
    },

    async findById(id) {
      const found = store.find((item) => item._id === id);
      return found ? clone(found) : null;
    },

    async create(data) {
      const doc = {
        _id: nextId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      };
      store.push(doc);
      return clone(doc);
    },

    async findByIdAndUpdate(id, update) {
      const idx = store.findIndex((item) => item._id === id);
      if (idx === -1) return null;
      store[idx] = { ...store[idx], ...update, updatedAt: new Date() };
      return clone(store[idx]);
    },

    async findByIdAndDelete(id) {
      const idx = store.findIndex((item) => item._id === id);
      if (idx === -1) return null;
      const [removed] = store.splice(idx, 1);
      return clone(removed);
    },

    async deleteMany(filter = {}) {
      const before = store.length;
      const remaining = store.filter((item) => !matches(item, filter));
      store.length = 0;
      store.push(...remaining);
      return { deletedCount: before - store.length };
    },

    async countDocuments(filter = {}) {
      return store.filter((item) => matches(item, filter)).length;
    }
  };
}

module.exports = createMockModel;
