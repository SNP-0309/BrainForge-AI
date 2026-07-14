const Course = require('../models/course.model');
const Lesson = require('../models/lesson.model');
const Progress = require('../models/progress.model');
const gamificationService = require('../services/gamification.service');
const sendResponse = require('../utils/ResponseWrapper');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/CustomError');

// Course Endpoints
const getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort, search, difficulty, tag } = req.query;

    const query = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (tag) {
      query.tags = tag;
    }

    const skipIndex = (page - 1) * limit;
    let coursesQuery = Course.find(query);

    if (sort) {
      const sortBy = sort.split(',').join(' ');
      coursesQuery = coursesQuery.sort(sortBy);
    } else {
      coursesQuery = coursesQuery.sort('-createdAt');
    }

    const courses = await coursesQuery.skip(skipIndex).limit(Number(limit)).populate('creator', 'name email profile.avatar');
    const total = await Course.countDocuments(query);

    sendResponse(res, 200, 'Courses retrieved successfully', {
      courses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { title, description, difficulty, tags, thumbnail, duration } = req.body;
    
    const course = await Course.create({
      title,
      description,
      difficulty,
      tags: tags || [],
      thumbnail: thumbnail || '',
      duration: duration || 0,
      creator: req.user._id, // Set local User ID from middleware
    });

    sendResponse(res, 201, 'Course created successfully', course);
  } catch (error) {
    next(error);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('creator', 'name email profile.avatar');
    if (!course) {
      return next(new NotFoundError('Course not found'));
    }
    sendResponse(res, 200, 'Course details retrieved', course);
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);
    if (!course) {
      return next(new NotFoundError('Course not found'));
    }

    // Only creator or admin can modify
    if (course.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ForbiddenError('You are not authorized to update this course'));
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    sendResponse(res, 200, 'Course updated successfully', course);
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return next(new NotFoundError('Course not found'));
    }

    if (course.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ForbiddenError('You are not authorized to delete this course'));
    }

    await Course.findByIdAndDelete(req.params.id);
    // Clean up related lessons
    await Lesson.deleteMany({ course: req.params.id });

    sendResponse(res, 200, 'Course and related lessons deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Lesson Endpoints
const getCourseLessons = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new NotFoundError('Course not found'));
    }

    let lessons = await Lesson.find({ course: courseId }).sort('order');

    // On-demand enrichment for free courses with only 1 (or 0) lessons
    if (!course.isPaid && lessons.length <= 1 && process.env.SERPAPI_KEY) {
      const logger = require('../utils/logger');
      logger.info(`On-demand enriching free course "${course.title}" with lessons from YouTube via SerpAPI...`);
      const { scrapeYouTubeVideosForCourse } = require('../services/scraper.service');
      const youtubeVideos = await scrapeYouTubeVideosForCourse(course.title);

      if (youtubeVideos && youtubeVideos.length > 0) {
        // Clear old baseline lessons
        await Lesson.deleteMany({ course: courseId });

        let order = 1;
        const newLessons = [];
        for (const video of youtubeVideos) {
          const l = await Lesson.create({
            course: courseId,
            title: video.title,
            content: `In this lesson, we will watch: **${video.title}**.\n\n${video.description}\n\nWatch the full video, take notes, and complete practice challenges.`,
            videoUrl: video.videoUrl,
            order: order++,
            estimatedTime: video.duration,
            isAiGenerated: false
          });
          newLessons.push(l);
        }

        // Calculate and update total duration of the course
        const totalMinutes = youtubeVideos.reduce((acc, v) => acc + v.duration, 0);
        const durationHours = Math.ceil(totalMinutes / 60);
        course.duration = durationHours;
        await course.save();

        lessons = newLessons;
        logger.info(`On-demand enrichment complete for course "${course.title}". Added ${youtubeVideos.length} lessons.`);
      }
    }

    sendResponse(res, 200, 'Lessons retrieved successfully', lessons);
  } catch (error) {
    next(error);
  }
};


const createLesson = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new NotFoundError('Course not found'));
    }

    if (course.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ForbiddenError('You are not authorized to add lessons to this course'));
    }

    const { title, content, videoUrl, resources, order, estimatedTime, isAiGenerated } = req.body;

    // Check if lesson order is duplicate
    const existing = await Lesson.findOne({ course: courseId, order });
    if (existing) {
      return next(new BadRequestError(`A lesson with order index ${order} already exists in this course`));
    }

    const lesson = await Lesson.create({
      course: courseId,
      title,
      content,
      videoUrl: videoUrl || '',
      resources: resources || [],
      order,
      estimatedTime: estimatedTime || 15,
      isAiGenerated: isAiGenerated || false,
    });

    sendResponse(res, 201, 'Lesson appended successfully', lesson);
  } catch (error) {
    next(error);
  }
};

const getLessonById = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course', 'title');
    if (!lesson) {
      return next(new NotFoundError('Lesson not found'));
    }
    sendResponse(res, 200, 'Lesson retrieved successfully', lesson);
  } catch (error) {
    next(error);
  }
};

const completeLesson = async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return next(new NotFoundError('Lesson not found'));
    }

    const userId = req.user._id;
    const courseId = lesson.course;

    // Fetch or create user progress document
    let progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) {
      progress = await Progress.create({
        user: userId,
        course: courseId,
        completedLessons: [],
        status: 'in-progress',
      });
    }

    let xpAwarded = 0;
    let coinsAwarded = 0;
    const wasCompleted = progress.completedLessons.includes(lessonId);

    if (!wasCompleted) {
      progress.completedLessons.push(lessonId);
      
      // Award rewards (e.g. 15 XP and 5 Coins for completing a lesson)
      xpAwarded = 15;
      coinsAwarded = 5;
      progress.xpEarned += xpAwarded;

      // Check if all course lessons are completed
      const totalLessons = await Lesson.countDocuments({ course: courseId });
      if (progress.completedLessons.length === totalLessons) {
        progress.status = 'completed';
      }
      
      await progress.save();
      
      // Trigger user profile rewards and level ups
      await gamificationService.awardRewards(userId, xpAwarded, coinsAwarded);
    }

    // Trigger achievements check
    const extraStats = {
      coursesCompleted: progress.status === 'completed' ? 1 : 0
    };
    const newlyUnlocked = await gamificationService.checkAndUnlockAchievements(userId, extraStats);

    sendResponse(res, 200, 'Lesson marked complete', {
      progress,
      xpAwarded,
      coinsAwarded,
      newlyUnlockedAchievements: newlyUnlocked,
    });
  } catch (error) {
    next(error);
  }
};

const scraperService = require('../services/scraper.service');

const syncCourses = async (req, res, next) => {
  try {
    const result = await scraperService.runCourseSync();
    sendResponse(res, 200, 'Courses and lessons synchronized successfully via scrapers', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseLessons,
  createLesson,
  getLessonById,
  completeLesson,
  syncCourses,
};
