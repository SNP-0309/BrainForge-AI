const express = require('express');
const { getLessonById, completeLesson } = require('../controllers/course.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/:id', getLessonById);
router.post('/:id/complete', completeLesson);

module.exports = router;
