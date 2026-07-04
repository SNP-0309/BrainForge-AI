const express = require('express');
const { getLeaderboard } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', getLeaderboard);

module.exports = router;
