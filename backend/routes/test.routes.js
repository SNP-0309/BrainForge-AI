const express = require('express');
const { protect, restrictTo } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createTestSchema,
  generateAITestSchema,
  saveAnswerSchema,
  logProctoringEventSchema,
} = require('../validators/test.validator');
const {
  getTests, getTestById, createTest, generateAITest,
  getQuestions, addQuestion, addQuestionsBulk,
  startAttempt, saveAnswer, submitAttempt, pauseAttempt, resumeAttempt,
  getAttemptResult, getMyAttempts,
  logProctoringEvent, recordProctoringConsent,
} = require('../controllers/test.controller');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── TESTS ────────────────────────────────────
router.get('/', getTests);
router.post('/generate', validate(generateAITestSchema), generateAITest);
router.get('/my-attempts', getMyAttempts);

router.route('/questions')
  .get(getQuestions)
  .post(restrictTo('teacher', 'admin'), addQuestion);

router.post('/questions/bulk', restrictTo('teacher', 'admin'), addQuestionsBulk);

router.get('/:id', getTestById);
router.post('/', restrictTo('teacher', 'admin'), validate(createTestSchema), createTest);

// ─── ATTEMPT LIFECYCLE ────────────────────────
router.post('/:id/start', startAttempt);

router.patch('/attempts/:attemptId/answer', validate(saveAnswerSchema), saveAnswer);
router.post('/attempts/:attemptId/submit', submitAttempt);
router.patch('/attempts/:attemptId/pause', pauseAttempt);
router.patch('/attempts/:attemptId/resume', resumeAttempt);
router.get('/attempts/:attemptId/result', getAttemptResult);

// ─── PROCTORING ───────────────────────────────
router.post('/attempts/:attemptId/proctor-event', validate(logProctoringEventSchema), logProctoringEvent);
router.post('/attempts/:attemptId/proctor-consent', recordProctoringConsent);

module.exports = router;

