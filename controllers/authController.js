const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const keys = require('../config/keys');
const User = require('../models/user');
const Token = require('../models/token');
const mailer = require('../config/mailer.js');

function tokenForuser(user) {
  const payload = {
    sub: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username
  };
  const token = jwt.sign(payload, keys.secretOrKey, keys.jwtExpires);

  return 'Bearer ' + token;
}

function createAndMailToken(req, res, next) {
  const user = res.locals.user;
  const token = crypto.randomBytes(16).toString('hex');

  const newToken = new Token({
    userId: user._id,
    token
  });

  newToken
    .save()
    .then(token => {
      const mailOptions = {
        from: 'no-reply@coolapp.com',
        to: user.email,
        subject: 'Coolapp account verification',
        text: `Hello ${user.firstName},
          
          Please verify your account by clicking the link: 
          ${keys.clientURL}/confirmemail?token=${token.token}`
      };

      mailer.send(mailOptions);
      res.json({
        success: true,
        msg: `A verification email has been sent to ${user.email}.`
      });
    })
    .catch(next);
}

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
            res.locals.user = user;
            createAndMailToken(req, res, next);
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
          return res.json({ success: true, token: tokenForuser(user) });
        })
        .catch(next);
    })
    .catch(next);
};

const isItAvailable = (req, res, next) => {
  const { username, email } = req.body;

  User.findOne()
    .or([{ username }, { email }])
    .then(user => {
      if (!user) {
        return res.json({ success: true });
      }

      const response = { success: false };

      if (user.username === username) {
        response.field = 'username';
      }
      if (user.email === email) {
        response.field = 'email';
      }

      return res.json(response);
    })
    .catch(next);
};

const googleOAuth = (req, res) => {
  res.json({ success: true, token: tokenForuser(req.user) });
};

const confirmation = [
  (req, res, next) => {
    Token.findOne({ token: req.body.token })
      .then(token => {
        if (!token) {
          return res.status(401).json({
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
          return res.status(401).json({
            success: false,
            msg: 'We were unable to find a user for this token.'
          });
        }
        if (user.isVerified) {
          return res.status(400).json({
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

      res.locals.user = user;
      createAndMailToken(req, res, next);
    })
    .catch(next);
};

module.exports = {
  signup,
  signin,
  isItAvailable,
  googleOAuth,
  confirmation,
  resend
};
