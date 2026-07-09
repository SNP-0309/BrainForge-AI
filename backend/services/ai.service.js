const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────
// BASE PROVIDER INTERFACE
// ─────────────────────────────────────────────
class BaseAIProvider {
  constructor(name) {
    this.name = name;
    this.isMock = false;
  }
  async generateRoadmap(topic) { throw new Error('Not implemented'); }
  async generateCareerRecommendations(responses) { throw new Error('Not implemented'); }
  async generateQuiz(topic, count, difficulty) { throw new Error('Not implemented'); }
  async generateFlashcards(topic, count) { throw new Error('Not implemented'); }
  async generateLesson(topic) { throw new Error('Not implemented'); }
  async generateNotes(title, content) { throw new Error('Not implemented'); }
  async generateTestPaper(config) { throw new Error('Not implemented'); }
  async generateInterviewQuestions(config) { throw new Error('Not implemented'); }
  async evaluateAnswer(question, answer, type) { throw new Error('Not implemented'); }
  async analyzeResume(resumeText, jobDescription) { throw new Error('Not implemented'); }
  async reviewCode(code, language) { throw new Error('Not implemented'); }
  async chat(messages, systemContext) { throw new Error('Not implemented'); }
  async interviewChat(messages, sessionConfig) { throw new Error('Not implemented'); }
}

// ─────────────────────────────────────────────
// MOCK FALLBACK HELPERS
// ─────────────────────────────────────────────
const mockRoadmap = (topic) => [
  { id: 'node_1', label: `Introduction to ${topic}`, type: 'lesson', status: 'available', dependencies: [] },
  { id: 'node_2', label: `Core Principles of ${topic}`, type: 'lesson', status: 'locked', dependencies: ['node_1'] },
  { id: 'node_3', label: `${topic} Fundamentals Quiz`, type: 'quiz', status: 'locked', dependencies: ['node_2'] },
  { id: 'node_4', label: `Advanced ${topic} Patterns`, type: 'lesson', status: 'locked', dependencies: ['node_3'] },
  { id: 'node_5', label: `${topic} Project Milestone`, type: 'milestone', status: 'locked', dependencies: ['node_4'] },
];

const mockQuiz = (topic, count, difficulty) =>
  Array.from({ length: count }, (_, i) => ({
    questionText: `[Mock] Question ${i + 1} about ${topic} (${difficulty})`,
    options: [`Correct Answer`, `Wrong Option A`, `Wrong Option B`, `Wrong Option C`],
    correctAnswerIndex: 0,
    points: 10,
    explanation: `Mock explanation for question ${i + 1}.`,
  }));

const mockFlashcards = (topic, count) =>
  Array.from({ length: count }, (_, i) => ({
    front: `What is concept ${i + 1} of ${topic}?`,
    back: `Concept ${i + 1} of ${topic} refers to a fundamental principle used in learning.`,
    hint: `Think about the basics.`,
  }));

const mockNotes = (title) => `# Study Notes: ${title}\n\n## Core Concepts\nMock notes for **${title}**.\n\n## Key Takeaways\n- Concept 1\n- Concept 2\n\n## Flashcards\n- **Q:** What is ${title}?\n  **A:** A fundamental topic in learning.`;

const mockInterview = (config) => ({
  question: `Tell me about your experience with ${config.role || 'software engineering'}.`,
  followUpHint: 'Ask about specific technologies or challenges faced.',
  category: config.interviewType || 'behavioral',
});

// ─────────────────────────────────────────────
// GEMINI PROVIDER
// ─────────────────────────────────────────────
class GeminiProvider extends BaseAIProvider {
  constructor() {
    super('gemini');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY not set. Gemini will run in mock mode.');
      this.isMock = true;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      logger.info('Gemini AI Provider initialized.');
    }
  }

  async _jsonModel() {
    return this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
  }

  async _textModel() {
    return this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async _safeJsonGenerate(prompt, fallback) {
    if (this.isMock) return fallback;
    try {
      const model = await this._jsonModel();
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (err) {
      logger.error(`Gemini JSON generation failed: ${err.message}`);
      return fallback;
    }
  }

  async _safeTextGenerate(prompt, fallback) {
    if (this.isMock) return fallback;
    try {
      const model = await this._textModel();
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      logger.error(`Gemini text generation failed: ${err.message}`);
      return fallback;
    }
  }

  async generateRoadmap(topic) {
    return this._safeJsonGenerate(
      `Generate a logical learning roadmap for: "${topic}". Return ONLY a JSON array. Each node: { "id":"node_1", "label":"...", "type":"lesson|quiz|milestone", "status":"available|locked", "dependencies":[] }. First node available, rest locked. 5-8 nodes from beginner to advanced.`,
      mockRoadmap(topic)
    );
  }

  async generateCareerRecommendations(responses) {
    const prompt = `Analyze this career discovery assessment for an educational platform:
${JSON.stringify(responses, null, 2)}

Provide exactly 3 recommended career paths (e.g. AI Engineering, Full Stack Web Development).
For each recommendation, return matching JSON format only.
JSON response structure MUST be:
{
  "recommendations": [
    {
      "title": "AI Engineering",
      "matchPercentage": 95,
      "whyItFits": "Based on your interest in problem solving and background in python...",
      "requiredSkills": ["Python", "Machine Learning", "Linear Algebra"],
      "averageDuration": "6-8 months",
      "opportunities": ["AI Engineer", "ML Researcher"],
      "difficulty": "Advanced",
      "salaryPotential": "$110,000 - $140,000"
    }
  ]
}
Return ONLY valid JSON.`;

    const fallback = {
      recommendations: [
        {
          title: 'AI Engineering',
          matchPercentage: 95,
          whyItFits: 'Fits your strong mathematical background and coding interests.',
          requiredSkills: ['Python', 'Machine Learning', 'Mathematics'],
          averageDuration: '6-8 months',
          opportunities: ['AI Engineer', 'ML Engineer'],
          difficulty: 'Advanced',
          salaryPotential: '$110,000 - $140,000',
        },
        {
          title: 'Full Stack Development',
          matchPercentage: 90,
          whyItFits: 'Matches your interest in visual creations and user interactions.',
          requiredSkills: ['JavaScript', 'HTML/CSS', 'Node.js'],
          averageDuration: '5-7 months',
          opportunities: ['Full Stack Developer', 'Frontend Engineer'],
          difficulty: 'Intermediate',
          salaryPotential: '$90,000 - $120,000',
        },
        {
          title: 'Data Science',
          matchPercentage: 85,
          whyItFits: 'Fits your interest in database management and analytics.',
          requiredSkills: ['SQL', 'Python', 'Statistics'],
          averageDuration: '6 months',
          opportunities: ['Data Scientist', 'Data Analyst'],
          difficulty: 'Intermediate',
          salaryPotential: '$95,000 - $125,000',
        },
      ]
    };

    return this._safeJsonGenerate(prompt, fallback);
  }

  async generateQuiz(topic, count = 5, difficulty = 'medium') {
    return this._safeJsonGenerate(
      `Create a ${difficulty} quiz on "${topic}" with ${count} questions. Return ONLY JSON array: [{"questionText":"...","options":["A","B","C","D"],"correctAnswerIndex":0,"points":10,"explanation":"..."}]`,
      mockQuiz(topic, count, difficulty)
    );
  }

  async generateFlashcards(topic, count = 10) {
    return this._safeJsonGenerate(
      `Create ${count} flashcards for learning "${topic}". Return ONLY JSON array: [{"front":"question","back":"answer","hint":"optional hint"}]`,
      mockFlashcards(topic, count)
    );
  }

  async generateLesson(topic) {
    return this._safeTextGenerate(
      `Write a comprehensive lesson on "${topic}" in markdown format. Include: Introduction, Core Concepts (with examples), Code Examples (if applicable), Summary, and 3-5 Practice Questions.`,
      `# Lesson: ${topic}\n\n## Introduction\nMock lesson content for **${topic}**.`
    );
  }

  async generateNotes(title, content) {
    return this._safeTextGenerate(
      `Create premium study notes in markdown for lesson:\nTitle: ${title}\nContent: ${content}\n\nInclude: Core Concepts, Examples, Key Takeaways, 5 Flashcard Q&As.`,
      mockNotes(title)
    );
  }

  async generateTestPaper(config) {
    const { topic, count = 10, difficulty = 'mixed', type = 'mcq' } = config;
    return this._safeJsonGenerate(
      `Generate a ${type} test on "${topic}" with ${count} questions, difficulty: ${difficulty}. Return JSON array matching: [{"question":"...","type":"${type}","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","marks":1,"topic":"${topic}","difficulty":"${difficulty}"}]`,
      Array.from({ length: count }, (_, i) => ({
        question: `Mock test question ${i + 1} about ${topic}`,
        type: 'mcq',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Mock explanation.',
        marks: 1,
        topic,
        difficulty,
      }))
    );
  }

  async generateInterviewQuestions(config) {
    const { role = 'SDE', interviewType = 'technical', count = 10, company = '' } = config;
    const companyCtx = company ? ` for ${company}` : '';
    return this._safeJsonGenerate(
      `Generate ${count} ${interviewType} interview questions for a ${role} role${companyCtx}. Return JSON array: [{"question":"...","category":"${interviewType}","difficulty":"medium","sampleAnswer":"...","followUpQuestions":["..."],"tips":"..."}]`,
      Array.from({ length: count }, (_, i) => ({
        question: `Mock ${interviewType} question ${i + 1} for ${role}`,
        category: interviewType,
        difficulty: 'medium',
        sampleAnswer: 'Mock sample answer.',
        followUpQuestions: ['Can you elaborate?'],
        tips: 'Use the STAR method.',
      }))
    );
  }

  async evaluateAnswer(question, answer, type = 'descriptive') {
    return this._safeJsonGenerate(
      `Evaluate this ${type} answer:\nQuestion: ${question}\nAnswer: ${answer}\n\nReturn JSON: {"score":75,"maxScore":100,"feedback":"...","strengthPoints":["..."],"improvementPoints":["..."],"idealAnswer":"..."}`,
      { score: 70, maxScore: 100, feedback: 'Mock evaluation.', strengthPoints: ['Clear answer'], improvementPoints: ['Add more detail'], idealAnswer: 'A comprehensive answer.' }
    );
  }

  async analyzeResume(resumeText, jobDescription = '') {
    const jdCtx = jobDescription ? `\nJob Description: ${jobDescription}` : '';
    return this._safeJsonGenerate(
      `Analyze this resume for ATS compatibility and quality:${jdCtx}\nResume Text:\n${resumeText.slice(0, 3000)}\n\nReturn JSON: {"atsScore":85,"keywordMatch":{"matched":["..."],"missing":["..."]},"sectionFeedback":{"summary":"...","experience":"...","skills":"...","education":"...","overall":"..."},"jobMatchScore":80,"suggestedQuestions":["..."],"improvements":["..."]}`,
      { atsScore: 70, keywordMatch: { matched: ['javascript', 'react'], missing: ['typescript', 'graphql'] }, sectionFeedback: { overall: 'Good resume structure.' }, jobMatchScore: 65, suggestedQuestions: ['Tell me about your React experience.'], improvements: ['Add more quantified achievements.'] }
    );
  }

  async reviewCode(code, language = 'javascript') {
    return this._safeTextGenerate(
      `Review this ${language} code. Provide:\n1. Quality Score (0-10)\n2. Bugs/Security Issues\n3. Performance Suggestions\n4. Refactored version\n\n\`\`\`${language}\n${code}\n\`\`\``,
      `# Code Review (${language})\n## Score: 8/10\n## Issues\n- None critical.\n## Suggestions\n- Add input validation.\n## Optimized Version\n\`\`\`${language}\n// Optimized code\n\`\`\``
    );
  }

  async chat(messages, systemContext = '') {
    if (this.isMock) return `[Mock Gemini]: You asked: "${messages[messages.length - 1]?.content}". This is a mock AI response.`;
    try {
      const model = await this._textModel();
      const systemInstruction = systemContext || 'You are BrainForge AI, a world-class educational AI tutor. Explain concepts clearly, use examples, and maintain an encouraging teaching tone.';
      const history = messages.slice(0, -1).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
      const lastMsg = messages[messages.length - 1].content;
      const chat = model.startChat({ history, systemInstruction });
      const result = await chat.sendMessage(lastMsg);
      return result.response.text();
    } catch (err) {
      logger.error(`Gemini chat failed: ${err.message}`);
      return `I'm having trouble connecting right now. Please try again shortly.`;
    }
  }

  async interviewChat(messages, sessionConfig = {}) {
    const { role = 'Software Engineer', interviewType = 'technical', company = '' } = sessionConfig;
    const companyCtx = company ? ` at ${company}` : '';
    const systemInstruction = `You are a professional ${interviewType} interviewer conducting an interview for a ${role} position${companyCtx}. Ask one question at a time. After each candidate response, provide brief feedback, then ask the next question or a follow-up. Be professional, thorough, and adaptive to their answers. Start by greeting and asking the first question.`;
    return this.chat(messages.map(m => ({ ...m, sender: m.role === 'candidate' ? 'user' : 'assistant' })), systemInstruction);
  }
}

// ─────────────────────────────────────────────
// GROQ PROVIDER
// ─────────────────────────────────────────────
class GroqProvider extends BaseAIProvider {
  constructor() {
    super('groq');
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.warn('GROQ_API_KEY not set. Groq will run in mock mode.');
      this.isMock = true;
    } else {
      this.client = new Groq({ apiKey });
      logger.info('Groq AI Provider initialized.');
    }
    this.fastModel = 'llama3-8b-8192';       // Fast responses
    this.smartModel = 'llama3-70b-8192';      // Complex reasoning
    this.longModel = 'mixtral-8x7b-32768';    // Long context (resume, notes)
  }

  async _complete(messages, model = null, jsonMode = false) {
    if (this.isMock) return null;
    try {
      const params = {
        model: model || this.fastModel,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      };
      if (jsonMode) {
        params.response_format = { type: 'json_object' };
      }
      const completion = await this.client.chat.completions.create(params);
      return completion.choices[0]?.message?.content || '';
    } catch (err) {
      logger.error(`Groq completion failed: ${err.message}`);
      return null;
    }
  }

  async _jsonComplete(systemPrompt, userPrompt, model = null, fallback = {}) {
    if (this.isMock) return fallback;
    const result = await this._complete([
      { role: 'system', content: systemPrompt + ' Always respond with valid JSON only.' },
      { role: 'user', content: userPrompt },
    ], model, true);
    if (!result) return fallback;
    try {
      return JSON.parse(result);
    } catch {
      // Try to extract JSON from the result
      const match = result.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { return fallback; }
      }
      return fallback;
    }
  }

  async generateRoadmap(topic) {
    return this._jsonComplete(
      'You are an expert curriculum designer.',
      `Generate a learning roadmap for "${topic}" as a JSON array. Each element: {"id":"node_1","label":"...","type":"lesson|quiz|milestone","status":"available|locked","dependencies":[]}. First node available, rest locked. 5-8 nodes, beginner to advanced.`,
      this.smartModel,
      mockRoadmap(topic)
    );
  }

  async generateCareerRecommendations(responses) {
    const systemPrompt = 'You are an expert career counselor and educational path designer.';
    const userPrompt = `Analyze this career discovery assessment for an educational platform:
${JSON.stringify(responses, null, 2)}

Provide exactly 3 recommended career paths (e.g. AI Engineering, Full Stack Web Development).
For each recommendation, return matching JSON format only.
JSON response structure MUST be:
{
  "recommendations": [
    {
      "title": "AI Engineering",
      "matchPercentage": 95,
      "whyItFits": "Based on your interest in problem solving and background in python...",
      "requiredSkills": ["Python", "Machine Learning", "Linear Algebra"],
      "averageDuration": "6-8 months",
      "opportunities": ["AI Engineer", "ML Researcher"],
      "difficulty": "Advanced",
      "salaryPotential": "$110,000 - $140,000"
    }
  ]
}
Return ONLY valid JSON.`;

    const fallback = {
      recommendations: [
        {
          title: 'AI Engineering',
          matchPercentage: 95,
          whyItFits: 'Fits your strong mathematical background and coding interests.',
          requiredSkills: ['Python', 'Machine Learning', 'Mathematics'],
          averageDuration: '6-8 months',
          opportunities: ['AI Engineer', 'ML Engineer'],
          difficulty: 'Advanced',
          salaryPotential: '$110,000 - $140,000',
        },
        {
          title: 'Full Stack Development',
          matchPercentage: 90,
          whyItFits: 'Matches your interest in visual creations and user interactions.',
          requiredSkills: ['JavaScript', 'HTML/CSS', 'Node.js'],
          averageDuration: '5-7 months',
          opportunities: ['Full Stack Developer', 'Frontend Engineer'],
          difficulty: 'Intermediate',
          salaryPotential: '$90,000 - $120,000',
        },
        {
          title: 'Data Science',
          matchPercentage: 85,
          whyItFits: 'Fits your interest in database management and analytics.',
          requiredSkills: ['SQL', 'Python', 'Statistics'],
          averageDuration: '6 months',
          opportunities: ['Data Scientist', 'Data Analyst'],
          difficulty: 'Intermediate',
          salaryPotential: '$95,000 - $125,000',
        },
      ]
    };

    return this._jsonComplete(systemPrompt, userPrompt, this.smartModel, fallback);
  }

  async generateQuiz(topic, count = 5, difficulty = 'medium') {
    const result = await this._jsonComplete(
      'You are an expert quiz generator. Generate well-crafted educational quiz questions.',
      `Create a ${difficulty} quiz about "${topic}" with exactly ${count} questions. Return as JSON array: [{"questionText":"...","options":["A","B","C","D"],"correctAnswerIndex":0,"points":10,"explanation":"..."}]`,
      this.fastModel,
      mockQuiz(topic, count, difficulty)
    );
    return Array.isArray(result) ? result : mockQuiz(topic, count, difficulty);
  }

  async generateFlashcards(topic, count = 10) {
    const result = await this._jsonComplete(
      'You are an expert educator creating spaced-repetition flashcards.',
      `Create ${count} flashcards for "${topic}". Return JSON array: [{"front":"question or term","back":"answer or definition","hint":"optional memory aid"}]`,
      this.fastModel,
      mockFlashcards(topic, count)
    );
    return Array.isArray(result) ? result : mockFlashcards(topic, count);
  }

  async generateLesson(topic) {
    if (this.isMock) return `# Lesson: ${topic}\n\nMock lesson content.`;
    const result = await this._complete([
      { role: 'system', content: 'You are an expert educator. Write comprehensive, engaging lessons in markdown format.' },
      { role: 'user', content: `Write a complete lesson on "${topic}". Include: Introduction, Core Concepts (with examples), Practical Application, Code Examples (if applicable), Common Mistakes, Summary, and 5 Practice Questions.` },
    ], this.smartModel);
    return result || `# Lesson: ${topic}\n\nUnable to generate lesson content.`;
  }

  async generateNotes(title, content) {
    if (this.isMock) return mockNotes(title);
    const result = await this._complete([
      { role: 'system', content: 'You are an expert study note writer. Create premium, well-structured study notes in markdown.' },
      { role: 'user', content: `Create comprehensive study notes for:\nTitle: ${title}\nContent/Syllabus: ${content}\n\nStructure: Core Concepts, Examples, Key Takeaways, 5 Flashcard Q&As.` },
    ], this.longModel);
    return result || mockNotes(title);
  }

  async generateTestPaper(config) {
    const { topic, count = 10, difficulty = 'mixed', type = 'mcq' } = config;
    const result = await this._jsonComplete(
      'You are an expert exam paper setter. Create well-structured test questions.',
      `Generate ${count} ${type} questions on "${topic}" at ${difficulty} difficulty. JSON array: [{"question":"...","type":"${type}","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","marks":1,"topic":"${topic}","difficulty":"easy|medium|hard"}]`,
      this.smartModel,
      []
    );
    return Array.isArray(result) ? result : [];
  }

  async generateInterviewQuestions(config) {
    const { role = 'SDE', interviewType = 'technical', count = 10, company = '' } = config;
    const companyCtx = company ? ` (company: ${company})` : '';
    const result = await this._jsonComplete(
      'You are an expert technical interviewer at a top tech company.',
      `Generate ${count} ${interviewType} interview questions for ${role}${companyCtx}. JSON array: [{"question":"...","category":"${interviewType}","difficulty":"easy|medium|hard","sampleAnswer":"...","followUpQuestions":["..."],"tips":"..."}]`,
      this.smartModel,
      []
    );
    return Array.isArray(result) ? result : [];
  }

  async evaluateAnswer(question, answer, type = 'descriptive') {
    const result = await this._jsonComplete(
      'You are an expert evaluator providing detailed, constructive feedback on interview and test answers.',
      `Evaluate this ${type} answer:\nQuestion: ${question}\nAnswer: ${answer}\n\nReturn JSON: {"score":75,"maxScore":100,"feedback":"...","strengthPoints":["..."],"improvementPoints":["..."],"idealAnswer":"..."}`,
      this.smartModel,
      { score: 70, maxScore: 100, feedback: 'Unable to evaluate.', strengthPoints: [], improvementPoints: [], idealAnswer: '' }
    );
    return result;
  }

  async analyzeResume(resumeText, jobDescription = '') {
    const jdCtx = jobDescription ? `\nTarget Job Description:\n${jobDescription}` : '';
    const result = await this._jsonComplete(
      'You are an expert resume coach and ATS specialist. Provide actionable, specific feedback.',
      `Analyze this resume:${jdCtx}\n\nResume:\n${resumeText.slice(0, 4000)}\n\nReturn JSON: {"atsScore":85,"keywordMatch":{"matched":["..."],"missing":["..."]},"sectionFeedback":{"summary":"...","experience":"...","skills":"...","education":"...","projects":"...","overall":"..."},"jobMatchScore":80,"suggestedQuestions":["..."],"improvements":["..."]}`,
      this.longModel,
      { atsScore: 70, keywordMatch: { matched: [], missing: [] }, sectionFeedback: { overall: 'Unable to analyze.' }, jobMatchScore: 0, suggestedQuestions: [], improvements: [] }
    );
    return result;
  }

  async reviewCode(code, language = 'javascript') {
    if (this.isMock) return `# Code Review\nMock review for ${language} code.`;
    const result = await this._complete([
      { role: 'system', content: 'You are a Senior Staff Engineer and expert code reviewer. Provide thorough, actionable feedback.' },
      { role: 'user', content: `Review this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide: 1. Quality Score (0-10), 2. Bugs/Security Issues, 3. Performance Improvements, 4. Refactored Version with comments.` },
    ], this.smartModel);
    return result || 'Unable to review code at this time.';
  }

  async chat(messages, systemContext = '') {
    if (this.isMock) return `[Mock Groq]: You asked: "${messages[messages.length - 1]?.content}". This is a mock response.`;
    const systemMsg = systemContext || 'You are BrainForge AI, an expert educational tutor. Explain concepts clearly with examples, code snippets where relevant, and an encouraging tone. Keep responses concise but thorough.';
    const formattedMessages = [
      { role: 'system', content: systemMsg },
      ...messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    ];
    const result = await this._complete(formattedMessages, this.fastModel);
    return result || 'I am unable to respond right now. Please try again.';
  }

  async interviewChat(messages, sessionConfig = {}) {
    const { role = 'Software Engineer', interviewType = 'technical', company = '', totalQuestions = 10, currentQuestion = 0 } = sessionConfig;
    const companyCtx = company ? ` at ${company}` : '';
    const systemMsg = `You are a professional ${interviewType} interviewer for a ${role} position${companyCtx}. You are conducting question ${currentQuestion + 1} of ${totalQuestions}. Ask one focused question, listen to the answer, give 1-2 lines of brief feedback, then ask the next question or follow-up. Be professional, adaptive, and thorough. Do NOT reveal the answer before the candidate responds.`;
    const formattedMessages = [
      { role: 'system', content: systemMsg },
      ...messages.map(m => ({
        role: m.role === 'candidate' ? 'user' : 'assistant',
        content: m.content,
      })),
    ];
    const result = await this._complete(formattedMessages, this.smartModel);
    return result || 'Let me think of the next question...';
  }
}

// ─────────────────────────────────────────────
// AI SERVICE — PROVIDER REGISTRY
// ─────────────────────────────────────────────
class AIService {
  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      groq: new GroqProvider(),
    };
    // Default provider per feature type
    this.defaults = {
      chat: 'groq',          // Fast conversational
      quiz: 'gemini',        // Structured JSON
      roadmap: 'gemini',     // Structured JSON
      assessment: 'gemini',  // For career discovery recommendations
      flashcards: 'groq',    // Fast
      notes: 'groq',         // Long context
      lesson: 'groq',        // Long context
      testPaper: 'gemini',   // Structured JSON
      interview: 'groq',     // Conversational + smart
      evaluate: 'groq',      // Reasoning
      resume: 'groq',        // Long context
      code: 'groq',          // Code expertise
    };
    logger.info(`AIService initialized. Providers: ${Object.keys(this.providers).join(', ')}`);
  }

  _getProvider(feature, overrideProvider = null) {
    const providerName = overrideProvider || this.defaults[feature] || 'gemini';
    return this.providers[providerName] || this.providers.gemini;
  }

  async generateRoadmap(topic, provider) {
    return this._getProvider('roadmap', provider).generateRoadmap(topic);
  }

  async generateCareerRecommendations(responses, provider) {
    return this._getProvider('assessment', provider).generateCareerRecommendations(responses);
  }

  async generateQuiz(topic, count, difficulty, provider) {
    return this._getProvider('quiz', provider).generateQuiz(topic, count, difficulty);
  }

  async generateFlashcards(topic, count, provider) {
    return this._getProvider('flashcards', provider).generateFlashcards(topic, count);
  }

  async generateLesson(topic, provider) {
    return this._getProvider('lesson', provider).generateLesson(topic);
  }

  async generateNotes(title, content, provider) {
    return this._getProvider('notes', provider).generateNotes(title, content);
  }

  async generateTestPaper(config, provider) {
    return this._getProvider('testPaper', provider).generateTestPaper(config);
  }

  async generateInterviewQuestions(config, provider) {
    return this._getProvider('interview', provider).generateInterviewQuestions(config);
  }

  async evaluateAnswer(question, answer, type, provider) {
    return this._getProvider('evaluate', provider).evaluateAnswer(question, answer, type);
  }

  async analyzeResume(resumeText, jobDescription, provider) {
    return this._getProvider('resume', provider).analyzeResume(resumeText, jobDescription);
  }

  async reviewCode(code, language, provider) {
    return this._getProvider('code', provider).reviewCode(code, language);
  }

  async chat(messages, systemContext, provider) {
    return this._getProvider('chat', provider).chat(messages, systemContext);
  }

  async interviewChat(messages, sessionConfig, provider) {
    return this._getProvider('interview', provider).interviewChat(messages, sessionConfig);
  }

  getAvailableProviders() {
    return Object.entries(this.providers).map(([name, p]) => ({
      name,
      available: !p.isMock,
    }));
  }
}

module.exports = new AIService();
