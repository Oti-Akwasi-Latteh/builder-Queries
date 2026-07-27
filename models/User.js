const mongoose = require("mongoose");
const crypto = require("crypto");
const mockState = require("../config/mockState");

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  provider: String,
  // Admin console needs a way to suspend an account without deleting it.
  isActive: {
    type: Boolean,
    default: true
  },
  // ---- password reset ----
  // Only the SHA-256 hash of the reset token is ever stored — the raw token
  // (the one emailed to the user) never touches the database, so a DB leak
  // alone can't be used to reset anyone's password.
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, { timestamps: true, bufferCommands: false });

// Generates a raw token to email to the user, and stores only its hash +
// an expiry on the document. Caller is still responsible for calling save().
UserSchema.methods.createPasswordResetToken = function (ttlMinutes = 30) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetPasswordExpires = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return rawToken; // this is what goes in the emailed link, never the hash
};

UserSchema.methods.clearPasswordResetToken = function () {
  this.resetPasswordToken = null;
  this.resetPasswordExpires = null;
};

const RealUser = mongoose.model("User", UserSchema);

// In-memory mock database
const usersDb = [];

class MockUser {
  constructor(data) {
    this._id = data._id || 'mock_' + Math.random().toString(36).substr(2, 9);
    this.id = this._id;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.password = data.password;
    this.provider = data.provider;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.resetPasswordToken = data.resetPasswordToken !== undefined ? data.resetPasswordToken : null;
    this.resetPasswordExpires = data.resetPasswordExpires !== undefined ? data.resetPasswordExpires : null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
  }

  async save() {
    const idx = usersDb.findIndex(u => u._id === this._id);
    if (idx !== -1) {
      usersDb[idx] = this;
    } else {
      if (usersDb.some(u => u.email === this.email)) {
        throw new Error("Duplicate key error (email)");
      }
      usersDb.push(this);
    }
    return this;
  }

  // Mirrors UserSchema.methods.createPasswordResetToken above, so the reset
  // flow works identically whether mock mode is on or off.
  createPasswordResetToken(ttlMinutes = 30) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    this.resetPasswordExpires = new Date(Date.now() + ttlMinutes * 60 * 1000);
    return rawToken;
  }

  clearPasswordResetToken() {
    this.resetPasswordToken = null;
    this.resetPasswordExpires = null;
  }
}

// Small generic matcher so MockUser.findOne can support the same query
// shapes real Mongoose queries use here — plain equality (email,
// resetPasswordToken) and a `$gt` comparison (resetPasswordExpires).
function matchesQuery(user, query) {
  return Object.entries(query).every(([key, expected]) => {
    const actual = user[key];
    if (expected && typeof expected === "object" && !(expected instanceof Date)) {
      if ("$gt" in expected) return actual != null && new Date(actual) > new Date(expected.$gt);
      if ("$gte" in expected) return actual != null && new Date(actual) >= new Date(expected.$gte);
      if ("$lt" in expected) return actual != null && new Date(actual) < new Date(expected.$lt);
      if ("$ne" in expected) return actual !== expected.$ne;
      return false;
    }
    return actual === expected;
  });
}

MockUser.findOne = async (query) => {
  const found = usersDb.find(u => matchesQuery(u, query));
  return found ? new MockUser(found) : null;
};

MockUser.findById = async (id) => {
  const found = usersDb.find(u => u._id === id || u.id === id);
  return found ? new MockUser(found) : null;
};

MockUser.find = async () => {
  return usersDb.map(u => new MockUser(u));
};

MockUser.create = async (data) => {
  const newUser = new MockUser(data);
  await newUser.save();
  return newUser;
};

MockUser.findByIdAndUpdate = async (id, update) => {
  const idx = usersDb.findIndex(u => u._id === id || u.id === id);
  if (idx === -1) return null;
  usersDb[idx] = { ...usersDb[idx], ...update, updatedAt: new Date() };
  return new MockUser(usersDb[idx]);
};

MockUser.findByIdAndDelete = async (id) => {
  const idx = usersDb.findIndex(u => u._id === id || u.id === id);
  if (idx === -1) return null;
  const [removed] = usersDb.splice(idx, 1);
  return removed ? new MockUser(removed) : null;
};

// Kept for the old per-file toggle some code may still call
let useMock = false;
global.enableMockDB = () => {
  useMock = true;
  mockState.useMock = true;
};

function shouldUseMock() {
  return useMock || mockState.useMock;
}

module.exports = new Proxy(RealUser, {
  construct(target, args) {
    if (shouldUseMock()) {
      return new MockUser(args[0]);
    }
    return new RealUser(...args);
  },
  get(target, prop) {
    if (shouldUseMock()) {
      if (prop === 'findOne') return MockUser.findOne;
      if (prop === 'findById') return MockUser.findById;
      if (prop === 'find') return MockUser.find;
      if (prop === 'create') return MockUser.create;
      if (prop === 'findByIdAndUpdate') return MockUser.findByIdAndUpdate;
      if (prop === 'findByIdAndDelete') return MockUser.findByIdAndDelete;
    }
    return target[prop];
  }
});