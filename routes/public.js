const express = require("express");
const router = express.Router();

const Message = require("../models/Message");
const Booking = require("../models/Booking");
const Project = require("../models/Project");

// Hook this up from Contact.js's sendMessage() function
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ msg: "Name, email and message are required" });
    }
    await Message.create({ name, email, subject: subject || "General inquiry", message });
    res.json({ msg: "Message sent" });
  } catch (err) {
    console.error("Contact submit error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Hook this up from Servicedetail.js's submitBooking() function
router.post("/bookings", async (req, res) => {
  try {
    const { name, email, projectId, proName, proRole, proRate, date, time, description, location, lat, lng } = req.body;
    if (!name || !email || !date) {
      return res.status(400).json({ msg: "Name, email and date are required" });
    }
    let projectName = "";
    if (projectId) {
      const project = await Project.findById(projectId);
      if (project) projectName = project.name;
    }
    const booking = await Booking.create({
      name, email, projectId: projectId || null, projectName,
      proName: proName || "", proRole: proRole || "", proRate: proRate || "",
      date, time: time || "", description: description || "", location: location || "",
      lat: (lat !== undefined && lat !== null && lat !== "") ? Number(lat) : null,
      lng: (lng !== undefined && lng !== null && lng !== "") ? Number(lng) : null
    });
    res.json({ msg: "Booking request sent", booking });
  } catch (err) {
    console.error("Booking submit error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET projects assigned to a specific user by email
router.get("/user/projects", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.json({ projects: [] });
    const projects = await Project.find({ clientEmail: email });
    res.json({ projects });
  } catch (err) {
    console.error("User projects error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
