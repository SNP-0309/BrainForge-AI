const Quiz = require('../models/quiz.model');
const QuizAttempt = require('../models/quiz-attempt.model');
const aiService = require('../services/ai.service');
const gamificationService = require('../services/gamification.service');
const sendResponse = require('../utils/ResponseWrapper');
const { NotFoundError, BadRequestError } = require('../utils/CustomError');

const generateQuiz = async (req, res, next) => {
  try {
    const { topic, questionCount = 5, difficulty = 'intermediate', lessonId, courseId } = req.body;
    
    if (!topic) {
      return next(new BadRequestError('Topic is required'));
    }

    const generatedQuestions = await aiService.generateQuiz(topic, questionCount, difficulty);

    const quiz = await Quiz.create({
      title: `Quiz: ${topic}`,
      description: `AI generated test covering ${topic}`,
      course: courseId || null,
      lesson: lessonId || null,
      questions: generatedQuestions,
      difficulty,
      isAiGenerated: true,
    });

    // Strip out correctAnswerIndex for the client response
    const sanitizedQuestions = quiz.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      points: q.points,
    }));

    sendResponse(res, 201, 'AI Quiz generated successfully', {
      quizId: quiz._id,
      title: quiz.title,
      description: quiz.description,
      questions: sanitizedQuestions,
      difficulty: quiz.difficulty,
    });
  } catch (error) {
    next(error);
  }
};

const getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return next(new NotFoundError('Quiz not found'));
    }

    // Strip answers
    const sanitizedQuestions = quiz.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      points: q.points,
    }));

    sendResponse(res, 200, 'Quiz retrieved successfully', {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      questions: sanitizedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

const submitQuiz = async (req, res, next) => {
  try {
    const quizId = req.params.id;
    const { answers, timeTaken } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return next(new NotFoundError('Quiz not found'));
    }

    let score = 0;
    let maxScore = 0;
    const results = [];

    quiz.questions.forEach((question, idx) => {
      maxScore += question.points;
      
      const userAnswer = answers.find(ans => ans.questionIndex === idx);
      const isCorrect = userAnswer && userAnswer.selectedIndex === question.correctAnswerIndex;

      if (isCorrect) {
        score += question.points;
      }

      results.push({
        questionIndex: idx,
        questionText: question.questionText,
        userSelection: userAnswer ? userAnswer.selectedIndex : -1,
        correctAnswerIndex: question.correctAnswerIndex,
        isCorrect,
        explanation: question.explanation,
      });
    });

    const passThreshold = 0.7; // 70% to pass
    const isPassed = score / maxScore >= passThreshold;

    // Calculate XP and Coin rewards
    let xpEarned = 0;
    let coinsEarned = 0;

    if (score > 0) {
      // 1 XP per point scored + 2 XP base
      xpEarned = score + 5;
      coinsEarned = Math.ceil(score / 10);

      // Pass bonus
      if (isPassed) {
        xpEarned += 25;
        coinsEarned += 5;
      }

      // Award to user profile
      await gamificationService.awardRewards(req.user._id, xpEarned, coinsEarned);
    }

    // Log the attempt
    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quizId,
      score,
      maxScore,
      timeTaken: timeTaken || 0,
      xpEarned,
      coinsEarned,
      isPassed,
      answers,
    });

    // Check & unlock achievements
    const newlyUnlocked = await gamificationService.checkAndUnlockAchievements(req.user._id, {
      quizScore: (score / maxScore) * 100,
    });

    sendResponse(res, 200, 'Quiz evaluated successfully', {
      attemptId: attempt._id,
      score,
      maxScore,
      isPassed,
      xpEarned,
      coinsEarned,
      results,
      newlyUnlockedAchievements: newlyUnlocked,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateQuiz,
  getQuizById,
  submitQuiz,
};
