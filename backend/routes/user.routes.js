const express = require('express');
const { getProfile, updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { updateProfileSchema } = require('../validators/user.validator');

const router = express.Router();

router.use(protect);

router.route('/me')
  .get(getProfile)
  .put(validate(updateProfileSchema), updateProfile);

module.exports = router;

