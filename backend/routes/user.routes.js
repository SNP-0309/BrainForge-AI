const express = require('express');
const { getProfile, updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/me')
  .get(getProfile)
  .put(updateProfile);

module.exports = router;
