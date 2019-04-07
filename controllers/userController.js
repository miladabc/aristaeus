const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary');

const keys = require('../config/keys');
const { wrap } = require('../utils');
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

const updateProfile = wrap(async (req, res, next) => {
  const user = req.user;
  const {
    firstName,
    lastName,
    username,
    email,
    currentPassword,
    newPassword
  } = req.body;

  if (username || email) {
    const users = await User.find().or([{ username }, { email }]);

    if (users.length > 0) {
      const response = { success: false };

      users.forEach(user => {
        if (user.username === username)
          response.msg = 'Username already in use';
        if (user.email === email) response.msg = 'Email already in use';
      });

      return res.status(422).json(response);
    }
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (username) user.username = username;
  if (email) {
    user.email = email;
    user.isVerified = false;
  }

  if (currentPassword) {
    // Check current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    // Password does not match
    if (!passwordMatch) {
      return res
        .status(422)
        .json({ success: false, msg: 'Incorrect current password' });
    }

    // Current password matched, hash new password
    user.password = await bcrypt.hash(newPassword, keys.saltFactor);
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    msg: 'Profile has been successfully updated',
    token: jwtForUser(updatedUser)
  });

  if (!updatedUser.isVerified) {
    createAndMailToken({
      user: updatedUser,
      subject: 'Coolapp account verification',
      content: emailVerifyTemplate,
      next
    });
  }
});

const updateProfileAvatar = wrap(async (req, res, next) => {
  deleteAvatarFromCloud(req.user.avatar);

  const avatar = `${req.body.public_id}.${req.body.format}`;

  req.user.avatar = avatar;

  const user = await req.user.save();

  res.json({
    success: true,
    msg: 'Avatar has been successfully changed',
    token: jwtForUser(user)
  });
});

const deleteProfileAvatar = wrap(async (req, res, next) => {
  deleteAvatarFromCloud(req.user.avatar);

  req.user.avatar = '';

  const user = await req.user.save();

  res.json({
    success: true,
    msg: 'Avatar has been removed',
    token: jwtForUser(user)
  });
});

module.exports = {
  getUser,
  updateProfile,
  updateProfileAvatar,
  deleteProfileAvatar
};
