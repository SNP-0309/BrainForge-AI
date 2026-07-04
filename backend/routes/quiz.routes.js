const express = require('express');
const { generateQuiz, getQuizById, submitQuiz } = require('../controllers/quiz.controller');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { generateQuizSchema, submitQuizSchema } = require('../validators/quiz.validator');

const router = express.Router();

router.use(protect);

router.post('/generate', validate(generateQuizSchema), generateQuiz);
router.get('/:id', getQuizById);
router.post('/:id/submit', validate(submitQuizSchema), submitQuiz);

module.exports = router;
