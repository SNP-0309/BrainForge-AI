import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../config/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';
import { Award, Briefcase, Calendar, ChevronDown, ChevronUp, Compass, Cpu, DollarSign, ListFilter, Sparkles, TrendingUp } from 'lucide-react';

const standardCareers = [
  'AI Engineering',
  'Full Stack Development',
  'Data Science',
  'Cybersecurity',
  'Mobile App Development',
];

export default function CareerRecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingPath, setSubmittingPath] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [customPath, setCustomPath] = useState('');
  const [showManualSelection, setShowManualSelection] = useState(false);
  
  const { user, setUser } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/users/me');
      const refreshedUser = res.data.data;
      setUser(refreshedUser);
      
      if (!refreshedUser.profile.assessmentCompleted || !refreshedUser.profile.assessmentRecommendations?.length) {
        showToast('Please complete the career assessment first', 'info');
        navigate('/career/assessment');
        return;
      }
      setRecommendations(refreshedUser.profile.assessmentRecommendations);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleSelectPath = async (pathTitle) => {
    setSubmittingPath(true);
    try {
      const res = await api.post('/career/select', { careerPath: pathTitle });
      showToast(`Selected Path: ${pathTitle}! Generated Roadmap successfully.`, 'success');
      
      // Update global auth store state
      const userRes = await api.get('/users/me');
      setUser(userRes.data.data);
      
      navigate('/roadmaps');
    } catch (err) {
      console.error('Failed to select career path:', err);
    } finally {
      setSubmittingPath(false);
    }
  };

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-cream flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-black text-black uppercase tracking-wider">AI is analyzing your profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-brutal-cream py-12 px-4">
      <div className="w-full max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brutal-yellow border-[3px] border-black shadow-brutal px-4 py-2 rounded-xl mb-4">
            <Sparkles className="w-5 h-5 text-black" />
            <span className="font-black uppercase tracking-wide text-sm text-black">AI Recommendations</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-black mt-2">
            Your Career Matches
          </h1>
          <p className="text-base md:text-lg font-bold text-black/70 mt-2 max-w-2xl mx-auto">
            Based on your interests, personality, and background, our AI model recommends the following learning paths.
          </p>
        </div>

        {/* Recommendations list */}
        <div className="space-y-6 mb-12">
          {recommendations.map((rec, idx) => {
            const isExpanded = expandedIndex === idx;
            // High contrast brutal color tags
            const cardBgColors = ['#4ADE80', '#E9D5FF', '#FFAED7'];
            const headerColor = cardBgColors[idx % cardBgColors.length];

            return (
              <Card key={rec.title} bg="#FFFFFF" className="overflow-hidden">
                {/* Header Bar */}
                <div 
                  onClick={() => toggleExpand(idx)}
                  style={{ backgroundColor: headerColor }}
                  className="p-5 border-b-[3px] border-black flex flex-wrap items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border-[3px] border-black shadow-brutal flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black uppercase text-black">
                        {rec.title}
                      </h2>
                      <span className="text-xs font-mono font-black text-black/75 uppercase tracking-wide">
                        MATCH: {rec.matchPercentage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1 rounded-md text-xs font-black text-black font-mono">
                      MATCH {rec.matchPercentage}%
                    </div>
                    {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                  </div>
                </div>

                {/* Body Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden transition-all"
                    >
                      <div className="p-6 md:p-8 border-t-0 border-black space-y-6">
                        {/* Why it fits */}
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                            <Compass className="w-4 h-4" /> Why it fits you
                          </h3>
                          <p className="text-sm md:text-base font-semibold text-black/85 leading-relaxed bg-brutal-cream p-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            {rec.whyItFits}
                          </p>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl">
                            <span className="text-xs font-black text-black/50 uppercase tracking-wider block">Duration</span>
                            <span className="text-sm font-black text-black flex items-center gap-1 mt-1">
                              <Calendar className="w-4 h-4 text-black" /> {rec.averageDuration}
                            </span>
                          </div>

                          <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl">
                            <span className="text-xs font-black text-black/50 uppercase tracking-wider block">Difficulty</span>
                            <span className="text-sm font-black text-black flex items-center gap-1 mt-1">
                              <Award className="w-4 h-4 text-black" /> {rec.difficulty}
                            </span>
                          </div>

                          <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl">
                            <span className="text-xs font-black text-black/50 uppercase tracking-wider block">Salary Average</span>
                            <span className="text-sm font-black text-black flex items-center gap-1 mt-1">
                              <DollarSign className="w-4 h-4 text-black" /> {rec.salaryPotential}
                            </span>
                          </div>

                          <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 rounded-xl">
                            <span className="text-xs font-black text-black/50 uppercase tracking-wider block">Job Market</span>
                            <span className="text-sm font-black text-black flex items-center gap-1 mt-1">
                              <TrendingUp className="w-4 h-4 text-black" /> High Demand
                            </span>
                          </div>
                        </div>

                        {/* Skills and roles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-black uppercase text-black mb-2 tracking-wider">Required Skills:</h4>
                            <div className="flex flex-wrap gap-2">
                              {rec.requiredSkills?.map(skill => (
                                <span key={skill} className="bg-brutal-yellow text-black border-2 border-black px-2.5 py-1 text-xs font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-black uppercase text-black mb-2 tracking-wider">Career Opportunities:</h4>
                            <div className="flex flex-wrap gap-2">
                              {rec.opportunities?.map(roleName => (
                                <span key={roleName} className="bg-white text-black border-2 border-black px-2.5 py-1 text-xs font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  {roleName}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-4 border-t-2 border-black flex flex-wrap gap-4 items-center justify-between">
                          <span className="text-xs font-bold text-black/60 font-mono">
                            Press Accept to generate your interactive learning roadmap
                          </span>
                          <Button
                            onClick={() => handleSelectPath(rec.title)}
                            disabled={submittingPath}
                            bg={headerColor}
                            className="w-full sm:w-auto"
                          >
                            {submittingPath ? 'Generating...' : `Accept & Start Roadmap`}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>

        {/* Manual selection section */}
        <div className="text-center pt-4 border-t-2 border-black/15">
          {!showManualSelection ? (
            <p className="text-sm font-bold text-black/75">
              Not satisfied with AI recommendations?{' '}
              <span 
                onClick={() => setShowManualSelection(true)}
                className="underline font-black cursor-pointer text-black hover:text-black/70"
              >
                Skip and Select a Learning Path Manually
              </span>
            </p>
          ) : (
            <Card bg="#FFFFFF" className="p-6 max-w-xl mx-auto text-left">
              <h3 className="text-lg font-black uppercase text-black mb-2">Select Career Path Manually</h3>
              <p className="text-xs font-bold text-black/60 mb-4">Choose from our standard lists or enter any custom skill set you want.</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {standardCareers.map(path => (
                  <span 
                    key={path}
                    onClick={() => setCustomPath(path)}
                    className={`cursor-pointer border-2 border-black px-3 py-1.5 text-xs font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-brutal-yellow transition-all ${
                      customPath === path ? 'bg-brutal-yellow' : 'bg-white'
                    }`}
                  >
                    {path}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="E.g. Rust Systems Programming"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  className="flex-1 border-[3px] border-black bg-white px-3 py-2 text-sm font-bold text-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                />
                <Button 
                  onClick={() => handleSelectPath(customPath)}
                  disabled={!customPath || submittingPath}
                  bg="#FFE600"
                >
                  Generate Path
                </Button>
              </div>

              <button 
                onClick={() => setShowManualSelection(false)}
                className="text-xs font-bold underline text-black/70 mt-4 block"
              >
                Back to AI recommendations
              </button>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
