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

jest.mock('../models/user.model');
jest.mock('../models/course.model');
jest.mock('../models/lesson.model');
jest.mock('../models/quiz.model');
jest.mock('../models/quiz-attempt.model');
jest.mock('../models/achievement.model');
jest.mock('../models/user-achievement.model');

// Mock firebase admin configuration
jest.mock('../config/firebase.js', () => ({
  apps: [],
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
});
