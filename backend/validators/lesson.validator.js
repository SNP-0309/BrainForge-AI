const { z } = require('zod');

const createLessonSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3, 'Title must be at least 3 characters').max(100),
    content: z.string({ required_error: 'Content is required' }).min(10, 'Content must be at least 10 characters'),
    videoUrl: z.string().url('Video URL must be a valid URL').optional().or(z.literal('')),
    resources: z.array(z.object({
      name: z.string({ required_error: 'Resource name is required' }),
      url: z.string({ required_error: 'Resource URL is required' }).url('Resource URL must be valid'),
    })).optional(),
    order: z.number({ required_error: 'Order index is required' }).int().nonnegative(),
    estimatedTime: z.number().int().nonnegative().optional(),
    isAiGenerated: z.boolean().optional(),
  }),
});

const updateLessonSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    content: z.string().min(10).optional(),
    videoUrl: z.string().url('Video URL must be valid').optional().or(z.literal('')),
    resources: z.array(z.object({
      name: z.string(),
      url: z.string().url(),
    })).optional(),
    order: z.number().int().nonnegative().optional(),
    estimatedTime: z.number().int().nonnegative().optional(),
  }),
});

module.exports = {
  createLessonSchema,
  updateLessonSchema,
};
