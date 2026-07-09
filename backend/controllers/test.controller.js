const Test = require('../models/test.model');
const TestAttempt = require('../models/test-attempt.model');
const QuestionBank = require('../models/question-bank.model');
const ProctoringLog = require('../models/proctoring-log.model');
const testService = require('../services/test.service');
const aiService = require('../services/ai.service');
const sendResponse = require('../utils/ResponseWrapper');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/CustomError');

// ─── TESTS ───────────────────────────────────

/**
 * GET /api/v1/tests
 * List public tests with filtering/pagination
 */
const getTests = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, type, subject, difficulty, search } = req.query;
    const query = { isPublic: true };
    if (type) query.type = type;
    if (subject) query.subject = new RegExp(subject, 'i');
    if (difficulty) query.difficulty = difficulty;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [tests, total] = await Promise.all([
      Test.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).populate('createdBy', 'name profile.avatar').lean(),
      Test.countDocuments(query),
    ]);

    sendResponse(res, 200, 'Tests retrieved', {
      tests,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/tests/:id
 * Get test details (without answers)
 */
const getTestById = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id).populate('createdBy', 'name profile.avatar');
    if (!test) return next(new NotFoundError('Test not found'));
    sendResponse(res, 200, 'Test retrieved', test);
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/tests
 * Create a new test (teacher/admin only)
 */
const createTest = async (req, res, next) => {
  try {
    const test = await Test.create({ ...req.body, createdBy: req.user._id });
    sendResponse(res, 201, 'Test created', test);
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/tests/generate
 * AI-generate a test paper
 */
const generateAITest = async (req, res, next) => {
  try {
    const { topic, count = 10, difficulty = 'mixed', type = 'mcq', subject, aiProvider } = req.body;
    if (!topic) return next(new BadRequestError('Topic is required'));

    const result = await testService.generateAITest(
      { topic, count: Number(count), difficulty, type, subject },
      req.user._id,
      aiProvider
    );
    sendResponse(res, 201, 'AI test generated', result);
  } catch (err) { next(err); }
};

// ─── QUESTION BANK ────────────────────────────

/**
 * GET /api/v1/tests/questions
 * Browse question bank with filters
 */
const getQuestions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, topic, difficulty, type, examType, search } = req.query;
    const query = { isPublic: true };
    if (topic) query.topic = new RegExp(topic, 'i');
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    if (examType) query.examType = examType;
    if (search) query.question = new RegExp(search, 'i');

    const skip = (page - 1) * limit;
    const [questions, total] = await Promise.all([
      QuestionBank.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      QuestionBank.countDocuments(query),
    ]);

    sendResponse(res, 200, 'Questions retrieved', {
      questions,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/tests/questions
 * Add a question to the bank
 */
const addQuestion = async (req, res, next) => {
  try {
    const question = await QuestionBank.create({ ...req.body, createdBy: req.user._id });
    sendResponse(res, 201, 'Question added', question);
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/tests/questions/bulk
 * Add multiple questions (e.g. from AI generation)
 */
const addQuestionsBulk = async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return next(new BadRequestError('Questions array is required'));
    }
    const toInsert = questions.map(q => ({ ...q, createdBy: req.user._id }));
    const inserted = await QuestionBank.insertMany(toInsert);
    sendResponse(res, 201, `${inserted.length} questions added`, inserted);
  } catch (err) { next(err); }
};

// ─── ATTEMPTS ─────────────────────────────────

/**
 * POST /api/v1/tests/:id/start
 * Start a test attempt
 */
const startAttempt = async (req, res, next) => {
  try {
    const attempt = await testService.startAttempt(req.params.id, req.user._id);
    // Return test with questions (answers hidden)
    const test = await testService.getTestWithQuestions(req.params.id);
    sendResponse(res, 201, 'Test started', { attempt, test });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/v1/tests/attempts/:attemptId/answer
 * Auto-save an answer during the test
 */
const saveAnswer = async (req, res, next) => {
  try {
    const attempt = await testService.saveAnswer(req.params.attemptId, req.user._id, req.body);
    sendResponse(res, 200, 'Answer saved', { answeredCount: attempt.answers.length });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/tests/attempts/:attemptId/submit
 * Submit the test for grading
 */
const submitAttempt = async (req, res, next) => {
  try {
    const { isAutoSubmit = false } = req.body;
    const attempt = await testService.submitAttempt(req.params.attemptId, req.user._id, isAutoSubmit);
    sendResponse(res, 200, 'Test submitted successfully', attempt);
  } catch (err) { next(err); }
};

/**
 * PATCH /api/v1/tests/attempts/:attemptId/pause
 * Pause a practice test
 */
const pauseAttempt = async (req, res, next) => {
  try {
    const { timeRemaining } = req.body;
    const attempt = await testService.pauseAttempt(req.params.attemptId, req.user._id, timeRemaining);
    sendResponse(res, 200, 'Test paused', attempt);
  } catch (err) { next(err); }
};

/**
 * PATCH /api/v1/tests/attempts/:attemptId/resume
 * Resume a paused test
 */
const resumeAttempt = async (req, res, next) => {
  try {
    const attempt = await testService.resumeAttempt(req.params.attemptId, req.user._id);
    const test = await testService.getTestWithQuestions(attempt.test);
    sendResponse(res, 200, 'Test resumed', { attempt, test });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/tests/attempts/:attemptId/result
 * Get test result and AI analysis
 */
const getAttemptResult = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findOne({
      _id: req.params.attemptId,
      user: req.user._id,
    }).populate('test', 'title type totalMarks passingMarks duration');

    if (!attempt) return next(new NotFoundError('Attempt not found'));
    if (!['submitted', 'auto-submitted'].includes(attempt.status)) {
      return next(new BadRequestError('Test has not been submitted yet'));
    }

    sendResponse(res, 200, 'Test result retrieved', attempt);
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/tests/my-attempts
 * Get all test attempts for the current user
 */
const getMyAttempts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      TestAttempt.find({ user: req.user._id, status: { $in: ['submitted', 'auto-submitted'] } })
        .sort('-createdAt').skip(skip).limit(Number(limit))
        .populate('test', 'title type subject duration totalMarks')
        .lean(),
      TestAttempt.countDocuments({ user: req.user._id, status: { $in: ['submitted', 'auto-submitted'] } }),
    ]);

    sendResponse(res, 200, 'Your attempts retrieved', {
      attempts,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─── PROCTORING ───────────────────────────────

/**
 * POST /api/v1/tests/attempts/:attemptId/proctor-event
 * Log a proctoring event (tab switch, face detection, etc.)
 */
const logProctoringEvent = async (req, res, next) => {
  try {
    const { type, severity, description, questionIndex } = req.body;
    if (!type) return next(new BadRequestError('Event type is required'));

    const log = await testService.logProctoringEvent(
      req.params.attemptId,
      req.user._id,
      { type, severity, description, questionIndex }
    );

    sendResponse(res, 200, 'Proctoring event logged', {
      totalFlags: log.totalFlags,
      riskLevel: log.riskLevel,
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/tests/attempts/:attemptId/proctor-consent
 * Record user's consent to webcam proctoring
 */
const recordProctoringConsent = async (req, res, next) => {
  try {
    const log = await ProctoringLog.findOneAndUpdate(
      { testAttempt: req.params.attemptId, user: req.user._id },
      { consentGiven: true },
      { new: true, upsert: true }
    );
    sendResponse(res, 200, 'Consent recorded', { consentGiven: log.consentGiven });
  } catch (err) { next(err); }
};

module.exports = {
  getTests, getTestById, createTest, generateAITest,
  getQuestions, addQuestion, addQuestionsBulk,
  startAttempt, saveAnswer, submitAttempt, pauseAttempt, resumeAttempt,
  getAttemptResult, getMyAttempts,
  logProctoringEvent, recordProctoringConsent,
};
