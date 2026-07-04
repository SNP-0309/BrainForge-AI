const express = require('express');
const { getAllAchievements, getMyAchievements } = require('../controllers/utility.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllAchievements);
router.get('/me', getMyAchievements);

module.exports = router;
