const request = require('supertest');
const mongoose = require('mongoose');

// Mock db connection to prevent actual connection during tests
jest.mock('../config/db.js', () => jest.fn().mockImplementation(() => Promise.resolve()));
jest.mock('../config/seed.js', () => jest.fn().mockImplementation(() => Promise.resolve()));

const User = require('../models/user.model');
const Course = require('../models/course.model');
const Lesson = require('../models/lesson.model');
const Quiz = require('../models/quiz.model');
const QuizAttempt = require('../models/quiz-attempt.model');
const Achievement = require('../models/achievement.model');
const UserAchievement = require('../models/user-achievement.model');
const Test = require('../models/test.model');
const TestAttempt = require('../models/test-attempt.model');
const Interview = require('../models/interview.model');

jest.mock('../models/user.model');
jest.mock('../models/course.model');
jest.mock('../models/lesson.model');
jest.mock('../models/quiz.model');
jest.mock('../models/quiz-attempt.model');
jest.mock('../models/achievement.model');
jest.mock('../models/user-achievement.model');
jest.mock('../models/test.model');
jest.mock('../models/test-attempt.model');
jest.mock('../models/interview.model');

// Mock firebase admin configuration
jest.mock('../config/firebase.js', () => ({
  apps: [],
}));

// Mock ai.service
jest.mock('../services/ai.service.js', () => ({
  generateQuiz: jest.fn().mockResolvedValue([
    { questionText: 'Q1', options: ['A', 'B'], correctAnswerIndex: 0, points: 10, explanation: 'exp' }
  ]),
  generateTestPaper: jest.fn().mockResolvedValue([
    { question: 'TQ1', type: 'mcq', options: ['A', 'B'], correctAnswer: 0, explanation: 'exp', marks: 1, topic: 'Node', difficulty: 'easy' }
  ]),
  interviewChat: jest.fn().mockResolvedValue('Interviewer first question'),
}));

const app = require('../server');

describe('BrainForge AI Backend Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Sync Endpoint', () => {
    it('should register a new user when firebaseUid does not exist', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'mongo-user-id-123',
        firebaseUid: 'mock-student-uid',
        name: 'Mock Student',
        email: 'student@brainforge.ai',
        profile: {
          avatar: '',
          xp: 0,
          level: 1,
          coins: 0,
          dailyStreak: 1,
        }
      });
      User.findById.mockResolvedValue({
        _id: 'mongo-user-id-123',
        profile: { level: 1, xp: 0, dailyStreak: 1 }
      });
      UserAchievement.find.mockReturnValue({
        distinct: jest.fn().mockResolvedValue([])
      });
      Achievement.find.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/auth/sync')
        .set('Authorization', 'Bearer mock-student');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('Mock Student');
    });
  });

  describe('Course Endpoints', () => {
    it('should retrieve list of courses', async () => {
      const mockCourses = [
        { title: 'Intro to AI', difficulty: 'beginner' },
        { title: 'Advanced React', difficulty: 'advanced' }
      ];
      
      Course.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockCourses)
      });
      Course.countDocuments.mockResolvedValue(2);
      User.findOne.mockResolvedValue({ _id: 'user-123', role: 'student' });

      const response = await request(app)
        .get('/api/v1/courses')
        .set('Authorization', 'Bearer mock-student');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toHaveLength(2);
    });
  });

  describe('Leaderboard Endpoint', () => {
    it('should return leaderboard list sorted by levels & xp', async () => {
      const mockRankings = [
        { name: 'Alice', profile: { level: 5, xp: 30 } },
        { name: 'Bob', profile: { level: 4, xp: 80 } }
      ];
      
      User.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockRankings)
      });
      User.findOne.mockResolvedValue({ _id: 'user-123' });

      const response = await request(app)
        .get('/api/v1/leaderboard')
        .set('Authorization', 'Bearer mock-student');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('Quiz Generation Endpoint', () => {
    it('should generate an AI quiz successfully', async () => {
      User.findOne.mockResolvedValue({ _id: 'user-123', role: 'student' });
      Quiz.create.mockResolvedValue({
        _id: 'quiz-123',
        title: 'AI Quiz: Node.js',
        questions: [{ questionText: 'Q1', options: ['A', 'B'], correctAnswerIndex: 0, points: 10 }]
      });

      const response = await request(app)
        .post('/api/v1/quizzes/generate')
        .set('Authorization', 'Bearer mock-student')
        .send({ topic: 'Node.js' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('AI Quiz: Node.js');
    });
  });

  describe('Test Engine Endpoints', () => {
    it('should list available public tests', async () => {
      User.findOne.mockResolvedValue({ _id: 'user-123', role: 'student' });
      Test.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ title: 'JavaScript Certification Mock', type: 'mock' }])
      });
      Test.countDocuments.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/tests')
        .set('Authorization', 'Bearer mock-student');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tests).toHaveLength(1);
    });
  });

  describe('Interview Module Endpoints', () => {
    it('should start a mock interview session', async () => {
      User.findOne.mockResolvedValue({ _id: 'user-123', role: 'student' });
      Interview.create.mockResolvedValue({
        _id: 'interview-123',
        role: 'SDE',
        interviewType: 'technical',
        status: 'in-progress'
      });

      const response = await request(app)
        .post('/api/v1/interviews/start')
        .set('Authorization', 'Bearer mock-student')
        .send({ role: 'SDE', interviewType: 'technical' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstMessage).toBe('Interviewer first question');
    });
  });
});
