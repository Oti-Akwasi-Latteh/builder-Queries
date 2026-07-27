const mongoose = require("mongoose");
const mockState = require("../config/mockState");
const createMockModel = require("./mockModel");

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true } // bcrypt hash
}, { timestamps: true, bufferCommands: false });

const RealAdmin = mongoose.model("Admin", AdminSchema);
const mock = createMockModel();

module.exports = new Proxy(RealAdmin, {
  get(target, prop) {
    if (mockState.useMock && prop in mock) return mock[prop];
    return target[prop];
  }
});
