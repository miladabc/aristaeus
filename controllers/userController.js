const bcrypt = require('bcrypt');

const keys = require('../config/keys');
const User = require('../models/user');
const { jwtForUser, createAndMailToken } = require('../utils');
const { emailVerifyTemplate } = require('../services/emailTemplates');

const updateProfile = [
  (req, res, next) => {
    const { username, email } = req.body;

    if (!(username || email)) {
      return next();
    }

    User.find()
      .or([{ username }, { email }])
      .then(users => {
        if (users.length === 0) {
          return next();
        }

        const response = { success: false };

        users.forEach(user => {
          if (user.username === username)
            response.msg = 'Username already in use';
          if (user.email === email) response.msg = 'Email already in use';
        });

        return res.status(422).json(response);
      })
      .catch(next);
  },
  (req, res, next) => {
    const user = req.user;
    const {
      firstName,
      lastName,
      username,
      email,
      currentPassword,
      newPassword
    } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (username) user.username = username;
    if (email) {
      user.email = email;
      user.isVerified = false;
      res.locals.emailChanged = true;
    }

    if (currentPassword && newPassword) {
      // Check password
      bcrypt
        .compare(currentPassword, user.password)
        .then(isMatch => {
          // Password does not match
          if (!isMatch) {
            return res
              .status(422)
              .json({ success: false, msg: 'Incorrect current password' });
          }

          // Password matched
          user.password = bcrypt.hashSync(newPassword, keys.saltFactor);
          res.locals.user = user;
          next();
        })
        .catch(next);
    }
  },
  (req, res, next) => {
    const user = res.locals.user;

    user
      .save()
      .then(user => {
        const updatedUser = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email
        };

        res.json({
          success: true,
          msg: 'Profile has been successfully updated',
          token: jwtForUser(updatedUser)
        });

        if (res.locals.emailChanged) {
          createAndMailToken({
            user,
            subject: 'Coolapp account verification',
            content: emailVerifyTemplate,
            next
          });
        }
      })
      .catch(next);
  }
];

module.exports = { updateProfile };
