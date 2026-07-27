const mongoose = require("mongoose");
const mockState = require("../config/mockState");
const createMockModel = require("./mockModel");

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  client: { type: String, required: true },
  clientId: { type: String },
  clientEmail: { type: String },
  loc: { type: String, required: true },      // human-readable location label
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  budget: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "active", "completed"], default: "pending" }
}, { timestamps: true, bufferCommands: false });

const RealProject = mongoose.model("Project", ProjectSchema);
const mock = createMockModel();

module.exports = new Proxy(RealProject, {
  get(target, prop) {
    if (mockState.useMock && prop in mock) return mock[prop];
    return target[prop];
  }
});
