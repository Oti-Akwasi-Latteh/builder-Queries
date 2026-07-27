const mongoose = require("mongoose");
const mockState = require("../config/mockState");
const createMockModel = require("./mockModel");

const MessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, default: "General inquiry" },
  message: { type: String, required: true },
  status: { type: String, enum: ["unread", "read"], default: "unread" }
}, { timestamps: true, bufferCommands: false });

const RealMessage = mongoose.model("Message", MessageSchema);
const mock = createMockModel();

module.exports = new Proxy(RealMessage, {
  get(target, prop) {
    if (mockState.useMock && prop in mock) return mock[prop];
    return target[prop];
  }
});
