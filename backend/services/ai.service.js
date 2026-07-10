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

const REAL_QUESTIONS = {
  javascript: [
    { questionText: 'Which of the following is NOT a JavaScript data type?', options: ['float', 'boolean', 'symbol', 'undefined'], correctAnswerIndex: 0, explanation: 'JavaScript has numbers (which represent both integers and floats), but does not have a separate "float" type.' },
    { questionText: 'What is the correct way to write a template literal in JavaScript?', options: ['`Hello ${name}`', '"Hello " + name', "'Hello ${name}'", '"Hello ${name}"'], correctAnswerIndex: 0, explanation: 'Template literals use backticks (`) and support variable insertion via ${expression}.' },
    { questionText: 'What is the output of typeof null in JavaScript?', options: ['"object"', '"null"', '"undefined"', '"string"'], correctAnswerIndex: 0, explanation: 'This is a long-standing bug in JavaScript where null is classified as an object.' },
    { questionText: 'Which method adds one or more elements to the end of an array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correctAnswerIndex: 0, explanation: 'push() appends elements to the end; unshift() prepends them; pop() removes the last; shift() removes the first.' },
    { questionText: 'What is the purpose of Promise.all()?', options: ['Runs multiple promises in parallel and resolves when all resolve', 'Runs promises sequentially', 'Resolves the fastest promise', 'Rejects all promises'], correctAnswerIndex: 0, explanation: 'Promise.all() accepts an iterable of promises and resolves when all input promises have resolved.' },
    { questionText: 'Which operator is used to compare both value and type in JavaScript?', options: ['===', '==', '=', '!='], correctAnswerIndex: 0, explanation: '=== is the strict equality operator, checking both value and type equivalence.' },
    { questionText: 'What is the primary difference between var and let/const?', options: ['var is function-scoped; let/const are block-scoped', 'let is function-scoped; var is block-scoped', 'const is global-scoped only', 'var is mutable; let is immutable'], correctAnswerIndex: 0, explanation: 'var is scoped to the enclosing function, whereas let and const are block-scoped.' },
    { questionText: 'What does NaN stand for in JavaScript?', options: ['Not a Number', 'Null and None', 'New Array Node', 'Next Assembly Name'], correctAnswerIndex: 0, explanation: 'NaN stands for Not a Number, representing a value which is not a valid number.' },
    { questionText: 'Which keyword is used to declare a block-scoped constant?', options: ['const', 'let', 'var', 'constant'], correctAnswerIndex: 0, explanation: 'const creates a block-scoped read-only reference to a value.' },
    { questionText: 'How do you serialize an object into a JSON string in JavaScript?', options: ['JSON.stringify()', 'JSON.parse()', 'JSON.toFormat()', 'JSON.serialize()'], correctAnswerIndex: 0, explanation: 'JSON.stringify() converts a JavaScript object or value to a JSON string.' },
    { questionText: 'What is the correct way to empty an array named arr?', options: ['arr.length = 0', 'arr = []', 'arr.slice(0, 0)', 'arr.clear()'], correctAnswerIndex: 0, explanation: 'Setting length to 0 empties the array in-place, truncating all elements.' },
    { questionText: 'Which array method creates a new array with all elements that pass a test?', options: ['filter()', 'map()', 'forEach()', 'reduce()'], correctAnswerIndex: 0, explanation: 'filter() creates a shallow copy of a portion of a given array, filtered down to just the elements that pass the test.' }
  ],
  python: [
    { questionText: 'How do you start a function definition in Python?', options: ['def', 'function', 'void', 'define'], correctAnswerIndex: 0, explanation: 'Python functions are declared using the def keyword followed by the function name.' },
    { questionText: 'Which Python data structure is mutable and defined with square brackets?', options: ['list', 'tuple', 'dict', 'set'], correctAnswerIndex: 0, explanation: 'Lists are mutable ordered sequences defined using []. Tuples are immutable and use ().' },
    { questionText: 'What is the output of bool([]) in Python?', options: ['False', 'True', 'None', 'Error'], correctAnswerIndex: 0, explanation: 'Empty collections (lists, tuples, dicts) evaluate to False in boolean contexts.' },
    { questionText: 'How do you handle exceptions in Python?', options: ['try...except', 'try...catch', 'try...handle', 'throw...catch'], correctAnswerIndex: 0, explanation: 'Python uses the try...except block to handle run-time exceptions.' },
    { questionText: 'What does the __init__ method do in Python?', options: ['Initializes a new instance of a class', 'Destroys a class instance', 'Imports a module', 'Prints a message'], correctAnswerIndex: 0, explanation: 'The __init__ method is a constructor that initializes object properties when an instance is created.' },
    { questionText: 'Which statement is used to import all names from a module math in Python?', options: ['from math import *', 'import math.*', 'load math', 'include math'], correctAnswerIndex: 0, explanation: 'The wildcard import from math import * imports all public names defined in math.' },
    { questionText: 'How do you add an element to the end of a list in Python?', options: ['append()', 'add()', 'extend()', 'insert()'], correctAnswerIndex: 0, explanation: 'append() adds its argument as a single element to the end of a list.' },
    { questionText: 'Which keyword is used to create a generator function in Python?', options: ['yield', 'return', 'gen', 'next'], correctAnswerIndex: 0, explanation: 'The yield statement suspends function execution and sends a value back to the caller.' },
    { questionText: 'What is the correct way to get the length of a list named lst in Python?', options: ['len(lst)', 'lst.length()', 'lst.size()', 'count(lst)'], correctAnswerIndex: 0, explanation: 'The built-in len() function returns the number of items in a container.' },
    { questionText: 'Which mutable data structure in Python stores key-value pairs?', options: ['dict', 'set', 'list', 'tuple'], correctAnswerIndex: 0, explanation: 'Dictionaries (dict) store mapping associations of keys to values.' },
    { questionText: 'What is the result of 3 // 2 in Python?', options: ['1', '1.5', '2', '0'], correctAnswerIndex: 0, explanation: '// is the floor division operator, rounding down to the nearest integer.' },
    { questionText: 'Which string method removes both leading and trailing whitespaces in Python?', options: ['strip()', 'trim()', 'clear()', 'clean()'], correctAnswerIndex: 0, explanation: 'strip() returns a copy of the string with leading and trailing characters (default whitespace) removed.' }
  ],
  react: [
    { questionText: 'Which Hook should you use to run side effects in a functional component?', options: ['useEffect', 'useState', 'useContext', 'useReducer'], correctAnswerIndex: 0, explanation: 'useEffect handles side effects like API requests, subscriptions, and DOM updates.' },
    { questionText: 'What is a key rule of React Hooks?', options: ['Only call Hooks at the top level', 'Only call Hooks inside loops', 'Only call Hooks in class components', 'Call Hooks conditionally'], correctAnswerIndex: 0, explanation: 'Hooks must not be called inside loops, conditions, or nested functions.' },
    { questionText: 'How do you prevent a component from re-rendering unless its props change?', options: ['React.memo()', 'useCallback()', 'useMemo()', 'useState()'], correctAnswerIndex: 0, explanation: 'React.memo is a higher-order component that memoizes the rendered output to prevent unnecessary updates.' },
    { questionText: 'What does useState return?', options: ['A state variable and a setter function', 'Just the state value', 'A dispatch function', 'A state object'], correctAnswerIndex: 0, explanation: 'useState returns a pair: the current state value and a function that updates it.' },
    { questionText: 'Which hook is used to reference a DOM element directly?', options: ['useRef', 'useMemo', 'useImperativeHandle', 'useLayoutEffect'], correctAnswerIndex: 0, explanation: 'useRef creates a mutable object whose .current property references the passed DOM node.' },
    { questionText: 'What is the primary purpose of useMemo in React?', options: ['Memoize a computed value to prevent recalculation', 'Memoize a callback function', 'Declare a state variable', 'Trigger side effects'], correctAnswerIndex: 0, explanation: 'useMemo caches the result of a calculation between re-renders.' },
    { questionText: 'What is the Virtual DOM in React?', options: ['A lightweight JavaScript representation of the real DOM', 'A browser plugin', 'A direct copy of HTML elements', 'A style sheet library'], correctAnswerIndex: 0, explanation: 'React keeps a lightweight representation of the UI in memory and syncs it with the real DOM.' },
    { questionText: 'Which prop is required when rendering a list of items to help React identify changes?', options: ['key', 'id', 'index', 'name'], correctAnswerIndex: 0, explanation: 'React uses the key prop to track which items have changed, been added, or been removed.' },
    { questionText: 'How do you declare a state variable in a functional React component?', options: ['const [value, setValue] = useState(initial)', 'let value = useState()', 'this.state = {}', 'React.createState()'], correctAnswerIndex: 0, explanation: 'The useState hook is the standard API to initialize and set state in functional components.' },
    { questionText: 'Which hook is used to access context values directly?', options: ['useContext', 'useState', 'useReducer', 'useLayoutEffect'], correctAnswerIndex: 0, explanation: 'useContext accepts a context object and returns the current context value.' },
    { questionText: 'What is the default port for local Vite dev servers in React projects?', options: ['5173', '3000', '8080', '5000'], correctAnswerIndex: 0, explanation: 'Vite launches its development server on port 5173 by default.' },
    { questionText: 'Which React lifecycle method is replaced by returning a cleanup function in useEffect?', options: ['componentWillUnmount', 'componentDidMount', 'componentDidUpdate', 'shouldComponentUpdate'], correctAnswerIndex: 0, explanation: 'Returning a function from the useEffect callback handles cleanup tasks, similar to componentWillUnmount.' }
  ],
  git: [
    { questionText: 'Which command initializes a new local Git repository?', options: ['git init', 'git create', 'git start', 'git clone'], correctAnswerIndex: 0, explanation: 'git init creates an empty Git repository or reinitializes an existing one.' },
    { questionText: 'How do you save your changes to the staging area in Git?', options: ['git add', 'git commit', 'git save', 'git push'], correctAnswerIndex: 0, explanation: 'git add stages untracked or modified files; git commit permanently records them.' },
    { questionText: 'Which command shows the commit history of a repository?', options: ['git log', 'git status', 'git history', 'git show'], correctAnswerIndex: 0, explanation: 'git log lists commits in reverse chronological order.' },
    { questionText: 'How do you download changes and merge them from a remote branch?', options: ['git pull', 'git fetch', 'git clone', 'git push'], correctAnswerIndex: 0, explanation: 'git pull fetches changes and immediately merges them into your current local branch.' },
    { questionText: 'How do you view the status of tracked/untracked files in Git?', options: ['git status', 'git show', 'git log', 'git check'], correctAnswerIndex: 0, explanation: 'git status displays the state of the working directory and the staging area.' },
    { questionText: 'Which command discards all uncommitted local modifications in Git?', options: ['git restore .', 'git clear', 'git clean', 'git delete'], correctAnswerIndex: 0, explanation: 'git restore . discards changes in the working directory for the current folder path.' },
    { questionText: 'How do you temporarily save changes without committing them in Git?', options: ['git stash', 'git save', 'git pause', 'git hold'], correctAnswerIndex: 0, explanation: 'git stash shelves local modifications, reverting the working directory to match the HEAD commit.' },
    { questionText: 'Which command merges branch feature into your current active branch?', options: ['git merge feature', 'git join feature', 'git push feature', 'git checkout feature'], correctAnswerIndex: 0, explanation: 'git merge incorporates changes from the named commit/branch into the current branch.' },
    { questionText: 'How do you set your commit author name globally in Git?', options: ['git config --global user.name "Name"', 'git set name', 'git author set', 'git register name'], correctAnswerIndex: 0, explanation: 'git config is used to set configuration options globally with the --global flag.' },
    { questionText: 'What is the default name of the first branch in modern Git repositories?', options: ['main', 'master', 'trunk', 'development'], correctAnswerIndex: 0, explanation: 'Modern repositories default to naming the main development branch "main".' },
    { questionText: 'Which command shows who modified each line of a file?', options: ['git blame', 'git trace', 'git history', 'git inspect'], correctAnswerIndex: 0, explanation: 'git blame annotates each line in the given file with information from the revision which introduced the line.' },
    { questionText: 'How do you download files from a remote repository for the first time?', options: ['git clone', 'git init', 'git download', 'git pull'], correctAnswerIndex: 0, explanation: 'git clone clones a repository into a newly created directory.' }
  ],
  sql: [
    { questionText: 'Which clause is used to filter rows in a SQL query?', options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], correctAnswerIndex: 0, explanation: 'WHERE filters records before grouping; HAVING filters records after grouping.' },
    { questionText: 'Which JOIN returns all matching records and all left table records?', options: ['LEFT JOIN', 'INNER JOIN', 'RIGHT JOIN', 'FULL JOIN'], correctAnswerIndex: 0, explanation: 'A LEFT JOIN returns all rows from the left table, with corresponding matching values from the right.' },
    { questionText: 'What is the purpose of a PRIMARY KEY in a table?', options: ['Uniquely identifies each record in the table', 'Speeds up text searching', 'Links two tables together', 'Allows duplicate values'], correctAnswerIndex: 0, explanation: 'A Primary Key uniquely identifies rows, preventing duplicate entries and null values.' },
    { questionText: 'Which SQL aggregate function returns the number of rows in a query?', options: ['COUNT()', 'SUM()', 'ROWS()', 'TOTAL()'], correctAnswerIndex: 0, explanation: 'COUNT() returns the total count of matched records.' },
    { questionText: 'How do you sort query results in ascending order in SQL?', options: ['ORDER BY column ASC', 'SORT BY column', 'GROUP BY column', 'FILTER BY column'], correctAnswerIndex: 0, explanation: 'ORDER BY column ASC arranges the records in ascending order.' },
    { questionText: 'Which database constraint ensures that all values in a column are different?', options: ['UNIQUE', 'NOT NULL', 'CHECK', 'DEFAULT'], correctAnswerIndex: 0, explanation: 'The UNIQUE constraint ensures that all values in a column are unique.' },
    { questionText: 'How do you update existing data in a database table?', options: ['UPDATE', 'INSERT', 'SET', 'MODIFY'], correctAnswerIndex: 0, explanation: 'The UPDATE statement is used to modify existing records in a table.' },
    { questionText: 'Which clause is used to filter group metrics in aggregate functions?', options: ['HAVING', 'WHERE', 'GROUP BY', 'FILTER'], correctAnswerIndex: 0, explanation: 'HAVING is used to filter groups summarized by GROUP BY clauses.' },
    { questionText: 'What does ACID stand for in database transaction management?', options: ['Atomicity, Consistency, Isolation, Durability', 'Accuracy, Completeness, Integrity, Dependency', 'Access, Control, Indexing, Delivery', 'Automated, Compiled, Indexed, Distributed'], correctAnswerIndex: 0, explanation: 'ACID transactions guarantee validity even in the event of errors or power failures.' },
    { questionText: 'Which command is used to remove a table schema and its contents entirely?', options: ['DROP TABLE', 'DELETE TABLE', 'TRUNCATE TABLE', 'REMOVE TABLE'], correctAnswerIndex: 0, explanation: 'DROP TABLE deletes the table definition and all row data permanently.' },
    { questionText: 'Which constraint links one table primary key to another table?', options: ['FOREIGN KEY', 'PRIMARY KEY', 'LINK KEY', 'INDEX KEY'], correctAnswerIndex: 0, explanation: 'A FOREIGN KEY is a field in one table that uniquely identifies a row of another table.' },
    { questionText: 'What does a database index optimize in relational tables?', options: ['Query search performance', 'Insert speed', 'Data consistency', 'Schema storage size'], correctAnswerIndex: 0, explanation: 'Indexes speed up select queries, but can slow down inserts and updates.' }
  ],
  dsa: [
    { questionText: 'What is the worst-case time complexity of searching in a Binary Search Tree (BST)?', options: ['O(N)', 'O(log N)', 'O(1)', 'O(N log N)'], correctAnswerIndex: 0, explanation: 'If the BST is skewed (unbalanced), searching degrades to O(N).' },
    { questionText: 'Which data structure operates on a Last-In-First-Out (LIFO) basis?', options: ['Stack', 'Queue', 'Linked List', 'Heap'], correctAnswerIndex: 0, explanation: 'Stacks are LIFO structures (elements pushed last are popped first).' },
    { questionText: 'What is the average-case time complexity of Quick Sort?', options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(log N)'], correctAnswerIndex: 0, explanation: 'Quick Sort divides the input array in halves on average, leading to O(N log N) efficiency.' },
    { questionText: 'Which data structure operates on a First-In-First-Out (FIFO) basis?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correctAnswerIndex: 0, explanation: 'Queues are FIFO structures (first element added is the first one processed).' },
    { questionText: 'What is the time complexity to access an element in an array by index?', options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'], correctAnswerIndex: 0, explanation: 'Array indexing is direct offset arithmetic, completed in constant O(1) time.' },
    { questionText: 'Which algorithm is used to find the shortest path in a weighted graph?', options: ['Dijkstra\'s Algorithm', 'Kruskal\'s Algorithm', 'Depth First Search', 'Binary Search'], correctAnswerIndex: 0, explanation: 'Dijkstra\'s algorithm computes the single-source shortest path tree on weighted graphs.' },
    { questionText: 'What is the space complexity of a basic recursive Fibonacci function without memoization?', options: ['O(N)', 'O(1)', 'O(2^N)', 'O(N^2)'], correctAnswerIndex: 0, explanation: 'The recursion call stack depth reaches N, requiring O(N) space.' },
    { questionText: 'Which sorting algorithm is stable and has worst-case O(N log N) time complexity?', options: ['Merge Sort', 'Quick Sort', 'Bubble Sort', 'Selection Sort'], correctAnswerIndex: 0, explanation: 'Merge Sort is stable and guarantees O(N log N) worst-case time complexity.' },
    { questionText: 'Which structure utilizes a hash function to map keys to bucket indices?', options: ['Hash Map', 'Linked List', 'Trie', 'Heap'], correctAnswerIndex: 0, explanation: 'Hash maps index data using keys converted to array indices via hash functions.' },
    { questionText: 'What is the height of a balanced binary search tree with N elements?', options: ['O(log N)', 'O(N)', 'O(1)', 'O(N log N)'], correctAnswerIndex: 0, explanation: 'A balanced BST maintains height proportional to the logarithm of the number of elements.' },
    { questionText: 'Which data structure is ideal for implementing undo functionality?', options: ['Stack', 'Queue', 'Array', 'Graph'], correctAnswerIndex: 0, explanation: 'A Stack stores state changes in a LIFO order, allowing easy back-stepping.' },
    { questionText: 'What is the main characteristic of a Trie (Prefix Tree)?', options: ['Optimized for fast string prefix lookups', 'Binary search representation', 'LIFO queue representation', 'Unordered mapping storage'], correctAnswerIndex: 0, explanation: 'Tries store sequences as paths, making prefix searches extremely fast.' }
  ]
};

const fallbackQuestions = (topic, count) => [
  { questionText: 'What is the primary role of a compiler in computer science?', options: ['Translates source code into machine code', 'Executes the program directly', 'Finds syntax errors during run-time', 'Manages memory layouts'], correctAnswerIndex: 0, explanation: 'Compilers translate source code written in a high-level programming language into machine code for execution.' },
  { questionText: 'Which of the following is considered an immutable data type?', options: ['String', 'Array', 'Object', 'Dictionary'], correctAnswerIndex: 0, explanation: 'Strings are immutable in many languages (like JS and Python)—any modification creates a new string.' },
  { questionText: 'What does the term "API" stand for?', options: ['Application Programming Interface', 'Application Processor Integration', 'Advanced Programming Instruction', 'Auto Program Initiator'], correctAnswerIndex: 0, explanation: 'API stands for Application Programming Interface, which allows software systems to communicate.' },
  { questionText: 'What is the purpose of version control software (e.g. Git)?', options: ['Track and manage code changes over time', 'Compile code into binaries', 'Deploy websites to host servers', 'Run performance profiling checks'], correctAnswerIndex: 0, explanation: 'Version control software manages the history of changes made to source files.' },
  { questionText: 'Which data structure uses key-value pairs for constant-time lookups?', options: ['Hash Table / Dictionary', 'Linked List', 'Binary Tree', 'Stack'], correctAnswerIndex: 0, explanation: 'Hash tables map keys to values using hash functions, achieving average O(1) retrieval times.' }
];

const mockQuiz = (topic, count = 5, difficulty = 'medium') => {
  const normTopic = topic.toLowerCase();
  let baseQuestions = [];

  if (normTopic.includes('javascript') || normTopic.includes('js')) {
    baseQuestions = REAL_QUESTIONS.javascript;
  } else if (normTopic.includes('python')) {
    baseQuestions = REAL_QUESTIONS.python;
  } else if (normTopic.includes('react')) {
    baseQuestions = REAL_QUESTIONS.react;
  } else if (normTopic.includes('git')) {
    baseQuestions = REAL_QUESTIONS.git;
  } else if (normTopic.includes('sql') || normTopic.includes('database')) {
    baseQuestions = REAL_QUESTIONS.sql;
  } else if (normTopic.includes('dsa') || normTopic.includes('algorithm') || normTopic.includes('structure')) {
    baseQuestions = REAL_QUESTIONS.dsa;
  }

  // Create a copy of matched base questions and shuffle them
  let selected = [...baseQuestions].sort(() => Math.random() - 0.5);

  // If the count requested is greater than what is available, or if we had no topic matches
  if (selected.length < count) {
    // Shuffled general fallbacks
    const generalPool = fallbackQuestions(topic, count).sort(() => Math.random() - 0.5);
    
    // Add unique general questions that don't match already selected ones
    for (const fallbackQ of generalPool) {
      if (selected.length >= count) break;
      const alreadyExists = selected.some(q => q.questionText === fallbackQ.questionText);
      if (!alreadyExists) {
        selected.push(fallbackQ);
      }
    }
  }

  // Slice down to requested count
  selected = selected.slice(0, count);

  // Shuffle options for each question
  return selected.map(q => {
    const optionsWithIndices = q.options.map((opt, idx) => ({
      opt,
      isCorrect: idx === q.correctAnswerIndex
    }));
    const shuffledOpts = optionsWithIndices.sort(() => Math.random() - 0.5);
    return {
      questionText: q.questionText,
      options: shuffledOpts.map(o => o.opt),
      correctAnswerIndex: shuffledOpts.findIndex(o => o.isCorrect),
      points: q.points || 10,
      explanation: q.explanation || 'No explanation provided.'
    };
  });
};

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
      const systemInstruction = systemContext || 'You are AI Career Guidance, a world-class educational guide and tutor. Help students understand concepts clearly, recommend the best learning resources and channels, use examples, and maintain an encouraging teaching tone.';
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
    this.fastModel = 'llama-3.1-8b-instant';       // Fast responses
    this.smartModel = 'llama-3.3-70b-versatile';    // Complex reasoning
    this.longModel = 'mixtral-8x7b-32768';          // Long context (resume, notes)
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
    const systemMsg = systemContext || 'You are AI Career Guidance, an expert educational guide and tutor. Help students understand concepts clearly, recommend the best learning resources, use code snippets where relevant, and maintain an encouraging tone. Keep responses concise but thorough.';
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
