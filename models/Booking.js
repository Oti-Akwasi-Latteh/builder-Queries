const mongoose = require("mongoose");
const mockState = require("../config/mockState");
const createMockModel = require("./mockModel");

const BookingSchema = new mongoose.Schema({
  name: { type: String, required: true },     // the requesting user's name
  email: { type: String, required: true },
  projectId: { type: String, default: null }, // references Project._id (string works for mock + real)
  projectName: { type: String, default: "" }, // denormalized so admin lists still work if project is deleted
  proName: { type: String, default: "" },     // set when booking a professional from Servicedetail.html
  proRole: { type: String, default: "" },
  proRate: { type: String, default: "" },
  date: { type: String, required: true },
  time: { type: String, default: "" },
  description: { type: String, default: "" },
  location: { type: String, default: "" },   // free-text town/city the user typed
  lat: { type: Number, default: null },      // optional precise coordinate (typed or from device GPS)
  lng: { type: Number, default: null },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true, bufferCommands: false });

const RealBooking = mongoose.model("Booking", BookingSchema);
const mock = createMockModel();

module.exports = new Proxy(RealBooking, {
  get(target, prop) {
    if (mockState.useMock && prop in mock) return mock[prop];
    return target[prop];
  }
});