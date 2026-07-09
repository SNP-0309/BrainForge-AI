import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../config/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';
import { 
  Award, BookOpen, CheckCircle, ChevronRight, Compass, HelpCircle, Lock, 
  PlayCircle, ExternalLink, RefreshCw, X, Sparkles, Star, Globe, 
  Brain, FileText, LayoutGrid, Zap, HelpCircle as QuizIcon
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
        // Pick active roadmap matching user chosen career path, else first one
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
      const { roadmap, xpAwarded } = res.data.data;
      
      // Update local state
      setActiveRoadmap(roadmap);
      setRoadmaps(roadmaps.map(r => r._id === roadmap._id ? roadmap : r));
      
      // Find updated node
      const updatedNode = roadmap.nodes.find(n => n.id === nodeId);
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(updatedNode);
      }

      showToast(`Module completed! Unlocked 5 post-module AI tools. Received +${xpAwarded} XP!`, 'success');
      
      // Sync user profile state (XP / Coins)
      const userRes = await api.get('/users/me');
      setUser(userRes.data.data);
      
      // Check off the task in today's daily mission
      try {
        const todayMission = userRes.data.data.profile.dailyMission;
        if (todayMission && todayMission.tasks) {
          const task = todayMission.tasks.find(t => t.label.includes(selectedNode?.label || updatedNode?.label));
          if (task && !task.completed) {
            await api.put(`/missions/task/${task.id}/complete`);
          }
        }
      } catch (e) {
        console.warn('Failed to sync daily mission task status:', e);
      }

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
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono font-bold text-black">Loading Roadmaps...</span>
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

  // Calculate completion percentage
  const completedNodesCount = activeRoadmap.nodes.filter(n => n.status === 'completed').length;
  const progressPercent = activeRoadmap.nodes.length > 0 
    ? Math.round((completedNodesCount / activeRoadmap.nodes.length) * 100) 
    : 0;

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
        
        {/* Roadmap Title Card */}
        <Card bg="#FFFFFF" className="p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="bg-brutal-pink text-black border-2 border-black px-2.5 py-0.5 text-xs font-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide">
              Active Path
            </span>
            <h1 className="text-2xl md:text-3xl font-black uppercase text-black mt-2">
              {activeRoadmap.title}
            </h1>
            <p className="text-xs md:text-sm font-bold text-black/60 mt-1">
              {activeRoadmap.description}
            </p>
          </div>
          
          <div className="w-full md:w-44 shrink-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-mono font-black text-black">PROGRESS</span>
              <span className="text-xs font-mono font-black text-black">{progressPercent}%</span>
            </div>
            <div className="w-full h-5 bg-white border-2 border-black rounded-md overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div 
                className="h-full bg-brutal-green border-r-2 border-black transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Timeline Path Nodes */}
        <div className="relative py-4 pl-8 md:pl-12">
          {/* Vertical rail */}
          <div className="absolute left-12 md:left-16 top-0 bottom-0 w-1 bg-black border-r-2 border-black" />

          <div className="space-y-12">
            {activeRoadmap.nodes.map((node) => {
              const isCompleted = node.status === 'completed';
              const isAvailable = node.status === 'available';
              const isLocked = node.status === 'locked';

              // Map style keys
              let circleColor = 'bg-white';
              let badgeText = 'LOCKED';
              let Icon = Lock;

              if (isCompleted) {
                circleColor = 'bg-brutal-green';
                badgeText = 'COMPLETED';
                Icon = CheckCircle;
              } else if (isAvailable) {
                circleColor = 'bg-brutal-yellow';
                badgeText = 'IN PROGRESS';
                Icon = PlayCircle;
              }

              return (
                <div key={node.id} className="relative flex items-center gap-6 md:gap-8 group">
                  {/* Timeline bullet indicator */}
                  <div className={`absolute left-0 w-8 h-8 rounded-full border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 z-10 ${circleColor}`}>
                    <Icon className="w-4 h-4 text-black" />
                  </div>

                  {/* Node content card */}
                  <div className="flex-1 ml-6">
                    <div 
                      onClick={() => !isLocked && setSelectedNode(node)}
                      className={`rounded-xl border-[3px] border-black p-5 transition-all flex items-center justify-between gap-4 select-none ${
                        isLocked ? 'bg-black/5 opacity-60 cursor-not-allowed' : 'bg-white shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer'
                      }`}
                    >
                      <div>
                        <span className={`text-[10px] font-mono font-black border-2 border-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase ${
                          isCompleted ? 'bg-brutal-green' : isAvailable ? 'bg-brutal-yellow' : 'bg-white/20'
                        }`}>
                          {badgeText}
                        </span>
                        <h3 className="text-base md:text-lg font-black uppercase text-black mt-2.5">
                          {node.label}
                        </h3>
                      </div>
                      
                      {!isLocked && (
                        <div className="w-8 h-8 rounded-lg bg-brutal-cream border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Slide Drawer Detail Overlay */}
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l-[3px] border-black z-50 p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-black/15 mb-6">
                  <div>
                    <span className="bg-brutal-yellow border-2 border-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-mono text-xs font-black">
                      MODULE STUDY GUIDE
                    </span>
                    <h2 className="text-xl md:text-2xl font-black uppercase text-black mt-2">
                      {selectedNode.label}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="w-8 h-8 rounded-lg border-2 border-black bg-brutal-cream flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Recommendations info card */}
                <div className="space-y-6">
                  
                  {/* Primary playlist resource */}
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
                        <div className="flex-1">
                          <span className="bg-[#FF0000] text-white border border-black px-1.5 py-0.2 text-[8px] font-black rounded uppercase font-mono shadow-[1px_1px_0px_0px_#000]">
                            YouTube
                          </span>
                          <h4 className="font-extrabold text-sm text-black leading-tight mt-1.5">
                            {primaryCourse.title}
                          </h4>
                          <span className="text-[10px] font-bold text-black/75 mt-1 block">
                            Instructor: <strong className="text-black">{primaryCourse.instructor}</strong>
                          </span>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-3.5">
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
                        <span className="text-xs font-bold text-black/60">No specific video course loaded. Use general study guides below.</span>
                      </div>
                    )}
                  </div>

                  {/* Alternative playlist options */}
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
                              className="bg-white border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase rounded shadow-[1.5px_1.5px_0px_0px_#000]"
                            >
                              Open
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unlocked Post-Module AI tools - visible ONLY if completed */}
                  {selectedNode.status === 'completed' ? (
                    <div>
                      <div className="bg-brutal-green/10 border-2 border-black p-3.5 rounded-xl shadow-[3px_3px_0px_0px_#000] mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-black" />
                        <h4 className="text-xs font-black uppercase text-black">✓ Unlocked Post-Module AI Tools</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleLoadSummary(selectedNode.label)}
                          className="bg-[#E9D5FF] hover:bg-[#d6beed] border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] text-left transition-all"
                        >
                          <FileText size={18} />
                          <span className="text-xs font-black uppercase text-black block mt-2">AI Summary</span>
                          <span className="text-[9px] font-bold text-black/60 block mt-0.5">Custom study cheat sheet</span>
                        </button>

                        <button
                          onClick={() => handleGenerateQuiz(selectedNode.label)}
                          className="bg-[#FFE600] hover:bg-[#eed400] border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] text-left transition-all"
                        >
                          <QuizIcon size={18} />
                          <span className="text-xs font-black uppercase text-black block mt-2">AI Quiz</span>
                          <span className="text-[9px] font-bold text-black/60 block mt-0.5">5 Interactive practice Qs</span>
                        </button>

                        <button
                          onClick={() => handleLoadFlashcards(selectedNode.label)}
                          className="bg-[#FFAED7] hover:bg-[#fa93c6] border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] text-left transition-all"
                        >
                          <Brain size={18} />
                          <span className="text-xs font-black uppercase text-black block mt-2">AI Flashcards</span>
                          <span className="text-[9px] font-bold text-black/60 block mt-0.5">Spaced repetition review</span>
                        </button>

                        <button
                          onClick={() => handleLoadProjectIdeas(selectedNode.label)}
                          className="bg-[#4ADE80] hover:bg-[#3bc471] border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] text-left transition-all"
                        >
                          <LayoutGrid size={18} />
                          <span className="text-xs font-black uppercase text-black block mt-2">Mini Projects</span>
                          <span className="text-[9px] font-bold text-black/60 block mt-0.5">3 Beginner project guides</span>
                        </button>
                      </div>

                      {/* Interactive coding challenge trigger link */}
                      <button
                        onClick={() => navigate('/ai-tutor')}
                        className="w-full bg-white hover:bg-brutal-cream/50 border-2 border-black p-3 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] mt-3 flex items-center justify-between text-left transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Zap size={14} />
                          <div>
                            <span className="text-xs font-black uppercase text-black block">Solve Coding Challenge</span>
                            <span className="text-[9px] font-bold text-black/60 block">Practice doubt solving in AI Tutor console</span>
                          </div>
                        </div>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-brutal-pink/15 border-2 border-black p-3.5 rounded-xl shadow-[2px_2px_0px_0px_#000] flex items-center gap-2.5">
                      <Lock size={14} />
                      <span className="text-xs font-black uppercase text-black">Complete module to unlock summary, quiz, flashcards & projects</span>
                    </div>
                  )}

                </div>
              </div>

              {/* Mark Completed Actions */}
              <div className="pt-6 border-t-2 border-black/15 mt-6">
                {selectedNode.status === 'completed' ? (
                  <div className="flex items-center gap-2 text-brutal-green justify-center font-bold text-sm bg-brutal-green/10 border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-black uppercase">
                    <CheckCircle className="w-5 h-5 text-green-700" /> Completed Module (+20 XP, +2 Coins Awarded)
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
                        Mark Module Completed (+20 XP) <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Tools Overlay / Modal Dialog */}
      <AnimatePresence>
        {activeOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-2xl bg-white border-[3px] border-black rounded-2xl shadow-brutal p-6 overflow-hidden max-h-[85vh] flex flex-col justify-between"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-black/15 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-black" />
                  <h3 className="text-lg font-black uppercase text-black">{overlayTitle}</h3>
                </div>
                <button
                  onClick={() => setActiveOverlay(null)}
                  className="w-8 h-8 rounded-lg border-2 border-black bg-brutal-cream flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#000]"
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
                    <TouchableOpacity
                      onPress={() => setIsFlipped(!isFlipped)}
                      activeOpacity={0.9}
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
                    </TouchableOpacity>

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
