const { z } = require('zod');

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
  }),
});

module.exports = {
  updateProfileSchema,
};
