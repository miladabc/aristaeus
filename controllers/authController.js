const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary');

const keys = require('../config/keys');
const { wrap } = require('../utils');
const User = require('../models/user');
const Token = require('../models/token');
const { jwtForUser, createAndMailToken } = require('../utils');
const {
  emailVerifyTemplate,
  forgotPassTemplate
} = require('../services/emailTemplates');

const signup = wrap(async (req, res, next) => {
  const { firstName, lastName, username, email, password } = req.body;
  const error = { success: false };

  // Check for existing user
  const existingUser = await User.findOne().or([{ username }, { email }]);

  // If user with provided username or email does exist, response with error
  if (existingUser) {
    if (existingUser.username === username) {
      error.msg = 'Username already exist';
    }
    if (existingUser.email === email) {
      error.msg = 'Email already exist';
    }

    return res.status(422).json(error);
  }

  // User does not exist, so sign the user up
  const newUser = new User({
    firstName,
    lastName,
    username,
    email,
    password
  });

  // Hash password
  newUser.password = await bcrypt.hash(password, keys.saltFactor);

  // Insert user to database
  const savedUser = await newUser.save();

  createAndMailToken({
    user: savedUser,
    subject: 'Coolapp account verification',
    content: emailVerifyTemplate,
    next
  });

  res.json({
    success: true,
    msg: `A verification email has been sent to ${savedUser.email}.`
  });
});

const signin = wrap(async (req, res, next) => {
  const { emailOrUsername, password } = req.body;
  const error = { success: false };

  const user = await User.findOne().or([
    { username: emailOrUsername },
    { email: emailOrUsername }
  ]);

  if (!user) {
    error.msg = 'Email or username does not exist';
    return res.status(422).json(error);
  }

  // Check password
  const passwordMatch = await bcrypt.compare(password, user.password);

  // Password does not match
  if (!passwordMatch) {
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
});

const isItAvailable = wrap(async (req, res, next) => {
  const { username, email } = req.body;

  const users = await User.find().or([{ username }, { email }]);

  if (users.length === 0) {
    return res.json({ success: true });
  }

  const response = { success: false, username: true, email: true };

  users.forEach(user => {
    if (user.username === username) response.username = false;
    if (user.email === email) response.email = false;
  });

  return res.json(response);
});

const googleOAuth = (req, res) => {
  res.json({ success: true, token: jwtForUser(req.user) });
};

const confirmation = wrap(async (req, res, next) => {
  const token = await Token.findOne({ token: req.body.token });

  if (!token) {
    return res.status(404).json({
      success: false,
      msg: 'We were unable to find a valid token. Your token may have expired.'
    });
  }

  const user = await User.findById(token.userId);

  if (!user) {
    return res.status(404).json({
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
  await user.save();

  res.json({
    success: true,
    msg: 'The account has been verified. Please log in.'
  });

  token.remove();
});

const resend = wrap(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      msg: 'We were unable to find a user with that email.'
    });
  }

  if (user.isVerified) {
    return res.status(422).json({
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
});

const forgotPass = wrap(async (req, res, next) => {
  const { emailOrUsername } = req.body;

  const user = await User.findOne().or([
    { username: emailOrUsername },
    { email: emailOrUsername }
  ]);

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
});

const resetPass = wrap(async (req, res, next) => {
  const { password } = req.body;
  const token = await Token.findOne({ token: req.body.token });

  if (!token) {
    return res.status(404).json({
      success: false,
      msg: 'We were unable to find a valid token. Your token may have expired.'
    });
  }

  const user = await User.findById(token.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      msg: 'We were unable to find a user for this token.'
    });
  }

  // Hash password
  user.password = await bcrypt.hash(password, keys.saltFactor);

  // Save the user in database
  await user.save();

  res.json({
    success: true,
    msg: 'Your password has been successfully updated'
  });
  token.remove();
});

const uploadURL = (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp: timestamp, folder: 'avatars' },
    keys.cloudinarySecret
  );
  const url = cloudinary.utils.api_url('upload', {
    cloud_name: 'miladdarren',
    resource_type: 'image'
  });

  res.json({
    signature,
    timestamp,
    api_key: keys.cloudinaryKey,
    url,
    folder: 'avatars'
  });
};

module.exports = {
  signup,
  signin,
  isItAvailable,
  googleOAuth,
  confirmation,
  resend,
  forgotPass,
  resetPass,
  uploadURL
};
