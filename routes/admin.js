const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Project = require("../models/Project");
const Message = require("../models/Message");
const Booking = require("../models/Booking");

// ================= HELPERS =================
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ msg: "Not authenticated" });
  }
  next();
}

function safeAdmin(admin) {
  return { id: admin._id, name: admin.name, username: admin.username, email: admin.email };
}

function safeUser(u) {
  return {
    id: u._id,
    name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
    email: u.email,
    provider: u.provider || "local",
    status: u.isActive === false ? "suspended" : "active",
    joined: u.createdAt
  };
}

// Seeds a little sample data on first run so the console isn't empty.
// Real submissions (once Contact.js / Servicedetail.js are wired to
// routes/public.js) will simply add to these lists.
let seeded = false;
async function ensureSeed() {
  if (seeded) return;
  seeded = true;

  const projectCount = await Project.countDocuments();
  if (projectCount === 0) {
    await Project.create({ name: "Riverside Estate — Phase 2", client: "GreenPath Developers", loc: "Kumasi, Ashanti", lat: 6.6885, lng: -1.6244, budget: 450000, status: "active" });
    await Project.create({ name: "Adum Commercial Complex", client: "Adum Traders Union", loc: "Adum, Kumasi", lat: 6.6935, lng: -1.6250, budget: 920000, status: "pending" });
    await Project.create({ name: "Ahodwo Family Homes", client: "Nana Yeboah", loc: "Ahodwo, Kumasi", lat: 6.6605, lng: -1.6180, budget: 210000, status: "completed" });
  }

  const messageCount = await Message.countDocuments();
  if (messageCount === 0) {
    await Message.create({ name: "Efua Mensah", email: "efua.m@email.com", subject: "General Inquiry", message: "Hi, I would like a quote for a 3-bedroom house build in Ahodwo. Can someone call me back this week?" });
    await Message.create({ name: "Kojo Adjei", email: "kojo.adjei@email.com", subject: "Report an Issue", message: "What is the current status of the Riverside Estate project? I am considering a unit there." });
  }

  const bookingCount = await Booking.countDocuments();
  if (bookingCount === 0) {
    const projects = await Project.find();
    await Booking.create({ name: "Kwame Asante", email: "kwame.asante@email.com", projectId: projects[0] ? String(projects[0]._id) : null, projectName: projects[0] ? projects[0].name : "", date: "2026-07-15", time: "Morning (8am – 12pm)", location: "Kumasi", status: "pending" });
    await Booking.create({ name: "Ama Boateng", email: "ama.boateng@email.com", projectId: projects[1] ? String(projects[1]._id) : null, projectName: projects[1] ? projects[1].name : "", date: "2026-07-18", time: "Afternoon (12pm – 4pm)", location: "Adum, Kumasi", status: "pending" });
  }
}
router.use(async (req, res, next) => { await ensureSeed(); next(); });

// ================= AUTH =================
router.post("/signup", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: "Password needs at least 6 characters" });
    }
    const existing = await Admin.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ msg: "That username is taken" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, username: username.toLowerCase(), email, password: hashed });
    req.session.adminId = admin._id;
    res.json({ msg: "Admin account created", admin: safeAdmin(admin) });
  } catch (err) {
    console.error("Admin signup error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ msg: "Username and password required" });
    }
    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin) return res.status(400).json({ msg: "That username or password is wrong" });
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: "That username or password is wrong" });
    req.session.adminId = admin._id;
    res.json({ msg: "Login successful", admin: safeAdmin(admin) });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  if (req.session) {
    req.session.adminId = null;
  }
  res.json({ msg: "Logged out" });
});

router.get("/me", requireAdmin, async (req, res) => {
  const admin = await Admin.findById(req.session.adminId);
  if (!admin) return res.status(401).json({ msg: "Not authenticated" });
  res.json({ admin: safeAdmin(admin) });
});

// Everything below requires a logged-in admin
router.use(requireAdmin);

// ================= USERS =================
router.get("/users", async (req, res) => {
  const users = await User.find();
  res.json({ users: users.map(safeUser) });
});

router.patch("/users/:id/status", async (req, res) => {
  const { isActive } = req.body;
  const updated = await User.findByIdAndUpdate(req.params.id, { isActive: !!isActive });
  if (!updated) return res.status(404).json({ msg: "User not found" });
  res.json({ user: safeUser(updated) });
});

router.delete("/users/:id", async (req, res) => {
  const removed = await User.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ msg: "User not found" });
  res.json({ msg: "User deleted" });
});

// ================= PROJECTS =================
router.get("/projects", async (req, res) => {
  const projects = await Project.find();
  res.json({ projects });
});

router.post("/projects", async (req, res) => {
  const { name, client, clientId, clientEmail, loc, lat, lng, budget, status } = req.body;
  if (!name || !client || !loc || lat === undefined || lng === undefined) {
    return res.status(400).json({ msg: "Name, client, location and coordinates are required" });
  }
  const project = await Project.create({
    name, client, clientId: clientId || null, clientEmail: clientEmail || null, loc,
    lat: Number(lat), lng: Number(lng),
    budget: Number(budget) || 0,
    status: status || "pending"
  });
  res.json({ project });
});

router.patch("/projects/:id", async (req, res) => {
  const update = {};
  ["name", "client", "clientId", "clientEmail", "loc", "lat", "lng", "budget", "status"].forEach((key) => {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  });
  const project = await Project.findByIdAndUpdate(req.params.id, update);
  if (!project) return res.status(404).json({ msg: "Project not found" });
  res.json({ project });
});

router.delete("/projects/:id", async (req, res) => {
  const removed = await Project.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ msg: "Project not found" });
  res.json({ msg: "Project deleted" });
});

// Lightweight endpoint the live map polls every few seconds
router.get("/projects/locations", async (req, res) => {
  const projects = await Project.find();
  res.json({
    locations: projects.map((p) => ({ id: p._id, name: p.name, status: p.status, lat: p.lat, lng: p.lng }))
  });
});

// ================= MESSAGES =================
router.get("/messages", async (req, res) => {
  const messages = await Message.find();
  res.json({ messages: messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

router.patch("/messages/:id", async (req, res) => {
  const { status } = req.body;
  const message = await Message.findByIdAndUpdate(req.params.id, { status: status || "read" });
  if (!message) return res.status(404).json({ msg: "Message not found" });
  res.json({ message });
});

router.delete("/messages/:id", async (req, res) => {
  const removed = await Message.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ msg: "Message not found" });
  res.json({ msg: "Message deleted" });
});

// ================= BOOKINGS =================
router.get("/bookings", async (req, res) => {
  const bookings = await Booking.find();
  res.json({ bookings: bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

router.patch("/bookings/:id", async (req, res) => {
  const { status } = req.body;
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ msg: "Invalid status" });
  }
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status });
  if (!booking) return res.status(404).json({ msg: "Booking not found" });
  res.json({ booking });
});

// Lightweight endpoint the live map polls every few seconds — only bookings
// where the user actually supplied (or shared via GPS) coordinates show up here.
router.get("/bookings/locations", async (req, res) => {
  const bookings = await Booking.find({ lat: { $ne: null }, lng: { $ne: null } });
  res.json({
    locations: bookings.map((b) => ({
      id: b._id, name: b.name, location: b.location,
      proName: b.proName, status: b.status, lat: b.lat, lng: b.lng
    }))
  });
});

module.exports = router;