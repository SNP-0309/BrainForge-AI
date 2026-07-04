const express = require('express');
const { getNotifications, markNotificationRead } = require('../controllers/utility.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/:id/read')
  .put(markNotificationRead);

module.exports = router;
