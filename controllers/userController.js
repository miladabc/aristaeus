const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary');

const keys = require('../config/keys');
const User = require('../models/user');
const { jwtForUser, createAndMailToken } = require('../utils');
const { emailVerifyTemplate } = require('../services/emailTemplates');

const deleteAvatarFromCloud = avatar => {
  if (avatar) {
    cloudinary.v2.uploader.destroy(avatar.slice(0, -4), {
      invalidate: true
    });
  }
};

const getUser = (req, res) => {
  res.json({ success: true, token: jwtForUser(req.user) });
};

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

    if (!currentPassword) {
      res.locals.user = user;
      return next();
    }

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
  },
  (req, res, next) => {
    const user = res.locals.user;

    user
      .save()
      .then(user => {
        res.json({
          success: true,
          msg: 'Profile has been successfully updated',
          token: jwtForUser(user)
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

const updateProfileAvatar = (req, res, next) => {
  deleteAvatarFromCloud(req.user.avatar);

  const avatar = `${req.body.public_id}.${req.body.format}`;

  req.user.avatar = avatar;

  req.user
    .save()
    .then(user => {
      res.json({
        success: true,
        msg: 'Avatar has been successfully changed',
        token: jwtForUser(user)
      });
    })
    .catch(next);
};

const deleteProfileAvatar = (req, res, next) => {
  deleteAvatarFromCloud(req.user.avatar);

  req.user.avatar = '';

  req.user
    .save()
    .then(user => {
      res.json({
        success: true,
        msg: 'Avatar has been removed',
        token: jwtForUser(user)
      });
    })
    .catch(next);
};

module.exports = {
  getUser,
  updateProfile,
  updateProfileAvatar,
  deleteProfileAvatar
};
