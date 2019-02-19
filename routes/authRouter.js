const express = require('express');
const router = express.Router();
const validate = require('express-validation');
const passport = require('passport');

const {
  signup,
  signin,
  isItAvailable,
  googleOAuth,
  confirmation,
  resend,
  forgotPass,
  resetPass
} = require('../controllers/authController');

// Validator configuration
const validation = require('../validation/index');

// @route  POST auth/signup
// @desc   Sign the user up
// @access Public
router.post('/signup', validate(validation.signup), signup);

// @route  POST auth/signin
// @desc   Sign the user in
// @access Public
router.post('/signin', validate(validation.signin), signin);

// @route  POST auth/isitavailable
// @desc   Check if username or email is available for signup
// @access Public
router.post('/isitavailable', isItAvailable);

// @route  POST auth/google
// @desc   Authenticate user with google token
// @access Private
router.post(
  '/google',
  passport.authenticate('google-token', { session: false }),
  googleOAuth
);

// @route  POST auth/confirmation
// @desc   Confirm email address
// @access Public
router.post('/confirmation', confirmation);

// @route  POST auth/resend
// @desc   Resend confirmation email
// @access Public
router.post('/resend', resend);

// @route  POST auth/forgotpass
// @desc   Send password reset email
// @access Public
router.post('/forgotpass', forgotPass);

// @route  POST auth/resetpass
// @desc   Reset user password
// @access Public
router.post('/resetpass', resetPass);

module.exports = router;
