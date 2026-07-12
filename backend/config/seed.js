const Achievement = require('../models/achievement.model');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const { runCourseSync } = require('../services/scraper.service');

const seedAchievements = async () => {
  try {
    const count = await Achievement.countDocuments();
    if (count === 0) {
      logger.info('No achievements found in database. Seeding defaults...');
      await Achievement.create([
        {
          name: 'First Steps',
          description: 'Complete your first course module',
          badgeUrl: 'https://cdn-icons-png.flaticon.com/512/6188/6188540.png',
          criteriaType: 'course_completed',
          criteriaValue: 1,
          pointsXP: 50,
        },
        {
          name: 'Streak Master',
          description: 'Reach a daily learning streak of 3 days',
          badgeUrl: 'https://cdn-icons-png.flaticon.com/512/3208/3208749.png',
          criteriaType: 'streak',
          criteriaValue: 3,
          pointsXP: 100,
        },
        {
          name: 'Perfect Score',
          description: 'Get a 100% score on any quiz',
          badgeUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
          criteriaType: 'quiz_score',
          criteriaValue: 100,
          pointsXP: 75,
        },
        {
          name: 'XP Collector',
          description: 'Earn 500 total XP points',
          badgeUrl: 'https://cdn-icons-png.flaticon.com/512/2618/2618245.png',
          criteriaType: 'xp_earned',
          criteriaValue: 500,
          pointsXP: 150,
        },
      ]);
      logger.info('Achievements seeded successfully');
    }
  } catch (error) {
    logger.error(`Seeding achievements failed: ${error.message}`);
  }
};

const seedAll = async () => {
  await seedAchievements();
  try {
    await runCourseSync();
  } catch (error) {
    logger.error(`Seeding dynamically scraped courses failed: ${error.message}`);
  }
};

module.exports = seedAll;
