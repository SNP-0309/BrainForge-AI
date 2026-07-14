require('dotenv').config();
const mongoose = require('mongoose');
const { runCourseSync } = require('./services/scraper.service.js');
const logger = require('./utils/logger.js');

async function main() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected! Starting course sync...');
    
    const result = await runCourseSync();
    console.log('Sync finished successfully!', result);
    
    // Check if any free course has multiple lessons
    const Course = require('./models/course.model.js');
    const Lesson = require('./models/lesson.model.js');
    
    const freeCourse = await Course.findOne({ isPaid: false });
    if (freeCourse) {
      const lessons = await Lesson.find({ course: freeCourse._id }).sort('order');
      console.log(`\nVerified free course: "${freeCourse.title}"`);
      console.log(`Total lessons count in DB: ${lessons.length}`);
      lessons.forEach(l => {
        console.log(`- Lesson ${l.order}: ${l.title} (${l.videoUrl})`);
      });
    }
  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

main();
