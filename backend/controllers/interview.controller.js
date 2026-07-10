const Interview = require('../models/interview.model');
const InterviewQuestionBank = require('../models/interview-question-bank.model');
const Resume = require('../models/resume.model');
const pdfParse = require('pdf-parse');
const aiService = require('../services/ai.service');
const storageService = require('../services/storage.service');
const sendResponse = require('../utils/ResponseWrapper');
const { BadRequestError, NotFoundError } = require('../utils/CustomError');

// ─── INTERVIEW SESSIONS ───────────────────────────────────

/**
 * POST /api/v1/interviews/start
 * Start a new AI mock interview session
 */
const startInterview = async (req, res, next) => {
  try {
    const {
      format = 'text',
      interviewType = 'mixed',
      role = 'Software Engineer',
      company = '',
      yearsOfExperience = 'fresher',
      totalQuestions = 10,
      duration = 30,
      resumeId,
      jobDescription = '',
      aiProvider,
    } = req.body;

    let resumeContext = '';
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
      if (resume) resumeContext = resume.extractedText;
    }

    // Generate the first opening question from AI
    const sessionConfig = { role, interviewType, company, totalQuestions, currentQuestion: 0 };
    const openingMessage = await aiService.interviewChat(
      [{ role: 'interviewer', content: 'Start the interview with a greeting and first question.' }],
      sessionConfig,
      aiProvider || 'groq'
    );

    const interview = await Interview.create({
      user: req.user._id,
      format,
      interviewType,
      role,
      company,
      yearsOfExperience,
      totalQuestions,
      duration,
      resumeContext,
      jobDescription,
      aiProvider: aiProvider || 'groq',
      messages: [{
        role: 'interviewer',
        content: openingMessage,
        timestamp: new Date(),
      }],
    });

    sendResponse(res, 201, 'Interview session started', {
      interview: {
        _id: interview._id,
        format: interview.format,
        interviewType: interview.interviewType,
        role: interview.role,
        company: interview.company,
        totalQuestions: interview.totalQuestions,
        currentQuestionIndex: 0,
        status: interview.status,
      },
      firstMessage: openingMessage,
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/interviews/:id/respond
 * Send a candidate response and get the next interviewer message
 */
const respondToInterview = async (req, res, next) => {
  try {
    const { message, audioUrl, videoUrl } = req.body;
    if (!message && !audioUrl) return next(new BadRequestError('Response message is required'));

    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id, status: 'in-progress' });
    if (!interview) return next(new NotFoundError('Active interview session not found'));

    // Add candidate response
    interview.messages.push({
      role: 'candidate',
      content: message || '[Audio Response]',
      audioUrl: audioUrl || '',
      videoUrl: videoUrl || '',
      timestamp: new Date(),
    });

    interview.currentQuestionIndex += 1;
    const isLastQuestion = interview.currentQuestionIndex >= interview.totalQuestions;

    let aiResponse;
    if (isLastQuestion) {
      // Generate closing / wrap-up message
      const sessionConfig = {
        role: interview.role,
        interviewType: interview.interviewType,
        company: interview.company,
        totalQuestions: interview.totalQuestions,
        currentQuestion: interview.currentQuestionIndex,
      };
      aiResponse = await aiService.interviewChat(
        [...interview.messages, { role: 'system', content: 'This was the last question. Thank the candidate, close the interview, and say feedback will be shared shortly.' }],
        sessionConfig,
        interview.aiProvider
      );
      interview.status = 'completed';
      interview.endTime = new Date();
    } else {
      // Get next question from AI
      const sessionConfig = {
        role: interview.role,
        interviewType: interview.interviewType,
        company: interview.company,
        totalQuestions: interview.totalQuestions,
        currentQuestion: interview.currentQuestionIndex,
      };
      aiResponse = await aiService.interviewChat(interview.messages, sessionConfig, interview.aiProvider);
    }

    interview.messages.push({
      role: 'interviewer',
      content: aiResponse,
      isFollowUp: interview.currentQuestionIndex > 1,
      timestamp: new Date(),
    });

    await interview.save();

    sendResponse(res, 200, isLastQuestion ? 'Interview completed' : 'Response recorded', {
      aiMessage: aiResponse,
      currentQuestionIndex: interview.currentQuestionIndex,
      totalQuestions: interview.totalQuestions,
      isCompleted: isLastQuestion,
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/interviews/:id/feedback
 * Generate AI post-interview feedback
 */
const generateFeedback = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'completed',
    });
    if (!interview) return next(new NotFoundError('Completed interview not found'));
    if (interview.aiFeedback?.overallScore > 0) {
      return sendResponse(res, 200, 'Feedback already generated', interview.aiFeedback);
    }

    // Build transcript for evaluation
    const transcript = interview.messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const feedbackPrompt = `Evaluate this ${interview.interviewType} job interview for a ${interview.role} position.\n\nTranscript:\n${transcript}\n\nProvide detailed feedback as JSON: {"overallScore":75,"technicalScore":70,"communicationScore":80,"confidenceScore":75,"structureScore":65,"strengthPoints":["..."],"improvementPoints":["..."],"suggestedResources":["..."],"detailedFeedback":"...","questionWiseFeedback":[{"questionIndex":0,"score":70,"feedback":"...","idealAnswer":"..."}]}`;

    const feedbackRaw = await aiService.evaluateInterview(
      transcript,
      interview.role,
      interview.interviewType,
      interview.company,
      interview.aiProvider
    );

    // Structure feedback
    let feedback = typeof feedbackRaw === 'object' ? feedbackRaw : {};

    interview.aiFeedback = {
      overallScore: feedback.overallScore || 0,
      technicalScore: feedback.technicalScore || 0,
      communicationScore: feedback.communicationScore || 0,
      confidenceScore: feedback.confidenceScore || 0,
      structureScore: feedback.structureScore || 0,
      strengthPoints: feedback.strengthPoints || [],
      improvementPoints: feedback.improvementPoints || [],
      suggestedResources: feedback.suggestedResources || [],
      detailedFeedback: feedback.detailedFeedback || feedback.feedback || 'Feedback generated.',
      questionWiseFeedback: feedback.questionWiseFeedback || [],
      generatedAt: new Date(),
    };

    await interview.save();
    sendResponse(res, 200, 'Interview feedback generated', interview.aiFeedback);
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/interviews
 * Get user's interview history
 */
const getMyInterviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [interviews, total] = await Promise.all([
      Interview.find(query).sort('-createdAt').skip(skip).limit(Number(limit))
        .select('-messages -resumeContext').lean(),
      Interview.countDocuments(query),
    ]);

    sendResponse(res, 200, 'Interviews retrieved', {
      interviews,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/interviews/:id
 * Get interview session with full transcript
 */
const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return next(new NotFoundError('Interview not found'));
    sendResponse(res, 200, 'Interview retrieved', interview);
  } catch (err) { next(err); }
};

// ─── INTERVIEW QUESTION BANK ──────────────────

/**
 * GET /api/v1/interviews/questions
 * Browse interview question bank with filters
 */
const getInterviewQuestions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, role, company, difficulty, search } = req.query;
    const query = { isPublic: { $ne: false } };
    if (category && category !== 'all') query.category = category;
    if (role && role !== 'all') query.role = new RegExp(role, 'i');
    if (company && company !== 'all') query.company = company.toLowerCase();
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (search) query.question = new RegExp(search, 'i');

    const skip = (page - 1) * limit;
    const [questions, total] = await Promise.all([
      InterviewQuestionBank.find(query).sort('-createdAt').skip(skip).limit(Number(limit)).lean(),
      InterviewQuestionBank.countDocuments(query),
    ]);

    sendResponse(res, 200, 'Interview questions retrieved', {
      questions,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/interviews/questions/generate
 * AI-generate interview questions
 */
const generateInterviewQuestions = async (req, res, next) => {
  try {
    const { role, interviewType, company, count = 10, aiProvider } = req.body;
    if (!role && !interviewType) return next(new BadRequestError('Role or interview type is required'));

    const questions = await aiService.generateInterviewQuestions(
      { role, interviewType, company, count: Number(count) },
      aiProvider
    );

    // Optionally save to question bank
    const { saveToBank } = req.body;
    if (saveToBank) {
      const toInsert = questions.map(q => ({
        question: q.question,
        category: q.category || interviewType || 'technical',
        role: role || '',
        company: company?.toLowerCase() || '',
        difficulty: q.difficulty || 'medium',
        sampleAnswer: q.sampleAnswer || '',
        followUpQuestions: q.followUpQuestions || [],
        tips: q.tips || '',
        source: 'ai-generated',
        createdBy: req.user._id,
        isPublic: true,
      }));
      await InterviewQuestionBank.insertMany(toInsert, { ordered: false });
    }

    sendResponse(res, 200, 'Interview questions generated', questions);
  } catch (err) { next(err); }
};

// ─── RESUME COACH ──────────────────────────────

/**
 * POST /api/v1/interviews/resume/upload
 * Upload resume to Firebase Storage + analyze with AI
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return next(new BadRequestError('Resume PDF file is required'));

    // Validate file
    storageService.constructor.validateFile(req.file, 'pdf', 10);

    // Extract text from the PDF buffer using pdf-parse
    let extractedText = '';
    try {
      const u8 = new Uint8Array(req.file.buffer.buffer, req.file.buffer.byteOffset, req.file.buffer.byteLength);
      const parser = new pdfParse.PDFParse(u8);
      const pdfData = await parser.getText();
      extractedText = pdfData.text || '';
    } catch (parseErr) {
      console.error(`PDF text extraction failed: ${parseErr.message}`);
      extractedText = 'Unable to parse PDF text.';
    }

    // Upload to Firebase Storage
    const fileUrl = await storageService.uploadMulterFile(
      req.file, 'resumes', req.user._id.toString()
    );

    // Save resume record
    const resume = await Resume.create({
      user: req.user._id,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      extractedText,
    });

    sendResponse(res, 201, 'Resume uploaded. Use /analyze to get AI feedback.', {
      resumeId: resume._id,
      fileUrl,
      fileName: resume.fileName,
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/interviews/resume/:id/analyze
 * Run AI analysis on uploaded resume
 */
const analyzeResume = async (req, res, next) => {
  try {
    const { jobDescription = '', jobTitle = '', aiProvider } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return next(new NotFoundError('Resume not found'));

    // Note: In production, use a PDF text extraction library (pdf-parse)
    // For now we use any extractedText already stored, or a placeholder
    const textToAnalyze = resume.extractedText || `Resume file: ${resume.fileName}. Unable to extract text — please ensure PDF text extraction is configured.`;

    const analysis = await aiService.analyzeResume(textToAnalyze, jobDescription, aiProvider);

    // Generate tailored interview questions based on resume
    const suggestedQuestions = analysis.suggestedQuestions || [];

    resume.atsScore = analysis.atsScore || 0;
    resume.keywordMatch = analysis.keywordMatch || { matched: [], missing: [] };
    resume.sectionFeedback = analysis.sectionFeedback || {};
    resume.jobMatchScore = analysis.jobMatchScore || 0;
    resume.jobDescription = jobDescription;
    resume.jobTitle = jobTitle;
    resume.suggestedQuestions = suggestedQuestions;
    resume.isAnalyzed = true;
    resume.analyzedAt = new Date();
    await resume.save();

    sendResponse(res, 200, 'Resume analyzed', resume);
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/interviews/resume
 * Get user's resumes
 */
const getMyResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort('-createdAt').lean();
    sendResponse(res, 200, 'Resumes retrieved', resumes);
  } catch (err) { next(err); }
};

module.exports = {
  startInterview, respondToInterview, generateFeedback,
  getMyInterviews, getInterviewById,
  getInterviewQuestions, generateInterviewQuestions,
  uploadResume, analyzeResume, getMyResumes,
};
