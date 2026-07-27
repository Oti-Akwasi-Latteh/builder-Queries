const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// ================= SIGNUP =================
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    user = new User({
      firstName,
      lastName,
      email,
      password: hashed
    });

    await user.save();

    res.json({
  msg: "Signup successful",
  user: {
    id: user._id,
    name: user.firstName + " " + user.lastName,
    email: user.email
  }
});
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔒 Validate
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    // 🔍 Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // 🔑 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // ✅ Success (send safe user data)
    res.json({
      msg: "Login successful",
      user: {
        id: user._id,
        name: user.firstName + " " + user.lastName,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ================= LOGOUT =================
// ================= LOGOUT =================
router.post("/logout", (req, res) => {
  try {
    if (req.logout) {
      req.logout((err) => {
        if (err) {
          console.error("Passport logout error:", err);
        }
        if (req.session) {
          req.session.destroy(() => {
            res.json({ msg: "Logged out successfully" });
          });
        } else {
          res.json({ msg: "Logged out successfully" });
        }
      });
    } else {
      if (req.session) {
        req.session.destroy(() => {
          res.json({ msg: "Logged out successfully" });
        });
      } else {
        res.json({ msg: "Logged out successfully" });
      }
    }
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ msg: "Logout failed" });
  }
});

module.exports = router;