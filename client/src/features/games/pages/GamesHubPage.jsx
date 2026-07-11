import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Gamepad2, Sparkles, BookOpen, HelpCircle, RefreshCw, ChevronRight, Bug, Clock, Zap } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useToastStore } from '../../../store/toastStore';
import api from '../../../config/api';

const DEFAULT_TOPICS = [
  'JavaScript Basics',
  'Python Object Oriented Programming',
  'React Hooks',
  'Database Normalization',
  'Git Branching & Merges',
  'Data Structures & Algorithms'
];

export default function GamesHubPage() {
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'bughunt'
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [aiProvider, setAiProvider] = useState('groq');
  const [loading, setLoading] = useState(false);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    const finalTopic = topic.trim() || 'General Web Development';
    setLoading(true);
    try {
      showToast(`Generating AI Quiz on "${finalTopic}" using ${aiProvider}...`, 'info');
      const res = await api.post('/quizzes/generate', {
        topic: finalTopic,
        difficulty,
        questionCount,
        aiProvider
      });
      const quizId = res.data.data._id;
      showToast('Quiz generated! Let\'s test your knowledge.', 'success');
      navigate(`/games/quiz/${quizId}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate quiz. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBugHunt = () => {
    navigate('/games/bug-hunt');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-4xl mx-auto space-y-8 text-black"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-wider flex items-center gap-3">
            AI Career Guidance Games Hub <Gamepad2 className="w-8 h-8 text-brutal-pink" />
          </h1>
          <p className="text-sm font-bold text-black/70 mt-2">
            Practice, reinforce core concepts, and level up your skills through interactive games and quizzes.
          </p>
        </div>
      </div>

      {/* Tabs selector */}
      <div className="flex gap-4 border-b-4 border-black pb-2">
        <button
          onClick={() => setActiveTab('quiz')}
          className={`px-5 py-2 font-black text-sm uppercase transition-all rounded-xl border-2 border-black ${
            activeTab === 'quiz'
              ? 'bg-brutal-yellow text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
              : 'bg-white text-black/75 hover:bg-black/5'
          }`}
        >
          AI Quiz Arena
        </button>
        <button
          onClick={() => setActiveTab('bughunt')}
          className={`px-5 py-2 font-black text-sm uppercase transition-all rounded-xl border-2 border-black flex items-center gap-2 ${
            activeTab === 'bughunt'
              ? 'bg-brutal-pink text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
              : 'bg-white text-black/75 hover:bg-black/5'
          }`}
        >
          <Bug className="w-4 h-4" /> Bug Hunt
        </button>
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main interactive panel */}
        <div className="md:col-span-2">
          {activeTab === 'quiz' ? (
            <Card bg="#FFFFFF" className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                  <Brain className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-black flex items-center gap-1.5">
                    Generate New Quiz <Sparkles className="w-4 h-4 text-amber-500" />
                  </h2>
                  <p className="text-xs font-bold text-black/60">Customize a quiz on any topic. Our AI generates unique questions tailored for you.</p>
                </div>
              </div>

              <form onSubmit={handleGenerateQuiz} className="space-y-4">
                <Input
                  label="Quiz Topic"
                  placeholder="e.g. React Hooks, Docker Containers, CSS Grid..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                />

                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className="text-[11px] font-black uppercase bg-brutal-cream/70 border border-black px-2.5 py-1 rounded-md hover:bg-brutal-yellow transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Difficulty */}
                  <div className="space-y-1 text-black">
                    <label className="block text-xs font-black uppercase">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      disabled={loading}
                      className="w-full bg-white border-[3px] border-black rounded-xl px-3 py-2.5 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <option value="easy">Easy</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  {/* Question Count */}
                  <div className="space-y-1 text-black">
                    <label className="block text-xs font-black uppercase">Questions</label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      disabled={loading}
                      className="w-full bg-white border-[3px] border-black rounded-xl px-3 py-2.5 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                    </select>
                  </div>

                  {/* AI Provider */}
                  <div className="space-y-1 text-black">
                    <label className="block text-xs font-black uppercase">AI Engine</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                      disabled={loading}
                      className="w-full bg-white border-[3px] border-black rounded-xl px-3 py-2.5 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <option value="groq">Groq (Fastest)</option>
                      <option value="gemini">Gemini (Balanced)</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  bg="#FFE600"
                  className="w-full justify-center py-3 flex items-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Generating Quiz...
                    </>
                  ) : (
                    <>
                      Generate & Start Quiz <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </Card>
          ) : (
            /* Bug Hunt Tab */
            <Card bg="#FFFFFF" className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brutal-pink border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                  <Bug className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-black">🐛 Bug Hunt Challenge</h2>
                  <p className="text-xs font-bold text-black/60">Find the bug hiding in real code snippets. Click the buggy line before the timer runs out!</p>
                </div>
              </div>

              {/* Game preview card */}
              <div className="rounded-xl border-[3px] border-black overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-black px-4 py-2 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-[10px] font-mono text-white/50 font-bold">code.js — preview</span>
                </div>
                <div className="bg-[#1a1a2e] font-mono text-sm px-4 py-3 space-y-1">
                  <div className="flex gap-3 text-[#a9c5e8]"><span className="text-white/30 w-4 text-right">1</span><span>function findSum(arr) {'{'}</span></div>
                  <div className="flex gap-3 bg-red-600/25 border-l-4 border-red-500 -mx-4 px-4 text-red-300 line-through"><span className="text-white/30 w-4 text-right">2</span><span>{'  return arr.filter((a,b) => a + b, 0);'}</span></div>
                  <div className="flex gap-3 text-[#a9c5e8]"><span className="text-white/30 w-4 text-right">3</span><span>{'}'}</span></div>
                </div>
              </div>

              {/* Scoring info */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-brutal-green/20 border-2 border-black rounded-xl p-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-[9px] font-mono font-black text-black/50 uppercase">Correct</p>
                  <p className="text-base font-black text-black">+10 pts</p>
                </div>
                <div className="bg-brutal-pink/20 border-2 border-black rounded-xl p-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-[9px] font-mono font-black text-black/50 uppercase">Wrong</p>
                  <p className="text-base font-black text-black">−3 pts</p>
                </div>
                <div className="bg-brutal-yellow/40 border-2 border-black rounded-xl p-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-[9px] font-mono font-black text-black/50 uppercase">Timer</p>
                  <p className="text-base font-black text-black">30s</p>
                </div>
              </div>

              <Button
                onClick={handleStartBugHunt}
                bg="#FFAED7"
                className="w-full justify-center py-3.5 flex items-center gap-2"
              >
                <Bug className="w-5 h-5" /> Start Bug Hunt <ChevronRight className="w-4 h-4" />
              </Button>
            </Card>
          )}
        </div>

        {/* Sidebar info / rules */}
        <div className="space-y-6">
          {/* Rules / Rewards */}
          <Card bg="#E9D5FF" className="p-5 text-black space-y-4 border-3 border-black">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-5 h-5 text-black shrink-0" /> Review & Retention
            </h3>
            
            <ul className="text-xs font-bold space-y-2.5 list-disc list-inside leading-relaxed text-black/85">
              <li>Reinforce concept retention and recall after completing lessons.</li>
              <li>A passing score (70% or more) validates your learning completion.</li>
              <li>Bug Hunt sharpens your ability to read and debug real code.</li>
              <li>All quizzes are generated dynamically by AI for infinite practice.</li>
            </ul>
          </Card>

          {/* Bug Hunt Tips */}
          <Card bg="#FFFDF6" className="p-5 space-y-3">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Bug className="w-5 h-5 text-black" /> Bug Hunt Tips
            </h3>
            <ul className="text-xs font-bold leading-relaxed text-black/75 space-y-2">
              <li>🔍 Read the description carefully — it tells you what the code <em>should</em> do.</li>
              <li>⏱ Act fast — you only have <strong>30 seconds</strong> per challenge.</li>
              <li>🎯 Look for typos, wrong operators, and logic errors first.</li>
              <li>📚 Each bug comes with a detailed explanation after you answer.</li>
            </ul>
          </Card>

          {/* Tips */}
          <Card bg="#FFFDF6" className="p-5 space-y-3">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-black" /> Pro Tip
            </h3>
            <p className="text-xs font-bold leading-relaxed text-black/75">
              Struggling with a concept on your learning roadmap? Go to the <strong>Roadmaps</strong> page, select that module, and use the AI Quiz tool to generate questions matching that topic instantly!
            </p>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
