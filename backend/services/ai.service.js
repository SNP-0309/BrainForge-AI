const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiProvider {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY is not defined. Gemini Provider will run in MOCK mode.');
      this.isMock = true;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isMock = false;
      logger.info('Gemini AI Provider initialized successfully');
    }
  }

  async generateRoadmap(topic) {
    if (this.isMock) {
      return this.getMockRoadmap(topic);
    }
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `Generate a logical, step-by-step learning roadmap for the topic: "${topic}".
      Return ONLY a JSON array of nodes.
      Each node must follow this exact JSON structure:
      {
        "id": "node_1",
        "label": "Introduction to Topic",
        "type": "lesson",
        "status": "available",
        "dependencies": []
      }
      For subsequent nodes, set the "status" to "locked", and "dependencies" to contain the ID(s) of nodes that must precede them.
      Generate 4 to 8 nodes mapped sequentially from beginner to advanced. Use types "lesson", "quiz", and "milestone".`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      logger.error(`Gemini generateRoadmap failed: ${error.message}. Returning mock.`);
      return this.getMockRoadmap(topic);
    }
  }

  async generateQuiz(topic, questionCount = 5, difficulty = 'intermediate') {
    if (this.isMock) {
      return this.getMockQuiz(topic, questionCount, difficulty);
    }
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `Create a quiz on the topic: "${topic}".
      Difficulty: ${difficulty}.
      Number of questions: ${questionCount}.
      Return ONLY a JSON array of questions matching the following exact format:
      [
        {
          "questionText": "What is ...?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswerIndex": 0,
          "points": 10,
          "explanation": "Option A is correct because..."
        }
      ]
      Ensure the correctAnswerIndex is a 0-indexed integer corresponding to the options list.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      logger.error(`Gemini generateQuiz failed: ${error.message}. Returning mock.`);
      return this.getMockQuiz(topic, questionCount, difficulty);
    }
  }

  async generateNotes(lessonTitle, content) {
    if (this.isMock) {
      return this.getMockNotes(lessonTitle, content);
    }
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Write a comprehensive, premium-quality markdown summary and study notes based on this lesson:
      Title: ${lessonTitle}
      Content/Syllabus: ${content}
      
      Structure the output with:
      1. Core Concepts (detailed descriptions)
      2. Code snippets / Practical examples (if applicable)
      3. Key Takeaways
      4. 3-5 Flashcard Q&As styled as markdown list (Q: ..., A: ...)`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error(`Gemini generateNotes failed: ${error.message}. Returning mock.`);
      return this.getMockNotes(lessonTitle, content);
    }
  }

  async reviewCode(code, language = 'javascript') {
    if (this.isMock) {
      return this.getMockCodeReview(code, language);
    }
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a Senior Staff Engineer and AI Code Reviewer. Review the following ${language} code snippet:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      Provide a highly critical, constructive, and detailed markdown response summarizing:
      1. General Quality Score (0-10)
      2. Security Vulnerabilities or Bugs
      3. Performance Bottlenecks / Space-Time Optimizations
      4. Refactored / Optimized Code block with comments`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error(`Gemini reviewCode failed: ${error.message}. Returning mock.`);
      return this.getMockCodeReview(code, language);
    }
  }

  async chat(messages) {
    if (this.isMock) {
      return this.getMockChat(messages);
    }
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Convert messages to Gemini history structure
      const systemInstruction = "You are a world-class AI Doubt Solver and Tutor named BrainForge AI Assistant. Explain complex concepts in simple terms, provide code examples, and maintain an encouraging educational tone.";
      
      const formattedHistory = messages.slice(0, -1).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      const lastMessage = messages[messages.length - 1].content;
      
      const chat = model.startChat({
        history: formattedHistory,
        systemInstruction: systemInstruction
      });
      
      const result = await chat.sendMessage(lastMessage);
      return result.response.text();
    } catch (error) {
      logger.error(`Gemini chat failed: ${error.message}. Returning mock.`);
      return this.getMockChat(messages);
    }
  }

  // --- MOCK FALLBACK IMPLEMENTATIONS ---

  getMockRoadmap(topic) {
    return [
      { id: 'node_1', label: `Introduction to ${topic}`, type: 'lesson', status: 'available', dependencies: [] },
      { id: 'node_2', label: `Core Principles of ${topic}`, type: 'lesson', status: 'locked', dependencies: ['node_1'] },
      { id: 'node_3', label: `First ${topic} Quiz`, type: 'quiz', status: 'locked', dependencies: ['node_2'] },
      { id: 'node_4', label: `Advanced Patterns in ${topic}`, type: 'lesson', status: 'locked', dependencies: ['node_3'] },
      { id: 'node_5', label: `Capstone Milestone: Mastery of ${topic}`, type: 'milestone', status: 'locked', dependencies: ['node_4'] }
    ];
  }

  getMockQuiz(topic, questionCount, difficulty) {
    const list = [];
    for (let i = 1; i <= questionCount; i++) {
      list.push({
        questionText: `Mock Question ${i} about ${topic} (${difficulty} level)`,
        options: [
          `Incorrect Choice 1 for question ${i}`,
          `The Correct Answer for question ${i}`,
          `Incorrect Choice 2 for question ${i}`,
          `Incorrect Choice 3 for question ${i}`
        ],
        correctAnswerIndex: 1,
        points: 10,
        explanation: `This is the mock explanation explaining why option index 1 is correct for question ${i}.`
      });
    }
    return list;
  }

  getMockNotes(lessonTitle, content) {
    return `# Study Notes: ${lessonTitle}
    
## Core Concepts
This is a mock study note summarizing the details of **${lessonTitle}**.
- **Foundations:** Concept introduction for: *${content.slice(0, 100)}...*
- **Key Mechanics:** Exploring the details and standard design.

## Flashcards
- **Q:** What is the primary purpose of ${lessonTitle}?
  - **A:** Mock answer outlining educational core mechanics.
- **Q:** How do we optimize this topic?
  - **A:** Maintain clean code, run validation, and use caching.`;
  }

  getMockCodeReview(code, language) {
    return `# AI Code Review (${language})
    
## 1. Quality Score: 8/10
The code structure is sound but contains standard mock performance gaps.

## 2. Issues Detected
- **Security:** Ensure input values are fully validated using Zod.
- **Complexity:** Redundant calculations can be cached locally.

## 3. Optimized Version
\`\`\`${language}
// Optimized code mock
function process() {
  console.log("Mock optimized script: " + Date.now());
}
\`\`\``;
  }

  getMockChat(messages) {
    const lastMsg = messages[messages.length - 1].content;
    return `[Mock AI Assistant]: Thank you for asking. You asked: "${lastMsg}". In a real environment, this utilizes Google Gemini to provide a detailed doubt-solving explanation. Let me know if you would like me to detail another concept!`;
  }
}

// Singleton Service Coordinator
class AIService {
  constructor() {
    this.provider = new GeminiProvider();
  }

  async generateRoadmap(topic) {
    return this.provider.generateRoadmap(topic);
  }

  async generateQuiz(topic, questionCount, difficulty) {
    return this.provider.generateQuiz(topic, questionCount, difficulty);
  }

  async generateNotes(lessonTitle, content) {
    return this.provider.generateNotes(lessonTitle, content);
  }

  async reviewCode(code, language) {
    return this.provider.reviewCode(code, language);
  }

  async chat(messages) {
    return this.provider.chat(messages);
  }
}

module.exports = new AIService();
