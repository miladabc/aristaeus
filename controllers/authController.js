const bcrypt = require('bcrypt');

const keys = require('../config/keys');
const User = require('../models/user');
const Token = require('../models/token');
const { jwtForUser, createAndMailToken } = require('../utils');
const {
  emailVerifyTemplate,
  forgotPassTemplate
} = require('../services/emailTemplates');

const signup = [
  // Check for existing user
  (req, res, next) => {
    const { username, email } = req.body;
    const error = { status: 422 };

    User.findOne({ $or: [{ username }, { email }] })
      .then(user => {
        // If user with provided username or email does exist, response with error
        if (user) {
          if (user.username === username) {
            error.msg = 'Username already exist';
          }
          if (user.email === email) {
            error.msg = 'Email already exist';
          }

          return next(error);
        }

        // User does not exist so go to next middleware
        next();
      })
      .catch(next);
  },
  // User does not exist, so sign the user up
  (req, res, next) => {
    const { firstName, lastName, username, email, password } = req.body;

    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password
    });

    // Hash password
    bcrypt
      .hash(password, keys.saltFactor)
      .then(hash => {
        newUser.password = hash;

        // Save the user in database
        newUser
          .save()
          .then(user => {
            createAndMailToken({
              user,
              subject: 'Coolapp account verification',
              content: emailVerifyTemplate,
              next
            });

            res.json({
              success: true,
              msg: `A verification email has been sent to ${user.email}.`
            });
          })
          .catch(next);
      })
      .catch(next);
  }
];

const signin = (req, res, next) => {
  const { emailOrUsername, password } = req.body;
  const error = { success: false };

  User.findOne()
    .or([{ username: emailOrUsername }, { email: emailOrUsername }])
    .then(user => {
      if (!user) {
        error.msg = 'Email or username does not exist';
        return res.status(401).json(error);
      }

      // Check password
      bcrypt
        .compare(password, user.password)
        .then(isMatch => {
          // Password does not match
          if (!isMatch) {
            error.msg = 'Incorrect password';
            return res.status(422).json(error);
          }

          // User is not verified
          if (!user.isVerified) {
            error.msg = 'You have to verify your email in order to sign in';
            return res.status(422).json(error);
          }

          // User matched, return it
          return res.json({ success: true, token: jwtForUser(user) });
        })
        .catch(next);
    })
    .catch(next);
};

const isItAvailable = (req, res, next) => {
  const { username, email } = req.body;

  User.find()
    .or([{ username }, { email }])
    .then(users => {
      if (users.length === 0) {
        return res.json({ success: true });
      }

      const response = { success: false, username: true, email: true };

      users.forEach(user => {
        if (user.username === username) response.username = false;
        if (user.email === email) response.email = false;
      });

      return res.json(response);
    })
    .catch(next);
};

const googleOAuth = (req, res) => {
  res.json({ success: true, token: jwtForUser(req.user) });
};

const confirmation = [
  (req, res, next) => {
    Token.findOne({ token: req.body.token })
      .then(token => {
        if (!token) {
          return res.status(422).json({
            success: false,
            msg:
              'We were unable to find a valid token. Your token may have expired.'
          });
        }

        res.locals.token = token;
        next();
      })
      .catch(next);
  },
  (req, res, next) => {
    const token = res.locals.token;

    User.findById(token.userId)
      .then(user => {
        if (!user) {
          return res.status(422).json({
            success: false,
            msg: 'We were unable to find a user for this token.'
          });
        }
        if (user.isVerified) {
          return res.status(422).json({
            success: false,
            msg: 'This user has already been verified.'
          });
        }

        user.isVerified = true;
        user
          .save()
          .then(() => {
            res.json({
              success: true,
              msg: 'The account has been verified. Please log in.'
            });

            token.remove();
          })
          .catch(next);
      })
      .catch(next);
  }
];

const resend = (req, res, next) => {
  const { email } = req.body;

  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(404).json({
          success: false,
          msg: 'We were unable to find a user with that email.'
        });
      }
      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          msg: 'This account has already been verified. Please log in.'
        });
      }

      createAndMailToken({
        user,
        subject: 'Coolapp account verification',
        content: emailVerifyTemplate,
        next
      });

      res.json({
        success: true,
        msg: `A verification email has been sent to ${user.email}.`
      });
    })
    .catch(next);
};

const forgotPass = (req, res, next) => {
  const { emailOrUsername } = req.body;

  User.findOne()
    .or([{ username: emailOrUsername }, { email: emailOrUsername }])
    .then(user => {
      if (!user) {
        return res.status(404).json({
          success: false,
          msg: 'We were unable to find a user with that email.'
        });
      }

      createAndMailToken({
        user,
        subject: 'Coolapp Password Reset',
        content: forgotPassTemplate,
        next
      });

      res.json({
        success: true,
        msg: `A password reset link has been sent to ${user.email}.`
      });
    })
    .catch(next);
};

const resetPass = [
  (req, res, next) => {
    Token.findOne({ token: req.body.token })
      .then(token => {
        if (!token) {
          return res.status(422).json({
            success: false,
            msg:
              'We were unable to find a valid token. Your token may have expired.'
          });
        }

        res.locals.token = token;
        next();
      })
      .catch(next);
  },
  (req, res, next) => {
    const token = res.locals.token;
    const { password } = req.body;

    User.findById(token.userId)
      .then(user => {
        if (!user) {
          return res.status(422).json({
            success: false,
            msg: 'We were unable to find a user for this token.'
          });
        }

        // Hash password
        bcrypt
          .hash(password, keys.saltFactor)
          .then(hash => {
            user.password = hash;

            // Save the user in database
            user
              .save()
              .then(() => {
                res.json({
                  success: true,
                  msg: 'Your password has been successfully updated'
                });
                token.remove();
              })
              .catch(next);
          })
          .catch(next);
      })
      .catch(next);
  }
];

module.exports = {
  signup,
  signin,
  isItAvailable,
  googleOAuth,
  confirmation,
  resend,
  forgotPass,
  resetPass
};
