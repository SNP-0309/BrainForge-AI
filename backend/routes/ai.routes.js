const express = require('express');
const {
  chatTutor,
  generateNotes,
  reviewCode,
  getWeakTopics,
} = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.post('/tutor/chat', chatTutor);
router.post('/notes/generate', generateNotes);
router.post('/review/code', reviewCode);
router.get('/weak-topics', getWeakTopics);

module.exports = router;
