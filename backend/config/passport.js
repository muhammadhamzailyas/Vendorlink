const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../model/user');

// Local Strategy — email + password
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    try {
      console.log(`[Auth] Attempting login for: ${email}`);
      const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
      
      if (!user) {
        console.log(`[Auth] User not found: ${email}`);
        return done(null, false, { message: 'Invalid email or password' });
      }

      if (!user.password) {
        console.log(`[Auth] User has no password (OAuth?): ${email}`);
        return done(null, false, { message: 'Invalid email or password' });
      }

      const isMatch = await user.comparePassword(password);
      console.log(`[Auth] Password match for ${email}: ${isMatch}`);

      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      return done(null, user);
    } catch (err) {
      console.error(`[Auth] LocalStrategy Error:`, err);
      return done(err);
    }
  }
));

// Google OAuth2 Strategy
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) return done(null, false, { message: 'No email from Google' });

      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        // Try to link to existing account by email
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.emailVerified = true;
          await user.save();
        } else {
          // New user via Google
          user = await User.create({
            email,
            googleId: profile.id,
            authProvider: 'google',
            fullName: profile.displayName || '',
            emailVerified: true,
            role: 'unassigned',
            status: 'pending',
          });
        }
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

module.exports = passport;
