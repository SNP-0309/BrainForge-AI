const Achievement = require('../models/achievement.model');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

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

const seedPaidCourses = async () => {
  try {
    // Clear existing courses in development to refresh with premium paid courses
    await Course.deleteMany({});
    
    logger.info('Seeding default paid courses...');
      
      // Find or create a system admin user for creator relation
      let systemCreator = await User.findOne();
      if (!systemCreator) {
        systemCreator = await User.create({
          firebaseUid: 'system-admin-uid-placeholder',
          name: 'System Admin',
          email: 'admin@brainforge.ai',
          role: 'admin',
        });
      }

      await Course.create([
        {
          title: 'Delta Batch (MERN Stack Full Cohort)',
          description: 'Complete Full Stack Web Development course using MongoDB, Express.js, React.js, and Node.js with live projects.',
          creator: systemCreator._id,
          status: 'published',
          tags: ['MERN', 'Web Development', 'Full Stack', 'React'],
          difficulty: 'beginner',
          duration: 120,
          thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&auto=format&fit=crop',
          isPaid: true,
          price: 6999,
          currency: 'INR',
          buyUrl: 'https://www.apnacollege.in/',
          instructor: 'Apna College (Shradha Khapra & Aman Dhattarwal)',
          platform: 'Apna College',
        },
        {
          title: 'Alpha Batch (DSA in Java / C++)',
          description: 'Data Structures and Algorithms course targeting placements in top tier companies, including logic building, analysis, and interview practice.',
          creator: systemCreator._id,
          status: 'published',
          tags: ['Java', 'DSA', 'Algorithms', 'Placement'],
          difficulty: 'intermediate',
          duration: 100,
          thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=500&auto=format&fit=crop',
          isPaid: true,
          price: 4999,
          currency: 'INR',
          buyUrl: 'https://www.apnacollege.in/',
          instructor: 'Apna College (Shradha Khapra & Aman Dhattarwal)',
          platform: 'Apna College',
        },
        {
          title: 'Sigma Web Development Cohort',
          description: 'Master Frontend & Backend. Build 20+ responsive web projects, handle API authentication, cloud deployment, and performance scaling.',
          creator: systemCreator._id,
          status: 'published',
          tags: ['HTML', 'CSS', 'JavaScript', 'Node.js'],
          difficulty: 'beginner',
          duration: 80,
          thumbnail: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=500&auto=format&fit=crop',
          isPaid: true,
          price: 1999,
          currency: 'INR',
          buyUrl: 'https://www.codewithharry.com/',
          instructor: 'CodeWithHarry',
          platform: 'CodeWithHarry',
        },
        {
          title: 'React & NextJS Complete Developers Bootcamp',
          description: 'Learn modern React.js, Next.js, Framer Motion, Tailwind, TypeScript, and state management tools from basic hooks to production pipelines.',
          creator: systemCreator._id,
          status: 'published',
          tags: ['React', 'Next.js', 'Tailwind', 'Udemy'],
          difficulty: 'intermediate',
          duration: 38,
          thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop',
          isPaid: true,
          price: 3499,
          currency: 'INR',
          buyUrl: 'https://www.udemy.com/user/hitesh-choudhary/',
          instructor: 'Hitesh Choudhary',
          platform: 'Udemy',
        },
        {
          title: 'Machine Learning & AI Masterclass',
          description: 'Learn Pandas, Numpy, Scikit-Learn, TensorFlow, Neural Networks, Deep Learning model architectures and generative AI pipelines.',
          creator: systemCreator._id,
          status: 'published',
          tags: ['Python', 'Machine Learning', 'Data Science', 'AI'],
          difficulty: 'advanced',
          duration: 65,
          thumbnail: 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=500&auto=format&fit=crop',
          isPaid: true,
          price: 4599,
          currency: 'INR',
          buyUrl: 'https://www.udemy.com/',
          instructor: 'Udemy Experts',
          platform: 'Udemy',
        },
        {
          title: 'Ultimate Data Science & Business Analytics',
          description: 'Learn SQL, Excel dashboards, Tableau visualization, statistical theory, A/B testing, and predictive model deployment.',
          creator: systemCreator._id,
          status: 'published',
          tags: ['SQL', 'Data Science', 'Analytics', 'Business'],
          difficulty: 'intermediate',
          duration: 50,
          thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop',
          isPaid: true,
          price: 3899,
          currency: 'INR',
          buyUrl: 'https://www.udemy.com/',
          instructor: 'Udemy Experts',
          platform: 'Udemy',
        }
      ]);
      logger.info('Paid courses seeded successfully');
  } catch (error) {
    logger.error(`Seeding paid courses failed: ${error.message}`);
  }
};

const seedAll = async () => {
  await seedAchievements();
  await seedPaidCourses();
};

module.exports = seedAll;
