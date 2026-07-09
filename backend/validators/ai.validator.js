const { z } = require('zod');

const tutorChatSchema = z.object({
  body: z.object({
    chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Chat MongoDB ID').optional(),
    message: z.string({ required_error: 'Message is required' }).trim().min(1, 'Message cannot be empty'),
    aiProvider: z.enum(['gemini', 'groq']).optional(),
  }),
});

const generateNotesSchema = z.object({
  body: z.object({
    lessonId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Lesson MongoDB ID').optional(),
    topic: z.string().min(1, 'Topic cannot be empty').optional(),
    aiProvider: z.enum(['gemini', 'groq']).optional(),
  }).refine(data => data.lessonId || data.topic, {
    message: 'Either lessonId or topic must be provided',
    path: ['lessonId'],
  }),
});

const reviewCodeSchema = z.object({
  body: z.object({
    code: z.string({ required_error: 'Code snippet is required' }).trim().min(1, 'Code snippet cannot be empty'),
    language: z.string().optional().default('javascript'),
    aiProvider: z.enum(['gemini', 'groq']).optional(),
  }),
});

const generateFlashcardsSchema = z.object({
  body: z.object({
    topic: z.string({ required_error: 'Topic is required' }).trim().min(1, 'Topic cannot be empty'),
    count: z.number().optional().default(5),
    aiProvider: z.enum(['gemini', 'groq']).optional(),
  }),
});

const generateProjectIdeasSchema = z.object({
  body: z.object({
    topic: z.string({ required_error: 'Topic is required' }).trim().min(1, 'Topic cannot be empty'),
    aiProvider: z.enum(['gemini', 'groq']).optional(),
  }),
});

module.exports = {
  tutorChatSchema,
  generateNotesSchema,
  reviewCodeSchema,
  generateFlashcardsSchema,
  generateProjectIdeasSchema,
};
