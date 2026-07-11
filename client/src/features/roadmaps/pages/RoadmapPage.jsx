import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../config/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';
import { 
  Award, BookOpen, CheckCircle, ChevronRight, Compass, Lock, 
  PlayCircle, RefreshCw, X, Sparkles, 
  Brain, FileText, LayoutGrid, Zap, HelpCircle as QuizIcon,
  Map, Trophy, Target, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COURSES } from '../../../data/courses.data';

// Match roadmap labels to tech categories
const matchCategory = (label) => {
  const clean = label.toLowerCase();
  if (clean.includes('html')) return 'HTML5';
  if (clean.includes('css')) return 'CSS3';
  if (clean.includes('javascript') || clean.includes('js')) return 'JavaScript';
  if (clean.includes('react')) return 'React.js';
  if (clean.includes('node')) return 'Node.js';
  if (clean.includes('express')) return 'Express.js';
  if (clean.includes('mongodb') || clean.includes('mongo')) return 'MongoDB';
  if (clean.includes('git') || clean.includes('github')) return 'Git & GitHub';
  if (clean.includes('python')) return 'Python';
  if (clean.includes('java ') || clean.trim() === 'java') return 'Java';
  if (clean.includes('c++') || clean.includes('cpp')) return 'C++';
  if (clean.trim() === 'c' || clean.includes('c programming')) return 'C';
  if (clean.includes('sql') || clean.includes('database')) return 'SQL';
  if (clean.includes('deep learning')) return 'Deep Learning';
  if (clean.includes('machine learning') || clean.includes('ml')) return 'Machine Learning';
  if (clean.includes('dsa') || clean.includes('data structure') || clean.includes('algorithm')) return 'Data Structures & Algorithms';
  return null;
};

// Node status style config
const nodeConfig = {
  completed: {
    circleColor: 'bg-brutal-green',
    cardBg: 'bg-white',
    badge: 'COMPLETED',
    badgeBg: 'bg-brutal-green',
    Icon: CheckCircle,
    shadow: 'shadow-[3px_3px_0px_0px_rgba(74,222,128,0.5)]',
  },
  available: {
    circleColor: 'bg-brutal-yellow',
    cardBg: 'bg-white',
    badge: 'IN PROGRESS',
    badgeBg: 'bg-brutal-yellow',
    Icon: PlayCircle,
    shadow: 'shadow-brutal',
  },
  locked: {
    circleColor: 'bg-white',
    cardBg: 'bg-black/5',
    badge: 'LOCKED',
    badgeBg: 'bg-white/30',
    Icon: Lock,
    shadow: '',
  },
};

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [completingNodeId, setCompletingNodeId] = useState(null);
  
  // AI Tools Overlays State
  const [activeOverlay, setActiveOverlay] = useState(null); // 'summary' | 'flashcards' | 'projects'
  const [overlayTitle, setOverlayTitle] = useState('');
  const [overlayData, setOverlayData] = useState(null);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  
  // Flashcards state
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { user, setUser } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  const fetchRoadmaps = async () => {
    try {
      const res = await api.get('/roadmaps');
      setRoadmaps(res.data.data);
      if (res.data.data.length > 0) {
        const active = res.data.data.find(r => r.title.includes(user.profile.chosenCareerPath)) || res.data.data[0];
        setActiveRoadmap(active);
      }
    } catch (err) {
      console.error('Failed to fetch roadmaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, [user.profile.chosenCareerPath]);

  const handleCompleteNode = async (nodeId) => {
    if (!activeRoadmap) return;
    setCompletingNodeId(nodeId);
    try {
      const res = await api.put(`/roadmaps/${activeRoadmap._id}/node/${nodeId}`, { status: 'completed' });
      const { roadmap } = res.data.data;
      
      setActiveRoadmap(roadmap);
      setRoadmaps(roadmaps.map(r => r._id === roadmap._id ? roadmap : r));
      
      const updatedNode = roadmap.nodes.find(n => n.id === nodeId);
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(updatedNode);
      }

      showToast(`✅ Module marked completed! AI study tools unlocked.`, 'success');
      
      const userRes = await api.get('/users/me');
      setUser(userRes.data.data);
    } catch (err) {
      console.error('Failed to complete roadmap node:', err);
    } finally {
      setCompletingNodeId(null);
    }
  };

  // AI Unlocked Tools Calls
  const handleLoadSummary = async (topic) => {
    setActiveOverlay('summary');
    setOverlayTitle(`AI Summary & Study Sheet: ${topic}`);
    setLoadingOverlay(true);
    setOverlayData(null);
    try {
      const res = await api.post('/ai/notes/generate', { topic });
      setOverlayData(res.data.data.notes);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate AI notes summary', 'error');
      setActiveOverlay(null);
    } finally {
      setLoadingOverlay(false);
    }
  };

  const handleGenerateQuiz = async (topic) => {
    try {
      showToast('Generating AI practice quiz...', 'info');
      const res = await api.post('/quizzes/generate', {
        topic,
        questionCount: 5,
        difficulty: 'intermediate'
      });
      const quiz = res.data.data;
      showToast('Quiz generated successfully! Opening...', 'success');
      navigate(`/games/quiz/${quiz._id}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate AI quiz', 'error');
    }
  };

  const handleLoadFlashcards = async (topic) => {
    setActiveOverlay('flashcards');
    setOverlayTitle(`Spaced Repetition Flashcards: ${topic}`);
    setLoadingOverlay(true);
    setOverlayData([]);
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
    try {
      const res = await api.post('/ai/flashcards/generate', { topic, count: 5 });
      setOverlayData(res.data.data.flashcards);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate spaced-repetition flashcards', 'error');
      setActiveOverlay(null);
    } finally {
      setLoadingOverlay(false);
    }
  };

  const handleLoadProjectIdeas = async (topic) => {
    setActiveOverlay('projects');
    setOverlayTitle(`AI Mini-Project Guide: ${topic}`);
    setLoadingOverlay(true);
    setOverlayData(null);
    try {
      const res = await api.post('/ai/projects/generate', { topic });
      setOverlayData(res.data.data.projectIdeas);
    } catch (err) {
      console.error(err);
      showToast('Failed to generate mini-project ideas', 'error');
      setActiveOverlay(null);
    } finally {
      setLoadingOverlay(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 bg-brutal-cream">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="mb-4"
        >
          <Map className="w-10 h-10 text-black" />
        </motion.div>
        <span className="font-mono font-bold text-black text-sm uppercase tracking-wider">Building your roadmap...</span>
      </div>
    );
  }

  if (!activeRoadmap) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-brutal-cream flex items-center justify-center p-6">
        <Card bg="#FFFFFF" className="p-8 max-w-md text-center">
          <Compass className="w-16 h-16 mx-auto mb-4 text-black animate-pulse" />
          <h2 className="text-2xl font-black uppercase text-black mb-3">No Active Roadmap Found</h2>
          <p className="text-sm font-bold text-black/75 mb-6 leading-relaxed">
            Let's start your personalized learning journey! Complete the Career Discovery Assessment to discover your path.
          </p>
          <Button onClick={() => navigate('/career/assessment')} bg="#FFE600" className="w-full">
            Start Career Discovery
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const completedNodesCount = activeRoadmap.nodes.filter(n => n.status === 'completed').length;
  const totalNodes = activeRoadmap.nodes.length;
  const progressPercent = totalNodes > 0 
    ? Math.round((completedNodesCount / totalNodes) * 100) 
    : 0;
  const availableCount = activeRoadmap.nodes.filter(n => n.status === 'available').length;

  // Filter curated courses for active drawer node
  const matchedCategory = matchCategory(selectedNode?.label || '');
  const categoryCourses = matchedCategory 
    ? COURSES.filter(course => course.category === matchedCategory)
    : [];

  const primaryCourse = categoryCourses[0] || null;
  const alternativeCourses = categoryCourses.slice(1);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-brutal-cream py-10 px-4 relative text-black">
      <div className="max-w-4xl mx-auto">
        
        {/* ── Header Card ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card bg="#FFFFFF" className="p-6 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-brutal-pink text-black border-2 border-black px-2.5 py-0.5 text-xs font-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide">
                    Active Path
                  </span>
                  <span className="bg-brutal-yellow text-black border-2 border-black px-2.5 py-0.5 text-xs font-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide">
                    {completedNodesCount}/{totalNodes} Done
                  </span>
                  {progressPercent === 100 && (
                    <span className="bg-brutal-green text-black border-2 border-black px-2.5 py-0.5 text-xs font-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Completed!
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-black uppercase text-black mt-1">
                  {activeRoadmap.title}
                </h1>
                <p className="text-xs md:text-sm font-bold text-black/60 mt-1">
                  {activeRoadmap.description}
                </p>
              </div>
              
              {/* Stats + Progress */}
              <div className="w-full md:w-52 shrink-0 space-y-3">
                {/* Stat row */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-brutal-green/20 border-2 border-black rounded-xl p-2 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[9px] font-mono font-black text-black/50 uppercase">Done</p>
                    <p className="text-lg font-black text-black">{completedNodesCount}</p>
                  </div>
                  <div className="bg-brutal-yellow/40 border-2 border-black rounded-xl p-2 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[9px] font-mono font-black text-black/50 uppercase">Active</p>
                    <p className="text-lg font-black text-black">{availableCount}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-black text-black">PROGRESS</span>
                    <span className="text-xs font-mono font-black text-black">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-4 bg-white border-2 border-black rounded-md overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <motion.div 
                      className="h-full bg-brutal-green border-r-2 border-black"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Timeline Nodes ───────────────────────────────────────────── */}
        <div className="relative pl-10 md:pl-14">
          {/* Vertical rail */}
          <div className="absolute left-[20px] md:left-[26px] top-4 bottom-4 w-[3px] bg-black rounded-full" />

          <div className="space-y-6">
            {activeRoadmap.nodes.map((node, index) => {
              const status = node.status === 'completed' ? 'completed' : node.status === 'available' ? 'available' : 'locked';
              const cfg = nodeConfig[status];
              const { Icon } = cfg;
              const isLocked = status === 'locked';

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="relative flex items-start gap-5 md:gap-7 group"
                >
                  {/* Step indicator */}
                  <div className={`absolute -left-[7px] md:-left-[11px] w-9 h-9 rounded-full border-[3px] border-black flex items-center justify-center shrink-0 z-10 ${cfg.circleColor} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-black" />
                    ) : status === 'available' ? (
                      <span className="text-[11px] font-black">{index + 1}</span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-black/60" />
                    )}
                  </div>

                  {/* Node Card */}
                  <div className="flex-1 ml-2">
                    <div
                      onClick={() => !isLocked && setSelectedNode(node)}
                      className={`rounded-xl border-[3px] border-black p-4 md:p-5 transition-all flex items-center justify-between gap-4 select-none ${
                        isLocked
                          ? 'bg-black/5 opacity-55 cursor-not-allowed'
                          : `${cfg.cardBg} ${cfg.shadow} hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer`
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-[10px] font-mono font-black border-2 border-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase ${cfg.badgeBg}`}>
                            {cfg.badge}
                          </span>
                          <span className="text-[10px] font-mono font-black text-black/40 uppercase">
                            Step {index + 1}
                          </span>
                        </div>
                        <h3 className="text-base md:text-lg font-black uppercase text-black leading-tight truncate">
                          {node.label}
                        </h3>
                      </div>
                      
                      {!isLocked && (
                        <div className="w-8 h-8 rounded-lg bg-brutal-cream border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 group-hover:bg-brutal-yellow transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Slide Drawer Detail Overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedNode && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNode(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l-[3px] border-black z-50 overflow-y-auto flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b-2 border-black/15 bg-brutal-cream sticky top-0 z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="bg-brutal-yellow border-2 border-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-mono text-xs font-black">
                      MODULE STUDY GUIDE
                    </span>
                    <h2 className="text-xl md:text-2xl font-black uppercase text-black mt-2 leading-tight">
                      {selectedNode.label}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="w-8 h-8 rounded-lg border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 hover:bg-brutal-pink transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-6">

                {/* Primary Course */}
                <div>
                  <h3 className="text-xs font-black uppercase text-black/50 tracking-wider mb-2">Recommended Free Course</h3>
                  {primaryCourse ? (
                    <div className="p-4 rounded-xl border-[3px] border-black bg-brutal-cream shadow-brutal flex items-start gap-4">
                      <div className="w-24 shrink-0 aspect-video rounded-lg border-2 border-black bg-black overflow-hidden relative shadow-[2px_2px_0px_0px_#000]">
                        <img 
                          src={`https://img.youtube.com/vi/${primaryCourse.videoId}/mqdefault.jpg`} 
                          alt={primaryCourse.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="bg-[#FF0000] text-white border border-black px-1.5 py-0.2 text-[8px] font-black rounded uppercase font-mono shadow-[1px_1px_0px_0px_#000]">
                          YouTube
                        </span>
                        <h4 className="font-extrabold text-sm text-black leading-tight mt-1.5 line-clamp-2">
                          {primaryCourse.title}
                        </h4>
                        <span className="text-[10px] font-bold text-black/75 mt-1 block">
                          Instructor: <strong className="text-black">{primaryCourse.instructor}</strong>
                        </span>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="bg-white border border-black px-1.5 py-0.2 text-[9px] font-bold rounded font-mono">
                            {primaryCourse.duration}
                          </span>
                          <span className="bg-white border border-black px-1.5 py-0.2 text-[9px] font-bold rounded font-mono">
                            {primaryCourse.language}
                          </span>
                          <span className="bg-white border border-black px-1.5 py-0.2 text-[9px] font-bold rounded font-mono">
                            {primaryCourse.rating}★
                          </span>
                        </div>
                        
                        <a 
                          href={primaryCourse.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-brutal-yellow border-2 border-black px-3 py-1 text-[10px] font-black uppercase rounded shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all mt-4"
                        >
                          Start Learning <PlayCircle size={12} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border-[3px] border-black bg-brutal-cream shadow-brutal text-center">
                      <span className="text-xs font-bold text-black/60">No specific video course loaded. Use AI tools below.</span>
                    </div>
                  )}
                </div>

                {/* Alternative Courses */}
                {alternativeCourses.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black uppercase text-black/50 tracking-wider mb-2">Alternative Course Options</h3>
                    <div className="space-y-2">
                      {alternativeCourses.map(course => (
                        <div key={course.id} className="p-3 rounded-lg border-2 border-black bg-white flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000]">
                          <div className="min-w-0 flex-1">
                            <h5 className="font-extrabold text-xs text-black truncate uppercase">{course.title}</h5>
                            <p className="text-[10px] font-bold text-black/60 mt-0.5">Instructor: {course.instructor} • {course.duration}</p>
                          </div>
                          <a 
                            href={course.youtubeUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase rounded shadow-[1.5px_1.5px_0px_0px_#000] shrink-0"
                          >
                            Open
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── AI Tools Section ──────────────────────────────────── */}
                {selectedNode.status === 'completed' ? (
                  <div>
                    <div className="bg-brutal-green/15 border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_0px_#000] mb-4 flex items-center gap-2">
                      <Sparkles size={16} className="text-black shrink-0" />
                      <h4 className="text-xs font-black uppercase text-black">✓ Unlocked Post-Module AI Tools</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleLoadSummary(selectedNode.label)}
                        className="bg-[#E9D5FF] hover:bg-[#d6beed] border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                      >
                        <FileText size={18} />
                        <span className="text-xs font-black uppercase text-black block mt-2">AI Summary</span>
                        <span className="text-[9px] font-bold text-black/60 block mt-0.5">Custom study cheat sheet</span>
                      </button>

                      <button
                        onClick={() => handleGenerateQuiz(selectedNode.label)}
                        className="bg-[#FFE600] hover:bg-[#eed400] border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                      >
                        <QuizIcon size={18} />
                        <span className="text-xs font-black uppercase text-black block mt-2">AI Quiz</span>
                        <span className="text-[9px] font-bold text-black/60 block mt-0.5">5 Interactive practice Qs</span>
                      </button>

                      <button
                        onClick={() => handleLoadFlashcards(selectedNode.label)}
                        className="bg-[#FFAED7] hover:bg-[#fa93c6] border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                      >
                        <Brain size={18} />
                        <span className="text-xs font-black uppercase text-black block mt-2">AI Flashcards</span>
                        <span className="text-[9px] font-bold text-black/60 block mt-0.5">Spaced repetition review</span>
                      </button>

                      <button
                        onClick={() => handleLoadProjectIdeas(selectedNode.label)}
                        className="bg-[#4ADE80] hover:bg-[#3bc471] border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                      >
                        <LayoutGrid size={18} />
                        <span className="text-xs font-black uppercase text-black block mt-2">Mini Projects</span>
                        <span className="text-[9px] font-bold text-black/60 block mt-0.5">3 Beginner project guides</span>
                      </button>
                    </div>

                    {/* Bug Hunt Challenge - new game */}
                    <button
                      onClick={() => navigate('/games/bug-hunt')}
                      className="w-full bg-brutal-pink/20 hover:bg-brutal-pink/40 border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] mt-3 flex items-center justify-between text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-black shrink-0" />
                        <div>
                          <span className="text-xs font-black uppercase text-black block">🐛 Bug Hunt Challenge</span>
                          <span className="text-[9px] font-bold text-black/60 block">Find & fix bugs in real code snippets</span>
                        </div>
                      </div>
                      <ChevronRight size={14} />
                    </button>

                    {/* AI Tutor link */}
                    <button
                      onClick={() => navigate('/ai-tutor')}
                      className="w-full bg-white hover:bg-brutal-cream/50 border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] mt-2 flex items-center justify-between text-left transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-2">
                        <Zap size={14} />
                        <div>
                          <span className="text-xs font-black uppercase text-black block">Ask AI Tutor</span>
                          <span className="text-[9px] font-bold text-black/60 block">Get instant doubt resolution</span>
                        </div>
                      </div>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="bg-brutal-pink/15 border-2 border-black p-3.5 rounded-xl shadow-[2px_2px_0px_0px_#000] flex items-center gap-2.5">
                    <Lock size={14} className="shrink-0" />
                    <span className="text-xs font-black uppercase text-black">Complete module to unlock AI summary, quiz, flashcards & projects</span>
                  </div>
                )}

              </div>

              {/* Drawer Footer - Mark Completed */}
              <div className="p-6 border-t-2 border-black/15 bg-brutal-cream sticky bottom-0">
                {selectedNode.status === 'completed' ? (
                  <div className="flex items-center gap-2 justify-center font-bold text-sm bg-brutal-green/20 border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-black uppercase">
                    <CheckCircle className="w-5 h-5 text-green-700" /> Module Completed Successfully
                  </div>
                ) : (
                  <Button
                    onClick={() => handleCompleteNode(selectedNode.id)}
                    disabled={completingNodeId === selectedNode.id}
                    bg="#4ADE80"
                    className="w-full justify-center flex items-center gap-2 py-3"
                  >
                    {completingNodeId === selectedNode.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Completing...
                      </>
                    ) : (
                      <>
                        Mark Module Completed <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── AI Tools Overlay / Modal Dialog ─────────────────────────────── */}
      <AnimatePresence>
        {activeOverlay && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveOverlay(null)}
              className="absolute inset-0 bg-black"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white border-[3px] border-black rounded-2xl shadow-brutal p-6 overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-black/15 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-black" />
                  <h3 className="text-base font-black uppercase text-black leading-tight pr-4">{overlayTitle}</h3>
                </div>
                <button
                  onClick={() => setActiveOverlay(null)}
                  className="w-8 h-8 rounded-lg border-2 border-black bg-brutal-cream flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#000] shrink-0 hover:bg-brutal-pink transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto pr-1">
                {loadingOverlay ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-black" />
                    <span className="text-xs font-black uppercase text-black/60">AI is compiling resources...</span>
                  </div>
                ) : activeOverlay === 'flashcards' && Array.isArray(overlayData) && overlayData.length > 0 ? (
                  // Flashcard widget
                  <div className="py-6 flex flex-col items-center">
                    <div className="mb-4 text-xs font-mono font-black opacity-60">
                      CARD {currentFlashcardIndex + 1} OF {overlayData.length}
                    </div>

                    {/* Flippable card */}
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full max-w-sm aspect-[3/2] cursor-pointer"
                    >
                      <motion.div
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="w-full h-full relative"
                      >
                        {/* Front Side */}
                        <div 
                          style={{ backfaceVisibility: 'hidden' }}
                          className={`absolute inset-0 border-[3px] border-black rounded-2xl p-6 flex flex-col justify-between shadow-brutal ${
                            isFlipped ? 'opacity-0 pointer-events-none' : 'bg-brutal-yellow'
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase opacity-60 font-mono">QUESTION</span>
                          <h4 className="text-base md:text-lg font-black uppercase text-center my-auto">
                            {overlayData[currentFlashcardIndex]?.front}
                          </h4>
                          <span className="text-[9px] font-black uppercase text-center opacity-60 font-mono">Click card to reveal answer</span>
                        </div>

                        {/* Back Side */}
                        <div 
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          className={`absolute inset-0 border-[3px] border-black rounded-2xl p-6 flex flex-col justify-between shadow-brutal ${
                            isFlipped ? 'bg-brutal-green' : 'opacity-0 pointer-events-none'
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase opacity-60 font-mono">ANSWER</span>
                          <h4 className="text-sm md:text-base font-extrabold text-center my-auto leading-relaxed">
                            {overlayData[currentFlashcardIndex]?.back}
                          </h4>
                          {overlayData[currentFlashcardIndex]?.hint && (
                            <p className="text-[10px] font-bold text-center text-black/70 italic">
                              💡 Hint: {overlayData[currentFlashcardIndex]?.hint}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-4 mt-8 shrink-0">
                      <Button
                        disabled={currentFlashcardIndex === 0}
                        onClick={() => {
                          setCurrentFlashcardIndex(currentFlashcardIndex - 1);
                          setIsFlipped(false);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <Button
                        disabled={currentFlashcardIndex === overlayData.length - 1}
                        onClick={() => {
                          setCurrentFlashcardIndex(currentFlashcardIndex + 1);
                          setIsFlipped(false);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Next Card
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Markdown Note or Project summary
                  <div className="prose prose-sm max-w-none text-black p-2">
                    {overlayData ? (
                      <div className="whitespace-pre-wrap font-semibold leading-relaxed text-sm">
                        {overlayData}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-black/60 block text-center py-8">Failed to generate content. Please try again.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t-2 border-black/15 mt-4 flex justify-end shrink-0">
                <Button onClick={() => setActiveOverlay(null)} size="sm">
                  Close Guide
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
