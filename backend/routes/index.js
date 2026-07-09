const express = require('express');
const authRoutes = require('./auth.routes');
const courseRoutes = require('./course.routes');
const lessonRoutes = require('./lesson.routes');
const roadmapRoutes = require('./roadmap.routes');
const aiRoutes = require('./ai.routes');
const quizRoutes = require('./quiz.routes');
const userRoutes = require('./user.routes');
const leaderboardRoutes = require('./leaderboard.routes');
const bookmarkRoutes = require('./bookmark.routes');
const achievementRoutes = require('./achievement.routes');
const notificationRoutes = require('./notification.routes');
const testRoutes = require('./test.routes');
const interviewRoutes = require('./interview.routes');
const careerRoutes = require('./career.routes');
const missionRoutes = require('./mission.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/lessons', lessonRoutes);
router.use('/roadmaps', roadmapRoutes);
router.use('/ai', aiRoutes);
router.use('/quizzes', quizRoutes);
router.use('/users', userRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/achievements', achievementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/tests', testRoutes);
router.use('/interviews', interviewRoutes);
router.use('/career', careerRoutes);
router.use('/missions', missionRoutes);

module.exports = router;
