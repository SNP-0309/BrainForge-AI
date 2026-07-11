const express = require('express');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  tutorChatSchema,
  generateNotesSchema,
  reviewCodeSchema,
  generateFlashcardsSchema,
  generateProjectIdeasSchema,
  generateBugHuntSchema,
} = require('../validators/ai.validator');
const {
  chatTutor,
  generateNotes,
  reviewCode,
  generateFlashcards,
  generateProjectIdeas,
  generateBugHuntChallenges,
  getWeakTopics,
} = require('../controllers/ai.controller');

const router = express.Router();

router.use(protect);

router.post('/tutor/chat', validate(tutorChatSchema), chatTutor);
router.post('/notes/generate', validate(generateNotesSchema), generateNotes);
router.post('/review/code', validate(reviewCodeSchema), reviewCode);
router.post('/flashcards/generate', validate(generateFlashcardsSchema), generateFlashcards);
router.post('/projects/generate', validate(generateProjectIdeasSchema), generateProjectIdeas);
router.post('/bughunt/generate', validate(generateBugHuntSchema), generateBugHuntChallenges);
router.get('/weak-topics', getWeakTopics);

module.exports = router;

