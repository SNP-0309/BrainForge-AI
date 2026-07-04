const express = require('express');
const {
  getCourses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseLessons,
  createLesson,
} = require('../controllers/course.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createCourseSchema, updateCourseSchema } = require('../validators/course.validator');
const { createLessonSchema } = require('../validators/lesson.validator');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCourses)
  .post(restrictTo('teacher', 'admin'), validate(createCourseSchema), createCourse);

router.route('/:id')
  .get(getCourseById)
  .put(restrictTo('teacher', 'admin'), validate(updateCourseSchema), updateCourse)
  .delete(restrictTo('teacher', 'admin'), deleteCourse);

router.route('/:id/lessons')
  .get(getCourseLessons)
  .post(restrictTo('teacher', 'admin'), validate(createLessonSchema), createLesson);

module.exports = router;
