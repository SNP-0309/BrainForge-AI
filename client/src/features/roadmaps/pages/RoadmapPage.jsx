import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../config/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';
import { Award, BookOpen, CheckCircle, ChevronRight, Compass, HelpCircle, Lock, PlayCircle, ExternalLink, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Static mapper for realistic visual course recommendations
const getRecommendationsForNode = (label) => {
  const cleanLabel = label.toLowerCase();
  
  if (cleanLabel.includes('python')) {
    return {
      playlist: 'Python Programming for Beginners',
      creator: 'freeCodeCamp.org',
      duration: '6 hours',
      rating: '4.8★',
      language: 'English',
      docLink: 'https://docs.python.org/3/',
      readingLink: 'https://realpython.com/',
    };
  }
  if (cleanLabel.includes('javascript') || cleanLabel.includes('js')) {
    return {
      playlist: 'JavaScript Masterclass',
      creator: 'Hitesh Choudhary',
      duration: '8 hours',
      rating: '4.9★',
      language: 'Hindi/English',
      docLink: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      readingLink: 'https://javascript.info/',
    };
  }
  if (cleanLabel.includes('git') || cleanLabel.includes('github')) {
    return {
      playlist: 'Git & GitHub Complete Tutorial',
      creator: 'Kunal Kushwaha',
      duration: '4 hours',
      rating: '4.9★',
      language: 'English',
      docLink: 'https://git-scm.com/doc',
      readingLink: 'https://github.com/features',
    };
  }
  if (cleanLabel.includes('data structure') || cleanLabel.includes('dsa') || cleanLabel.includes('algorithm')) {
    return {
      playlist: 'DSA Starter Course & Practice',
      creator: 'Apna College',
      duration: '22 hours',
      rating: '4.8★',
      language: 'Hindi/English',
      docLink: 'https://www.geeksforgeeks.org/data-structures/',
      readingLink: 'https://visualgo.net/',
    };
  }
  if (cleanLabel.includes('machine learning') || cleanLabel.includes('ml')) {
    return {
      playlist: 'Machine Learning for Everyone',
      creator: 'freeCodeCamp.org',
      duration: '10 hours',
      rating: '4.7★',
      language: 'English',
      docLink: 'https://scikit-learn.org/',
      readingLink: 'https://www.coursera.org/learn/machine-learning',
    };
  }
  // General fallback
  return {
    playlist: `Mastering ${label} Complete Series`,
    creator: 'Sheriyans Coding School',
    duration: '5 hours',
    rating: '4.8★',
    language: 'Hindi/English',
    docLink: 'https://developer.mozilla.org/en-US/',
    readingLink: 'https://medium.com/',
  };
};

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [completingNodeId, setCompletingNodeId] = useState(null);
  
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
      
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(roadmap.nodes.find(n => n.id === nodeId));
      }

      showToast(`Node completed! Received +${xpAwarded} XP!`, 'success');
      
      // Sync user profile state (XP / Coins)
      const userRes = await api.get('/users/me');
      setUser(userRes.data.data);
      
      // Check off the task in today's daily mission
      try {
        const todayMission = userRes.data.data.profile.dailyMission;
        if (todayMission && todayMission.tasks) {
          const task = todayMission.tasks.find(t => t.label.includes(selectedNode?.label));
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

  return (
    <div className="min-h-[calc(100vh-80px)] bg-brutal-cream py-10 px-4 relative">
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
            {activeRoadmap.nodes.map((node, index) => {
              const isCompleted = node.status === 'completed';
              const isAvailable = node.status === 'available';
              const isLocked = node.status === 'locked';

              // Map style keys
              let circleColor = 'bg-white';
              let cardBg = '#FFFFFF';
              let badgeText = 'LOCKED';
              let Icon = Lock;

              if (isCompleted) {
                circleColor = 'bg-brutal-green';
                cardBg = '#E9D5FF';
                badgeText = 'COMPLETED';
                Icon = CheckCircle;
              } else if (isAvailable) {
                circleColor = 'bg-brutal-yellow';
                cardBg = '#FFFFFF';
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l-[3px] border-black z-50 p-6 overflow-y-auto flex flex-col justify-between"
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
                  
                  {/* Playlist resource */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-black/50 tracking-wider mb-2">Recommended Video Playlist</h3>
                    <div className="p-4 rounded-xl border-[3px] border-black bg-brutal-cream shadow-brutal flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brutal-pink border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
                        <PlayCircle className="w-5 h-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-extrabold text-sm text-black leading-tight">
                          {getRecommendationsForNode(selectedNode.label).playlist}
                        </h4>
                        <span className="text-xs font-bold text-black/70 mt-1 block">
                          Creator: <strong className="text-black">{getRecommendationsForNode(selectedNode.label).creator}</strong>
                        </span>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <span className="bg-white border border-black px-2 py-0.5 text-[10px] font-bold text-black rounded font-mono">
                            Duration: {getRecommendationsForNode(selectedNode.label).duration}
                          </span>
                          <span className="bg-white border border-black px-2 py-0.5 text-[10px] font-bold text-black rounded font-mono">
                            {getRecommendationsForNode(selectedNode.label).rating}
                          </span>
                          <span className="bg-white border border-black px-2 py-0.5 text-[10px] font-bold text-black rounded font-mono">
                            {getRecommendationsForNode(selectedNode.label).language}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Study materials */}
                  <div className="grid grid-cols-2 gap-4">
                    <a 
                      href={getRecommendationsForNode(selectedNode.label).docLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl border-[3px] border-black bg-white hover:bg-brutal-cream shadow-brutal flex flex-col justify-between h-28 group"
                    >
                      <BookOpen className="w-5 h-5 text-black" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-black">Official Docs</span>
                        <ExternalLink className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>

                    <a 
                      href={getRecommendationsForNode(selectedNode.label).readingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl border-[3px] border-black bg-white hover:bg-brutal-cream shadow-brutal flex flex-col justify-between h-28 group"
                    >
                      <Compass className="w-5 h-5 text-black" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-black">Study Guides</span>
                        <ExternalLink className="w-3.5 h-3.5 text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  </div>

                  {/* AI Generated Quizzes & Games */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-black/50 tracking-wider mb-2">Practice & Evaluate</h3>
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={() => navigate('/games')} 
                        variant="secondary" 
                        className="w-full text-center"
                      >
                        Launch Interactive Games Hub
                      </Button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Mark Completed Actions */}
              <div className="pt-6 border-t-2 border-black/15">
                {selectedNode.status === 'completed' ? (
                  <div className="flex items-center gap-2 text-brutal-green justify-center font-bold text-sm bg-brutal-green/10 border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black">
                    <CheckCircle className="w-5 h-5 text-green-700" /> Completed Module (+20 XP, +2 Coins Awarded)
                  </div>
                ) : (
                  <Button
                    onClick={() => handleCompleteNode(selectedNode.id)}
                    disabled={completingNodeId === selectedNode.id}
                    bg="#4ADE80"
                    className="w-full justify-center flex items-center gap-2"
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
    </div>
  );
}
