const { z } = require('zod');

const createCourseSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3, 'Title must be at least 3 characters').max(100),
    description: z.string({ required_error: 'Description is required' }).min(10, 'Description must be at least 10 characters'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: 'Difficulty must be beginner, intermediate, or advanced' }),
    tags: z.array(z.string()).optional(),
    thumbnail: z.string().url('Thumbnail must be a valid URL').optional().or(z.literal('')),
    duration: z.number().nonnegative('Duration must be positive').optional(),
  }),
});

const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().min(10).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: z.array(z.string()).optional(),
    thumbnail: z.string().url('Thumbnail must be a valid URL').optional().or(z.literal('')),
    duration: z.number().nonnegative().optional(),
  }),
});

module.exports = {
  createCourseSchema,
  updateCourseSchema,
};
