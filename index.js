require("dotenv").config();
const connectDB = require("./config/db");
connectDB(); 

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");

const app = express();

// CORS MUST COME FIRST

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5501",
      "http://localhost:5501",
      "http://localhost:5001"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret:"secretkey",
  resave:false,
  saveUninitialized:false,
  cookie:{
    httpOnly:true,
    secure:false,
    sameSite:"lax"
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// routes
app.use("/api/auth", require("./routes/auth.js"));
app.use("/api/auth", require("./routes/passwordReset.js"));
app.use("/auth", require("./routes/oauth.js"));
app.use("/api/admin", require("./routes/admin.js"));
app.use("/api/public", require("./routes/public.js"));
// Also mount public routes at `/api` so frontend calls to `/api/...` work
app.use("/api", require("./routes/public.js"));

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));