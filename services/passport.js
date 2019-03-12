const passport = require('passport');
const uuid = require('uuid/v1');
const { Strategy: JwtStrategy } = require('passport-jwt');
const { ExtractJwt } = require('passport-jwt');
const { Strategy: GoogleTokenStrategy } = require('passport-google-token');

const User = require('../models/user');
const keys = require('../config/keys');

// Setup options for JWT strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: keys.secretOrKey
};

const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
  User.findById(payload.id)
    .then(user => {
      if (user) {
        return done(null, user);
      }

      return done(null, false);
    })
    .catch(err => done(err, false));
});

const googleLogin = new GoogleTokenStrategy(
  keys.googleAuth,
  (accessToken, refreshToken, profile, done) => {
    const firstName = profile.name.givenName;
    const lastName = profile.name.familyName;
    const email = profile.emails[0].value; // Pull the first email
    const username = email;
    const isVerified = true; // No verification needed
    const avatar = profile._json.picture;
    const password = uuid();

    User.findOne({ email })
      .then(user => {
        // User found
        if (user) {
          return done(null, user);
        }

        // No user was found, lets create a new one
        const newUser = new User({
          firstName,
          lastName,
          email,
          username,
          isVerified,
          avatar,
          password
        });

        newUser
          .save()
          .then(user => done(null, user))
          .catch(err => done(err, false));
      })
      .catch(err => done(err, false));
  }
);

module.exports = () => {
  passport.use(jwtLogin);
  passport.use(googleLogin);
};
