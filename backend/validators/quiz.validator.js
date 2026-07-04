const { z } = require('zod');

const submitQuizSchema = z.object({
  body: z.object({
    timeTaken: z.number().nonnegative('Time taken must be a positive number').optional(),
    answers: z.array(z.object({
      questionIndex: z.number().int().nonnegative(),
      selectedIndex: z.number().int().nonnegative(),
    }), { required_error: 'Answers are required' }),
  }),
});

const generateQuizSchema = z.object({
  body: z.object({
    topic: z.string({ required_error: 'Topic description is required' }).min(3),
    questionCount: z.number().int().min(1).max(20).default(5),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    lessonId: z.string().optional(),
    courseId: z.string().optional(),
  }),
});

module.exports = {
  submitQuizSchema,
  generateQuizSchema,
};
