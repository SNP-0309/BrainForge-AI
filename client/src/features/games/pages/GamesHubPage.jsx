import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Gamepad2, Sparkles, BookOpen, Star, HelpCircle, Trophy, RefreshCw, ChevronRight } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useToastStore } from '../../../store/toastStore';
import { useAuthStore } from '../../../store/authStore';
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
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'memory'
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [aiProvider, setAiProvider] = useState('groq');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
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

  const handleStartMemoryMatch = (selectedTopic) => {
    navigate(`/games/memory-match?topic=${encodeURIComponent(selectedTopic)}`);
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
          onClick={() => setActiveTab('memory')}
          className={`px-5 py-2 font-black text-sm uppercase transition-all rounded-xl border-2 border-black ${
            activeTab === 'memory'
              ? 'bg-brutal-pink text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5'
              : 'bg-white text-black/75 hover:bg-black/5'
          }`}
        >
          Concept Memory Match
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
                  <p className="text-xs font-bold text-black/60">Customize a custom quiz on any topic. Our AI generates unique questions tailored for you.</p>
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
            <Card bg="#FFFFFF" className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brutal-pink border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                  <Gamepad2 className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase text-black">Concept Memory Match</h2>
                  <p className="text-xs font-bold text-black/60">Select a deck, match the tech terms with definitions in as few attempts as possible, and improve recall.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DEFAULT_TOPICS.map((t) => (
                  <Card 
                    key={t}
                    hover
                    onClick={() => handleStartMemoryMatch(t)}
                    className="cursor-pointer border-2 border-black hover:-translate-x-0.5 hover:-translate-y-0.5 p-4 flex flex-col justify-between min-h-[140px]"
                  >
                    <div>
                      <span className="bg-brutal-purple border border-black text-[9px] font-mono font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                        DECK
                      </span>
                      <h4 className="text-sm font-black uppercase text-black mt-2 leading-snug">{t}</h4>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[10px] font-bold text-black/65">12 cards matching</span>
                      <Button size="sm" variant="secondary" className="px-3.5 py-1 text-xs">
                        Play Deck
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
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
              <li>Practice quizzes daily to build long-term memory match patterns.</li>
              <li>All topic quizzes are generated dynamically by AI for infinite practice.</li>
            </ul>
          </Card>

          {/* Tips */}
          <Card bg="#FFFDF6" className="p-5 space-y-3">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-black" /> Pro Tip
            </h3>
            <p className="text-xs font-bold leading-relaxed text-black/75">
              Struggling with a concept on your learning roadmap? Go to the <strong>Roadmaps</strong> page, select that specific node, click study details, and practice questions here will match that module instantly!
            </p>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
