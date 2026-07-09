const Test = require('../models/test.model');
const TestAttempt = require('../models/test-attempt.model');
const QuestionBank = require('../models/question-bank.model');
const ProctoringLog = require('../models/proctoring-log.model');
const aiService = require('./ai.service');
const gamificationService = require('./gamification.service');
const logger = require('../utils/logger');

class TestService {
  /**
   * Fetch questions for a test (handles sections or flat list).
   */
  async getTestWithQuestions(testId) {
    const test = await Test.findById(testId)
      .populate({
        path: 'questions',
        select: '-correctAnswer -explanation', // Hide answers during test
      })
      .populate({
        path: 'sections.questions',
        select: '-correctAnswer -explanation',
      });
    return test;
  }

  /**
   * Start a new test attempt.
   */
  async startAttempt(testId, userId) {
    const test = await Test.findById(testId);
    if (!test) throw new Error('Test not found');

    // Check attempt limit
    if (test.attemptLimit > 0) {
      const existingAttempts = await TestAttempt.countDocuments({ test: testId, user: userId });
      if (existingAttempts >= test.attemptLimit) {
        throw new Error(`Attempt limit reached (${test.attemptLimit} attempts allowed)`);
      }
    }

    const attemptNumber = (await TestAttempt.countDocuments({ test: testId, user: userId })) + 1;

    const attempt = await TestAttempt.create({
      test: testId,
      user: userId,
      status: 'in-progress',
      timeRemaining: test.duration * 60,
      maxScore: test.totalMarks,
      attemptNumber,
      startTime: new Date(),
    });

    // Create proctoring log if enabled
    if (test.proctoringEnabled) {
      await ProctoringLog.create({
        testAttempt: attempt._id,
        user: userId,
        test: testId,
        consentGiven: false, // Will be updated when user consents
      });
    }

    return attempt;
  }

  /**
   * Save an answer to the current attempt (auto-save).
   */
  async saveAnswer(attemptId, userId, answerData) {
    const attempt = await TestAttempt.findOne({ _id: attemptId, user: userId, status: 'in-progress' });
    if (!attempt) throw new Error('Active test attempt not found');

    const { questionId, answer, timeTaken, isMarkedForReview, sectionIndex = 0 } = answerData;

    const existingIndex = attempt.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    if (existingIndex >= 0) {
      attempt.answers[existingIndex] = {
        ...attempt.answers[existingIndex],
        questionId,
        answer,
        timeTaken: timeTaken || attempt.answers[existingIndex].timeTaken,
        isMarkedForReview: isMarkedForReview !== undefined ? isMarkedForReview : attempt.answers[existingIndex].isMarkedForReview,
        sectionIndex,
        isSkipped: answer === null || answer === undefined,
      };
    } else {
      attempt.answers.push({
        questionId,
        answer,
        timeTaken: timeTaken || 0,
        isMarkedForReview: isMarkedForReview || false,
        sectionIndex,
        isSkipped: answer === null || answer === undefined,
      });
    }

    attempt.currentQuestion = answerData.currentQuestion || attempt.currentQuestion;
    attempt.currentSection = sectionIndex;
    attempt.timeRemaining = answerData.timeRemaining || attempt.timeRemaining;

    await attempt.save();
    return attempt;
  }

  /**
   * Submit a test attempt and calculate score.
   */
  async submitAttempt(attemptId, userId, isAutoSubmit = false) {
    const attempt = await TestAttempt.findOne({
      _id: attemptId,
      user: userId,
      status: { $in: ['in-progress', 'paused'] },
    });
    if (!attempt) throw new Error('Test attempt not found or already submitted');

    const test = await Test.findById(attempt.test).populate('questions');
    if (!test) throw new Error('Test not found');

    // Get all questions (flattened from sections or direct)
    let allQuestions = [];
    if (test.hasSections) {
      test.sections.forEach(section => {
        allQuestions.push(...section.questions);
      });
    } else {
      allQuestions = await QuestionBank.find({ _id: { $in: test.questions } });
    }

    let totalScore = 0;
    const topicMap = {};
    const sectionScoreMap = {};

    // Grade each answer
    for (const ans of attempt.answers) {
      const question = allQuestions.find(q => q._id.toString() === ans.questionId.toString());
      if (!question) continue;

      let isCorrect = false;
      let marksAwarded = 0;

      if (ans.isSkipped || ans.answer === null || ans.answer === undefined) {
        ans.isSkipped = true;
      } else if (question.type === 'mcq' || question.type === 'true-false') {
        isCorrect = String(ans.answer) === String(question.correctAnswer);
        marksAwarded = isCorrect ? question.marks : (test.negativeMarking ? -test.negativeMarkValue : 0);
      } else if (question.type === 'multi-select') {
        const userArr = Array.isArray(ans.answer) ? ans.answer.map(String).sort() : [];
        const correctArr = Array.isArray(question.correctAnswer) ? question.correctAnswer.map(String).sort() : [];
        isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr);
        marksAwarded = isCorrect ? question.marks : (test.negativeMarking ? -test.negativeMarkValue : 0);
      } else if (question.type === 'fill-blank') {
        isCorrect = String(ans.answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
        marksAwarded = isCorrect ? question.marks : 0;
      } else if (question.type === 'descriptive' || question.type === 'coding') {
        // AI evaluation needed — mark for later
        ans.aiEvaluation.isEvaluated = false;
        marksAwarded = 0; // Will be updated after AI evaluation
      }

      ans.isCorrect = isCorrect;
      ans.marksAwarded = Math.max(marksAwarded, test.negativeMarking ? -test.negativeMarkValue : 0);
      totalScore += ans.marksAwarded;

      // Track topic performance
      const topic = question.topic || 'General';
      if (!topicMap[topic]) topicMap[topic] = { correct: 0, wrong: 0, total: 0 };
      topicMap[topic].total++;
      if (isCorrect) topicMap[topic].correct++;
      else if (!ans.isSkipped) topicMap[topic].wrong++;

      // Track section scores
      const sectionKey = `section_${ans.sectionIndex}`;
      if (!sectionScoreMap[sectionKey]) {
        sectionScoreMap[sectionKey] = {
          sectionName: test.hasSections ? (test.sections[ans.sectionIndex]?.name || `Section ${ans.sectionIndex + 1}`) : 'Main',
          score: 0,
          maxScore: 0,
          correctCount: 0,
          wrongCount: 0,
          skippedCount: 0,
        };
      }
      sectionScoreMap[sectionKey].score += ans.marksAwarded;
      sectionScoreMap[sectionKey].maxScore += question.marks;
      if (isCorrect) sectionScoreMap[sectionKey].correctCount++;
      else if (ans.isSkipped) sectionScoreMap[sectionKey].skippedCount++;
      else sectionScoreMap[sectionKey].wrongCount++;
    }

    const maxScore = test.totalMarks || allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const percentage = maxScore > 0 ? Math.max(0, (totalScore / maxScore) * 100) : 0;
    const passed = percentage >= (test.passingMarks / maxScore * 100) || false;

    const topicAnalysis = Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      correct: data.correct,
      wrong: data.wrong,
      total: data.total,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));

    const weakTopics = topicAnalysis.filter(t => t.accuracy < 50).map(t => t.topic);
    const strongTopics = topicAnalysis.filter(t => t.accuracy >= 80).map(t => t.topic);

    // Update attempt
    attempt.status = isAutoSubmit ? 'auto-submitted' : 'submitted';
    attempt.endTime = new Date();
    attempt.score = Math.max(0, totalScore);
    attempt.maxScore = maxScore;
    attempt.percentage = Math.round(percentage * 100) / 100;
    attempt.passed = passed;
    attempt.topicAnalysis = topicAnalysis;
    attempt.sectionScores = Object.values(sectionScoreMap);
    attempt.aiAnalysis = {
      weakTopics,
      strongTopics,
      recommendations: weakTopics.map(t => `Review and practice more ${t} problems`),
      summary: `Score: ${Math.round(percentage)}%. ${passed ? 'You passed! 🎉' : 'Keep practicing to improve.'} Strong areas: ${strongTopics.join(', ') || 'None yet'}. Needs improvement: ${weakTopics.join(', ') || 'None'}.`,
      generatedAt: new Date(),
    };

    await attempt.save();

    // Award XP for test completion
    try {
      const xp = Math.round(percentage / 10) * 5;
      const coins = passed ? 20 : 5;
      await gamificationService.awardRewards(userId, xp, coins);
    } catch (err) {
      logger.error(`Failed to award test rewards: ${err.message}`);
    }

    return attempt;
  }

  /**
   * Pause a test attempt (only allowed for practice tests).
   */
  async pauseAttempt(attemptId, userId, timeRemaining) {
    const attempt = await TestAttempt.findOne({ _id: attemptId, user: userId, status: 'in-progress' });
    if (!attempt) throw new Error('Active attempt not found');

    const test = await Test.findById(attempt.test);
    if (!test.allowPause) throw new Error('This test does not allow pausing');

    attempt.status = 'paused';
    attempt.pausedAt = new Date();
    attempt.timeRemaining = timeRemaining;
    await attempt.save();
    return attempt;
  }

  /**
   * Resume a paused attempt.
   */
  async resumeAttempt(attemptId, userId) {
    const attempt = await TestAttempt.findOne({ _id: attemptId, user: userId, status: 'paused' });
    if (!attempt) throw new Error('Paused attempt not found');

    if (attempt.pausedAt) {
      const pausedDuration = Math.floor((Date.now() - attempt.pausedAt.getTime()) / 1000);
      attempt.totalPausedDuration += pausedDuration;
    }

    attempt.status = 'in-progress';
    attempt.pausedAt = null;
    await attempt.save();
    return attempt;
  }

  /**
   * Log a proctoring event.
   */
  async logProctoringEvent(testAttemptId, userId, eventData) {
    let log = await ProctoringLog.findOne({ testAttempt: testAttemptId, user: userId });
    if (!log) {
      const attempt = await TestAttempt.findById(testAttemptId);
      log = await ProctoringLog.create({
        testAttempt: testAttemptId,
        user: userId,
        test: attempt.test,
      });
    }

    log.events.push({
      type: eventData.type,
      severity: eventData.severity || 'medium',
      description: eventData.description || '',
      snapshotUrl: eventData.snapshotUrl || '',
      questionIndex: eventData.questionIndex || 0,
    });

    log.totalFlags += 1;

    // Determine risk level
    const criticalCount = log.events.filter(e => e.severity === 'critical').length;
    const highCount = log.events.filter(e => e.severity === 'high').length;

    if (criticalCount >= 2 || log.totalFlags >= 10) log.riskLevel = 'flagged';
    else if (highCount >= 3 || log.totalFlags >= 6) log.riskLevel = 'high';
    else if (log.totalFlags >= 3) log.riskLevel = 'medium';
    else if (log.totalFlags >= 1) log.riskLevel = 'low';

    await log.save();

    // Update attempt flag count
    await TestAttempt.findByIdAndUpdate(testAttemptId, {
      $inc: { proctoringFlagCount: 1 },
    });

    return log;
  }

  /**
   * Generate a test paper using AI.
   */
  async generateAITest(config, userId) {
    const { topic, count, difficulty, type, subject, aiProvider } = config;

    const questions = await aiService.generateTestPaper(
      { topic, count, difficulty, type },
      aiProvider
    );

    // Save questions to question bank
    const savedQuestions = await QuestionBank.insertMany(
      questions.map(q => ({
        question: q.question,
        type: q.type || 'mcq',
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        topic,
        subject: subject || topic,
        difficulty: q.difficulty || difficulty,
        marks: q.marks || 1,
        source: 'ai-generated',
        createdBy: userId,
      }))
    );

    // Create the test
    const test = await Test.create({
      title: `AI Generated: ${topic} Test`,
      description: `AI-generated ${difficulty} test on ${topic} with ${count} questions.`,
      type: 'custom',
      subject: subject || topic,
      topics: [topic],
      questions: savedQuestions.map(q => q._id),
      totalMarks: savedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
      passingMarks: Math.ceil(savedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0) * 0.6),
      duration: Math.ceil(count * 1.5), // ~1.5 minutes per question
      createdBy: userId,
      isAiGenerated: true,
      isPublic: false,
    });

    return { test, questions: savedQuestions };
  }
}

module.exports = new TestService();
