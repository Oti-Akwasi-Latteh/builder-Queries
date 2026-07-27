const router = require("express").Router();
const passport = require("passport");

// ================= GOOGLE LOGIN =================
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/Login.html",
    session: true,
  }),
  (req, res) => {
    const user = req.user;

    const name = `${user.firstName} ${user.lastName || ""}`.trim();
    const email = user.email;

    res.redirect(
      `/Dashboard.html?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`
    );
  }
);

// ================= GITHUB LOGIN =================
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], prompt: "select_account" })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/Login.html",
    session: true,
  }),
  (req, res) => {
    const user = req.user;

    const name = user.firstName || user.username || "GitHub User";
    const email = user.email;

    res.redirect(
      `/Dashboard.html?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`
    );
  }
);

// ================= LOGOUT =================
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("Logout error");

    req.session.destroy(() => {
      res.redirect("/Login.html");
    });
  });
});

module.exports = router;