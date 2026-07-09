const express = require('express');
const multer = require('multer');
const { protect, restrictTo } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  startInterviewSchema,
  respondToInterviewSchema,
  generateInterviewQuestionsSchema,
  analyzeResumeSchema,
} = require('../validators/interview.validator');
const {
  startInterview, respondToInterview, generateFeedback,
  getMyInterviews, getInterviewById,
  getInterviewQuestions, generateInterviewQuestions,
  uploadResume, analyzeResume, getMyResumes,
} = require('../controllers/interview.controller');

const router = express.Router();

// Multer config — memory storage so files go straight to Firebase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// All routes require authentication
router.use(protect);

// ─── SESSIONS ─────────────────────────────────
router.get('/', getMyInterviews);
router.post('/start', validate(startInterviewSchema), startInterview);
router.post('/:id/respond', validate(respondToInterviewSchema), respondToInterview);
router.post('/:id/feedback', generateFeedback);
router.get('/:id', getInterviewById);

// ─── QUESTION BANK ────────────────────────────
router.get('/questions', getInterviewQuestions);
router.post('/questions/generate', validate(generateInterviewQuestionsSchema), generateInterviewQuestions);

// ─── RESUME COACH ──────────────────────────────
router.get('/resume', getMyResumes);
router.post('/resume/upload', upload.single('resume'), uploadResume);
router.post('/resume/:id/analyze', validate(analyzeResumeSchema), analyzeResume);

module.exports = router;

