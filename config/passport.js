require("dotenv").config();

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

// Debug environment variables
console.log("GOOGLE_ID:", process.env.GOOGLE_ID ? "Loaded" : "Missing");
console.log("GOOGLE_SECRET:", process.env.GOOGLE_SECRET ? "Loaded" : "Missing");
console.log("GITHUB_ID:", process.env.GITHUB_ID ? "Loaded" : "Missing");
console.log("GITHUB_SECRET:", process.env.GITHUB_SECRET ? "Loaded" : "Missing");


// ================= SESSION =================

passport.serializeUser((user, done) => {
  done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


// ================= GOOGLE AUTH =================

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ID?.trim(),
      clientSecret: process.env.GOOGLE_SECRET?.trim(),
      callbackURL: "http://localhost:5001/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {

        const email = profile.emails?.[0]?.value;

        let user = await User.findOne({ email });


        if (!user) {
          user = await User.create({
            firstName: profile.name?.givenName || "Google",
            lastName: profile.name?.familyName || "",
            email: email,
            password: "oauth",
            provider: "google",
          });
        }


        return done(null, user);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);



// ================= GITHUB AUTH =================

const gitHubStrategy = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_ID?.trim(),
    clientSecret: process.env.GITHUB_SECRET?.trim(),
    callbackURL: "http://localhost:5001/auth/github/callback",
    scope: ["user:email"],
  },

  async (accessToken, refreshToken, profile, done) => {
    try {

      const email =
        profile.emails?.[0]?.value ||
        `${profile.username}@github.local`;


      let user = await User.findOne({ email });


      if (!user) {
        user = await User.create({
          firstName: profile.displayName || profile.username,
          lastName: "",
          email: email,
          password: "oauth",
          provider: "github",
        });
      }


      return done(null, user);


    } catch (error) {
      return done(error, null);
    }
  }
);

gitHubStrategy.authorizationParams = function(options) {
  return {
    prompt: "select_account"
  };
};

passport.use(gitHubStrategy);


module.exports = passport;