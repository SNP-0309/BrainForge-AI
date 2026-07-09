const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  runCareerAssessment,
  selectCareerPath,
} = require('../controllers/career.controller');

const router = express.Router();

router.use(protect);

router.post('/assessment', runCareerAssessment);
router.post('/select', selectCareerPath);

module.exports = router;
