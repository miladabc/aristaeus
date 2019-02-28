const express = require('express');
const router = express.Router();

const validate = require('../validation');
const { ProfileSchema } = require('../validation/schema');
const { updateProfile } = require('../controllers/userController');

// @route  PATCH user/profile
// @desc   Update user profile
// @access Private
router.patch('/profile', validate(ProfileSchema), updateProfile);

module.exports = router;
