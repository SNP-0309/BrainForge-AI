const AIChat = require('../models/ai-chat.model');
const Lesson = require('../models/lesson.model');
const QuizAttempt = require('../models/quiz-attempt.model');
const aiService = require('../services/ai.service');
const sendResponse = require('../utils/ResponseWrapper');
const { NotFoundError, BadRequestError } = require('../utils/CustomError');

const chatTutor = async (req, res, next) => {
  try {
    const { chatId, message, aiProvider } = req.body;
    if (!message) {
      return next(new BadRequestError('Message is required'));
    }

    let chat;
    if (chatId) {
      chat = await AIChat.findOne({ _id: chatId, user: req.user._id });
      if (!chat) {
        return next(new NotFoundError('Chat session not found'));
      }
    } else {
      chat = await AIChat.create({
        user: req.user._id,
        provider: aiProvider || 'gemini',
        model: aiProvider === 'groq' ? 'llama3-8b-8192' : 'gemini-1.5-flash',
        messages: [],
      });
    }

    chat.messages.push({ sender: 'user', content: message });

    const aiResponse = await aiService.chat(chat.messages, null, aiProvider);

    chat.messages.push({ sender: 'assistant', content: aiResponse });

    // Set title based on first user message if it is default
    if (chat.title === 'New AI Chat Session' && chat.messages.length >= 2) {
      chat.title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
    }

    await chat.save();

    sendResponse(res, 200, 'AI Tutor response received', {
      chatId: chat._id,
      title: chat.title,
      response: aiResponse,
      messages: chat.messages,
    });
  } catch (error) {
    next(error);
  }
};

const generateNotes = async (req, res, next) => {
  try {
    const { lessonId, topic, aiProvider } = req.body;
    if (!lessonId && !topic) {
      return next(new BadRequestError('Either Lesson ID or Topic is required'));
    }

    let notes;
    if (lessonId) {
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return next(new NotFoundError('Lesson not found'));
      }
      notes = await aiService.generateNotes(lesson.title, lesson.content, aiProvider);
    } else {
      notes = await aiService.generateNotes(topic, `Comprehensive overview and study notes for learning ${topic}.`, aiProvider);
    }
    
    sendResponse(res, 200, 'AI notes generated successfully', { notes });
  } catch (error) {
    next(error);
  }
};

const reviewCode = async (req, res, next) => {
  try {
    const { code, language, aiProvider } = req.body;
    if (!code) {
      return next(new BadRequestError('Code snippet is required'));
    }

    const feedback = await aiService.reviewCode(code, language || 'javascript', aiProvider);
    sendResponse(res, 200, 'AI code review completed', { feedback });
  } catch (error) {
    next(error);
  }
};

const generateFlashcards = async (req, res, next) => {
  try {
    const { topic, count = 5, aiProvider } = req.body;
    if (!topic) {
      return next(new BadRequestError('Topic is required'));
    }

    const flashcards = await aiService.generateFlashcards(topic, Number(count), aiProvider);
    sendResponse(res, 200, 'AI flashcards generated successfully', { flashcards });
  } catch (error) {
    next(error);
  }
};

const generateProjectIdeas = async (req, res, next) => {
  try {
    const { topic, aiProvider } = req.body;
    if (!topic) {
      return next(new BadRequestError('Topic is required'));
    }

    const prompt = `Generate 3 mini project ideas for beginners learning "${topic}". For each project, provide:
1. Title
2. Clear Description
3. Key learning steps
Return the response in clean Markdown with clear headings.`;

    const response = await aiService.chat([
      { sender: 'user', content: prompt }
    ], 'You are an encouraging AI career mentor. Provide practical and engaging mini-project ideas.', aiProvider);

    sendResponse(res, 200, 'AI project ideas generated successfully', { projectIdeas: response });
  } catch (error) {
    next(error);
  }
};

const generateBugHuntChallenges = async (req, res, next) => {
  try {
    const { count = 5, aiProvider } = req.body;
    const challenges = await aiService.generateBugHuntChallenges(Number(count), aiProvider);
    sendResponse(res, 200, 'Bug hunt challenges generated successfully', { challenges });
  } catch (error) {
    next(error);
  }
};

const getWeakTopics = async (req, res, next) => {
  try {
    // Find quiz attempts for the logged in user
    const attempts = await QuizAttempt.find({ user: req.user._id }).populate({
      path: 'quiz',
      populate: { path: 'lesson', select: 'title' }
    });

    const weakTopics = {};

    attempts.forEach(attempt => {
      // If score is less than 70%, mark as a weak topic
      const pct = (attempt.score / attempt.maxScore) * 100;
      if (pct < 70) {
        const topicName = (attempt.quiz && attempt.quiz.title) || 
                          (attempt.quiz && attempt.quiz.lesson ? attempt.quiz.lesson.title : 'General Quiz');
        if (!weakTopics[topicName]) {
          weakTopics[topicName] = {
            failuresCount: 0,
            averageScore: 0,
            totalScores: 0,
            quizId: attempt.quiz ? attempt.quiz._id : null,
          };
        }
        weakTopics[topicName].failuresCount += 1;
        weakTopics[topicName].totalScores += pct;
        weakTopics[topicName].averageScore = weakTopics[topicName].totalScores / weakTopics[topicName].failuresCount;
      }
    });

    const list = Object.keys(weakTopics).map(name => ({
      name,
      ...weakTopics[name]
    })).sort((a, b) => b.failuresCount - a.failuresCount);

    sendResponse(res, 200, 'Weak topics analysis completed', list);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatTutor,
  generateNotes,
  reviewCode,
  generateFlashcards,
  generateProjectIdeas,
  generateBugHuntChallenges,
  getWeakTopics,
};
