const express = require('express');
const router = express.Router();
const validate = require('express-validation');

const { profileUpdate } = require('../controllers/userController');

// Validators configuration
const profileValidation = require('../validation/profile');

// @route  PATCH user/profile
// @desc   Update user profile
// @access Private
router.patch(
  '/profile',
  (req, res, next) => {
    console.log(req.body);
    next();
  },
  validate(profileValidation),
  profileUpdate
);

module.exports = router;
