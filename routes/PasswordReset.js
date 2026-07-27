const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { sendPasswordResetEmail } = require("../config/mailer");

// ================= FORGOT PASSWORD =================
// POST /api/auth/forgot-password   body: { email }
//
// Always responds with the same generic message whether or not the email
// is registered, so this endpoint can't be used to enumerate accounts.
router.post("/forgot-password", async (req, res) => {
  const GENERIC_MSG = "If an account exists for that email, a password reset link has been sent.";

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      const rawToken = user.createPasswordResetToken(30); // 30-minute expiry
      await user.save();

      try {
        await sendPasswordResetEmail(user.email, rawToken);
      } catch (mailErr) {
        // Roll back the token if the email genuinely failed to send, so a
        // dead token isn't left sitting on the account.
        console.error("Password reset email failed to send:", mailErr);
        user.clearPasswordResetToken();
        await user.save();
        return res.status(500).json({ msg: "Could not send the reset email. Please try again." });
      }
    }

    // Same response whether or not `user` was found.
    res.json({ msg: GENERIC_MSG });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ================= RESET PASSWORD =================
// POST /api/auth/reset-password/:token   body: { password }
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }
    if (!token) {
      return res.status(400).json({ msg: "Reset link is invalid or has expired" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ msg: "Reset link is invalid or has expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.clearPasswordResetToken();
    await user.save();

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;