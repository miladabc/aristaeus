const express = require('express');
const router = express.Router();

const validate = require('../validation');
const { ProfileSchema } = require('../validation/schema');
const {
  updateProfile,
  updateProfileAvatar,
  deleteProfileAvatar
} = require('../controllers/userController');

// @route  PATCH user/profile
// @desc   Update user profile
// @access Private
router.patch('/profile', validate(ProfileSchema), updateProfile);

// @route  PATCH user/profile/avatar
// @desc   Update user avatar
// @access Private
router.patch('/profile/avatar', updateProfileAvatar);

// @route  DELETE user/profile/avatar
// @desc   Delete user avatar
// @access Private
router.delete('/profile/avatar', deleteProfileAvatar);

module.exports = router;
