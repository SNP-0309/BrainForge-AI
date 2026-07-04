const express = require('express');
const {
  getUserRoadmaps,
  generateRoadmap,
  getRoadmapById,
  updateRoadmapNodeStatus,
} = require('../controllers/roadmap.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getUserRoadmaps)
  .post(generateRoadmap);

router.route('/:id')
  .get(getRoadmapById);

router.route('/:id/node/:nodeId')
  .put(updateRoadmapNodeStatus);

module.exports = router;
