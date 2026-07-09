const { z } = require('zod');

const createTestSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    type: z.enum(['practice', 'chapter', 'mock', 'previous-year', 'certification', 'adaptive', 'custom']),
    subject: z.string().optional(),
    topics: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    duration: z.number().int().positive('Duration must be a positive integer in minutes'),
    totalMarks: z.number().positive('Total marks must be positive'),
    passingMarks: z.number().positive('Passing marks must be positive'),
    hasSections: z.boolean().optional(),
    allowPause: z.boolean().optional(),
    proctoringEnabled: z.boolean().optional(),
    fullscreenRequired: z.boolean().optional(),
    isAdaptive: z.boolean().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional(),
    attemptLimit: z.number().int().nonnegative().optional(),
    certificateOnPass: z.boolean().optional(),
    instructions: z.string().optional(),
  }),
});

const generateAITestSchema = z.object({
  body: z.object({
    topic: z.string({ required_error: 'Topic is required' }).min(3, 'Topic must be at least 3 characters'),
    count: z.number().int().min(1).max(50).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional(),
    type: z.enum(['mcq', 'multi-select', 'true-false', 'fill-blank', 'coding', 'descriptive']).optional(),
    subject: z.string().optional(),
    aiProvider: z.enum(['gemini', 'groq']).optional(),
  }),
});

const saveAnswerSchema = z.object({
  body: z.object({
    questionId: z.string({ required_error: 'Question ID is required' }),
    answer: z.any({ required_error: 'Answer is required' }),
    timeTaken: z.number().nonnegative().optional(),
    isMarkedForReview: z.boolean().optional(),
    sectionIndex: z.number().int().nonnegative().optional(),
  }),
});

const logProctoringEventSchema = z.object({
  body: z.object({
    type: z.enum([
      'tab-switch',
      'window-blur',
      'copy-attempt',
      'paste-attempt',
      'right-click',
      'fullscreen-exit',
      'multiple-faces',
      'no-face',
      'face-absent',
      'phone-detected',
      'unknown-person',
      'ai-flag',
    ], { required_error: 'Proctoring event type is required' }),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    description: z.string().optional(),
    questionIndex: z.number().int().nonnegative().optional(),
  }),
});

module.exports = {
  createTestSchema,
  generateAITestSchema,
  saveAnswerSchema,
  logProctoringEventSchema,
};
