const z = require('zod');

const startInterviewSchema = z.object({
  body: z.object({
    format: z.enum(['text', 'voice', 'video']).optional(),
    interviewType: z.enum(['technical', 'behavioral', 'hr', 'mixed', 'system-design', 'coding']).optional(),
    role: z.string().min(2, 'Role must be at least 2 characters').optional(),
    company: z.string().optional(),
    yearsOfExperience: z.enum(['fresher', '1-2', '3-5', '5-10', '10+']).optional(),
    totalQuestions: z.number().int().min(1).max(20).optional(),
    duration: z.number().int().positive().optional(),
    resumeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Resume MongoDB ID').optional(),
    jobDescription: z.string().optional(),
    aiProvider: z.enum(['gemini', 'groq']).optional(),
  }),
});

const respondToInterviewSchema = z.object({
  body: z.object({
    message: z.string().optional(),
    audioUrl: z.string().url('Invalid audio recording URL').optional().or(z.literal('')),
    videoUrl: z.string().url('Invalid video recording URL').optional().or(z.literal('')),
  }).refine(data => data.message || data.audioUrl, {
    message: 'Either message or audioUrl must be provided',
  }),
});

const generateInterviewQuestionsSchema = z.object({
  body: z.object({
    role: z.string({ required_error: 'Role is required' }),
    interviewType: z.enum(['technical', 'behavioral', 'hr', 'mixed', 'system-design', 'coding']),
    company: z.string().optional(),
    count: z.number().int().min(1).max(30).optional(),
    aiProvider: z.enum(['gemini', 'groq']).optional(),
    saveToBank: z.boolean().optional(),
  }),
});

const analyzeResumeSchema = z.object({
  body: z.object({
    jobDescription: z.string().optional(),
    jobTitle: z.string().optional(),
    aiProvider: z.enum(['gemini', 'groq']).optional(),
  }),
});

module.exports = {
  startInterviewSchema,
  respondToInterviewSchema,
  generateInterviewQuestionsSchema,
  analyzeResumeSchema,
};
