const mongoose = require("mongoose");
const mockState = require("./mockState");

const connectDB = async () => {
  try {
    // Disable Mongoose query buffering so queries fail/fall back quickly
    mongoose.set('bufferCommands', false);

    // Timeout after 3 seconds so fallback is quick
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.warn("⚠️ MongoDB Atlas connection failed:", err.message);
    console.warn("🔄 Falling back to local IN-MEMORY Mock Database...");
    mockState.useMock = true;
    // Kept for backwards compatibility with any code still calling the old hook
    global.enableMockDB = () => { mockState.useMock = true; };
  }
};

module.exports = connectDB;
