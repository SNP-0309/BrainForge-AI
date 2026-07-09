const { z } = require('zod');

const syncUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    role: z.enum(['student', 'teacher', 'admin']).optional(),
  }).optional(),
});

module.exports = {
  syncUserSchema,
};
