const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  getDailyMission,
  completeMissionTask,
  claimMissionRewards,
} = require('../controllers/mission.controller');

const router = express.Router();

router.use(protect);

router.get('/today', getDailyMission);
router.put('/task/:taskId/complete', completeMissionTask);
router.post('/claim', claimMissionRewards);

module.exports = router;
