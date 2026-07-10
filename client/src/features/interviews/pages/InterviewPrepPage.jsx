import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Compass, Play, ArrowRight, Clock, Sparkles, Bot, User, 
  Trophy, ChevronRight, Search, FileText, CheckCircle, Trash2, HelpCircle, 
  Send, Brain, ExternalLink, Upload, AlertCircle, RefreshCw
} from 'lucide-react';
import api from '../../../config/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import SkeletonLoader from '../../../components/ui/SkeletonLoader';
import { useToastStore } from '../../../store/toastStore';

export default function InterviewPrepPage() {
  const [activeTab, setActiveTab] = useState('mock-interviews'); // 'mock-interviews' | 'resume-coach' | 'questions'
  const showToast = useToastStore((state) => state.showToast);

  // Mock Interviews state
  const [interviews, setInterviews] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [activeChat, setActiveChat] = useState([]);
  const [candidateResponse, setCandidateResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Setup state
  const [role, setRole] = useState('Software Engineer');
  const [interviewType, setInterviewType] = useState('technical');
  const [company, setCompany] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('fresher');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [aiProvider, setAiProvider] = useState('gemini');
  const [launching, setLaunching] = useState(false);

  // Resume Coach state
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeFile, setSelectedResumeFile] = useState(null);
  const [targetJobDescription, setTargetJobDescription] = useState('');
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [selectedResumeAnalysis, setSelectedResumeAnalysis] = useState(null);
  const [analyzingResumeId, setAnalyzingResumeId] = useState(null);

  // Question Bank state
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  // AI Questions generation state
  const [genRole, setGenRole] = useState('Software Engineer');
  const [genType, setGenType] = useState('technical');
  const [genCompany, setGenCompany] = useState('');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const chatEndRef = useRef(null);

  // Fetch interviews history
  const fetchInterviews = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/interviews');
      setInterviews(res.data.data.interviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch resumes list
  const fetchResumes = async () => {
    try {
      setLoadingResumes(true);
      const res = await api.get('/interviews/resume');
      setResumes(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResumes(false);
    }
  };

  // Fetch public questions
  const fetchQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedCategory) params.category = selectedCategory;

      const res = await api.get('/interviews/questions', { params });
      setQuestions(res.data.data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mock-interviews') {
      fetchInterviews();
    } else if (activeTab === 'resume-coach') {
      fetchResumes();
    } else if (activeTab === 'questions') {
      fetchQuestions();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'questions') {
      const delayDebounceFn = setTimeout(() => {
        fetchQuestions();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, selectedDifficulty, selectedCategory]);

  useEffect(() => {
    if (activeSession) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat, activeSession]);

  // Start new mock interview
  const handleStartInterview = async (e) => {
    e.preventDefault();
    setLaunching(true);
    try {
      const res = await api.post('/interviews/start', {
        format: 'text',
        role,
        interviewType,
        company,
        yearsOfExperience,
        totalQuestions: Number(totalQuestions),
        aiProvider
      });
      const data = res.data.data;
      setActiveSession({
        _id: data.interview._id,
        role: data.interview.role,
        interviewType: data.interview.interviewType,
        totalQuestions: data.interview.totalQuestions,
        currentQuestionIndex: 0,
      });
      setActiveChat([
        { role: 'interviewer', content: data.firstMessage, timestamp: new Date() }
      ]);
      showToast('Interview session started successfully!', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setLaunching(false);
    }
  };

  // Submit candidate answer
  const handleSubmitAnswer = async () => {
    if (!candidateResponse.trim()) return;
    const responseText = candidateResponse;
    setCandidateResponse('');
    setSubmittingResponse(true);

    // Add candidate response locally
    setActiveChat(prev => [...prev, { role: 'candidate', content: responseText, timestamp: new Date() }]);

    try {
      const res = await api.post(`/interviews/${activeSession._id}/respond`, {
        message: responseText
      });
      const data = res.data.data;

      // Add interviewer next question or closing statement
      setActiveChat(prev => [...prev, { role: 'interviewer', content: data.aiMessage, timestamp: new Date() }]);
      
      setActiveSession(prev => ({
        ...prev,
        currentQuestionIndex: data.currentQuestionIndex
      }));

      if (data.isCompleted) {
        showToast('Mock interview completed! Generating feedback...', 'info');
        handleGetFeedback(activeSession._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Retrieve feedback of a completed interview
  const handleGetFeedback = async (id) => {
    setLoadingFeedback(true);
    setSelectedFeedback(null);
    try {
      const res = await api.post(`/interviews/${id}/feedback`);
      setSelectedFeedback(res.data.data);
      setActiveSession(null);
      fetchInterviews();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // View past feedback details
  const handleViewPastFeedback = async (id) => {
    setLoadingFeedback(true);
    setSelectedFeedback(null);
    try {
      const res = await api.get(`/interviews/${id}`);
      const data = res.data.data;
      if (data.status !== 'completed') {
        showToast('This interview is still in progress.', 'warning');
        return;
      }
      setSelectedFeedback(data.aiFeedback || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Resume Upload
  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!selectedResumeFile) {
      showToast('Please select a PDF file first', 'error');
      return;
    }
    setUploadingResume(true);
    const formData = new FormData();
    formData.append('resume', selectedResumeFile);

    try {
      const uploadRes = await api.post('/interviews/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const resumeData = uploadRes.data.data;
      showToast('Resume uploaded. Running ATS analysis...', 'info');

      const analyzeRes = await api.post(`/interviews/resume/${resumeData.resumeId}/analyze`, {
        jobDescription: targetJobDescription,
        jobTitle: targetJobTitle,
        aiProvider: 'gemini'
      });

      setSelectedResumeAnalysis(analyzeRes.data.data);
      setSelectedResumeFile(null);
      setTargetJobDescription('');
      setTargetJobTitle('');
      fetchResumes();
      showToast('ATS Analysis completed!', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingResume(false);
    }
  };

  // Run analysis on existing resume
  const handleAnalyzeExistingResume = async (resumeId) => {
    setAnalyzingResumeId(resumeId);
    try {
      const analyzeRes = await api.post(`/interviews/resume/${resumeId}/analyze`, {
        aiProvider: 'gemini'
      });
      setSelectedResumeAnalysis(analyzeRes.data.data);
      fetchResumes();
      showToast('ATS Analysis completed!', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingResumeId(null);
    }
  };

  // Generate public questions by AI
  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    try {
      await api.post('/interviews/questions/generate', {
        role: genRole,
        interviewType: genType,
        company: genCompany,
        count: 5,
        saveToBank: true
      });
      showToast('AI Questions generated & saved to bank!', 'success');
      setGenRole('Software Engineer');
      setGenCompany('');
      fetchQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-black pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-[3px] border-black bg-white p-6 md:p-8 rounded-2xl shadow-brutal">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-brutal-purple border-2 border-black px-3.5 py-1 text-xs font-black uppercase rounded-lg shadow-[2.5px_2.5px_0px_0px_#000] mb-4">
            <Briefcase size={14} /> AI Career Readiness Guide
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wide leading-none">
            Interview Preparation
          </h1>
          <p className="text-sm md:text-base font-bold text-black/75 mt-3 max-w-2xl">
            Prepare yourself for technical interviews. Run mock sessions, analyze your resume ATS scoring, and practice with recommended questions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-[3px] border-black rounded-xl overflow-hidden bg-white shadow-brutal select-none">
        {['mock-interviews', 'resume-coach', 'questions'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedFeedback(null);
              setSelectedResumeAnalysis(null);
              setActiveSession(null);
            }}
            className={`flex-1 py-4 font-black uppercase text-xs sm:text-sm tracking-wider border-r-[3px] last:border-r-0 border-black transition-all ${
              activeTab === tab ? 'bg-brutal-yellow' : 'bg-white hover:bg-brutal-cream'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'mock-interviews' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {activeSession ? (
              /* ACTIVE INTERVIEW SESSION CHAT PANEL */
              <div className="border-[3px] border-black bg-white rounded-2xl shadow-brutal overflow-hidden flex flex-col min-h-[600px]">
                {/* Chat Header */}
                <div className="p-4 border-b-[3px] border-black bg-brutal-cream flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center">
                      <Bot className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase text-black">
                        AI Mock Interviewer
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-black/55 uppercase">
                        Role: {activeSession.role} ({activeSession.interviewType})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-black">
                      Progress: {activeSession.currentQuestionIndex} / {activeSession.totalQuestions}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-white border-b-2 border-black relative">
                  <div 
                    className="h-full bg-brutal-green transition-all duration-300"
                    style={{ width: `${(activeSession.currentQuestionIndex / activeSession.totalQuestions) * 100}%` }}
                  />
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px]">
                  {activeChat.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${m.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_#000] ${
                        m.role === 'candidate' ? 'bg-brutal-green' : 'bg-brutal-purple'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1 opacity-70">
                          {m.role === 'candidate' ? <User size={12} /> : <Bot size={12} />}
                          <span className="text-[9px] font-mono font-black uppercase">
                            {m.role === 'candidate' ? 'You' : 'Interviewer'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold whitespace-pre-wrap leading-relaxed">
                          {m.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {submittingResponse && (
                    <div className="flex justify-start">
                      <div className="border-2 border-black p-3.5 bg-brutal-cream rounded-xl shadow-[2px_2px_0px_0px_#000] flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        <span className="text-xs font-black uppercase text-black/60">Interviewer is evaluating response...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t-[3px] border-black bg-brutal-cream/20 flex gap-3 items-end">
                  <textarea
                    rows={3}
                    placeholder="Type your detailed interview answer here... (be thorough to score higher)"
                    value={candidateResponse}
                    onChange={(e) => setCandidateResponse(e.target.value)}
                    disabled={submittingResponse}
                    className="flex-1 bg-white border-[3px] border-black rounded-xl p-3 text-sm text-black font-semibold placeholder:text-gray-500/70 focus:outline-none focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all resize-none"
                  />
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={submittingResponse || !candidateResponse.trim()}
                    bg="#4ADE80"
                    className="py-3 px-5 shadow-[3px_3px_0px_0px_#000]"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            ) : selectedFeedback ? (
              /* DETAILED FEEDBACK PANEL */
              <div className="space-y-6">
                <Button 
                  onClick={() => setSelectedFeedback(null)} 
                  variant="secondary"
                  size="sm"
                  className="mb-2"
                >
                  ← Back to setup & history
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Scores dashboard */}
                  <Card className="md:col-span-1 border-[3px] border-black bg-white p-6 shadow-brutal flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-mono font-black uppercase text-black/55">OVERALL RATING</span>
                    <div className="w-32 h-32 rounded-full border-[5px] border-black bg-brutal-yellow flex items-center justify-center font-black text-4xl shadow-brutal my-4">
                      {selectedFeedback.overallScore}%
                    </div>
                    <p className="text-xs font-bold text-black/70 leading-relaxed max-w-xs mt-2">
                      Great effort! Use the scores below to target areas of weakness.
                    </p>
                  </Card>

                  {/* Core Skills Scores */}
                  <Card className="md:col-span-2 border-[3px] border-black bg-white p-6 shadow-brutal space-y-4 justify-between flex flex-col">
                    <h3 className="text-lg font-black uppercase">Core Performance Indicators</h3>
                    
                    <div className="space-y-3.5">
                      {[
                        { label: 'Technical Depth', val: selectedFeedback.technicalScore, color: 'bg-brutal-blue' },
                        { label: 'Communication Skill', val: selectedFeedback.communicationScore, color: 'bg-brutal-pink' },
                        { label: 'Confidence & Delivery', val: selectedFeedback.confidenceScore, color: 'bg-brutal-purple' },
                        { label: 'Response Structure', val: selectedFeedback.structureScore, color: 'bg-brutal-green' },
                      ].map((bar) => (
                        <div key={bar.label}>
                          <div className="flex justify-between items-center text-xs font-mono font-black mb-1">
                            <span>{bar.label.toUpperCase()}</span>
                            <span>{bar.val}%</span>
                          </div>
                          <div className="w-full h-4 bg-brutal-cream border-2 border-black rounded shadow-[1.5px_1.5px_0px_0px_#000] overflow-hidden">
                            <div className={`h-full border-r-2 border-black ${bar.color}`} style={{ width: `${bar.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Detailed Analysis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <Card bg="#E2FBE9" className="border-[3px] border-black p-6 shadow-brutal space-y-3">
                    <h4 className="font-black uppercase text-sm flex items-center gap-1.5 text-green-900">
                      🏆 Key Strengths
                    </h4>
                    <ul className="space-y-2.5 text-xs font-bold text-green-950 leading-relaxed">
                      {selectedFeedback.strengthPoints?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-700 font-mono">✦</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  {/* Improvements */}
                  <Card bg="#FFF0F5" className="border-[3px] border-black p-6 shadow-brutal space-y-3">
                    <h4 className="font-black uppercase text-sm flex items-center gap-1.5 text-red-900">
                      💡 Areas of Improvement
                    </h4>
                    <ul className="space-y-2.5 text-xs font-bold text-red-950 leading-relaxed">
                      {selectedFeedback.improvementPoints?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-600 font-mono">✦</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* Suggestions & resources */}
                {selectedFeedback.suggestedResources?.length > 0 && (
                  <Card className="border-[3px] border-black bg-white p-6 shadow-brutal space-y-3">
                    <h4 className="font-black uppercase text-sm flex items-center gap-2">
                      <Brain size={16} /> Recommended Learning Materials & Guides
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedFeedback.suggestedResources.map((res, i) => (
                        <span key={i} className="bg-brutal-cream border-2 border-black px-3.5 py-1 text-xs font-bold rounded-lg shadow-[2px_2px_0px_0px_#000] flex items-center gap-1">
                          💡 {res}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Question-wise Breakdown */}
                {selectedFeedback.questionWiseFeedback?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase mt-4">Question-by-Question Evaluation</h3>
                    <div className="space-y-4">
                      {selectedFeedback.questionWiseFeedback.map((q, idx) => (
                        <Card key={idx} className="border-[3px] border-black bg-white p-6 shadow-brutal space-y-4">
                          <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
                            <span className="text-xs font-mono font-black uppercase">QUESTION {idx + 1}</span>
                            <Badge variant={q.score >= 70 ? 'success' : q.score >= 50 ? 'warning' : 'danger'}>
                              Score: {q.score}%
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-xs font-black uppercase text-black/50 tracking-wider">Question Asked:</h5>
                              <p className="text-sm font-black mt-1 leading-snug">{q.question || `Question #${idx + 1}`}</p>
                            </div>
                            
                            <div>
                              <h5 className="text-xs font-black uppercase text-black/50 tracking-wider">Your Response:</h5>
                              <p className="text-xs font-bold italic text-black/85 mt-1 leading-relaxed bg-brutal-cream/15 p-2 rounded border border-black/10">
                                {q.feedback || 'Answer evaluated.'}
                              </p>
                            </div>

                            {q.idealAnswer && (
                              <div>
                                <h5 className="text-xs font-black uppercase text-green-700/75 tracking-wider">💡 Ideal Structure / Reference answer:</h5>
                                <p className="text-xs font-bold text-green-950 mt-1 leading-relaxed bg-green-50/50 p-2.5 rounded border border-green-200">
                                  {q.idealAnswer}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SETUP MOCK SESSION + HISTORY SPLIT */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Launcher Form */}
                <div className="lg:col-span-1">
                  <Card className="border-[3px] border-black bg-white p-6 shadow-brutal space-y-5">
                    <div className="flex items-center gap-2 border-b-2 border-black/15 pb-3">
                      <Play className="w-5 h-5 text-black" />
                      <h3 className="font-black text-lg uppercase">Start Mock Session</h3>
                    </div>

                    <form onSubmit={handleStartInterview} className="space-y-4">
                      {/* Job Role select */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider">Target Job Role</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full bg-white border-[3px] border-black rounded-xl px-4 py-3 text-sm text-black font-semibold shadow-[2px_2px_0px_0px_#000000] outline-none transition-all cursor-pointer"
                        >
                          <option value="Software Engineer">Software Engineer</option>
                          <option value="Frontend Engineer">Frontend Engineer</option>
                          <option value="Backend Engineer">Backend Engineer</option>
                          <option value="Data Scientist">Data Scientist</option>
                          <option value="QA Engineer">QA Engineer</option>
                          <option value="Product Manager">Product Manager</option>
                        </select>
                      </div>

                      {/* Interview Type select */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider">Interview Type</label>
                        <select
                          value={interviewType}
                          onChange={(e) => setInterviewType(e.target.value)}
                          className="w-full bg-white border-[3px] border-black rounded-xl px-4 py-3 text-sm text-black font-semibold shadow-[2px_2px_0px_0px_#000000] outline-none transition-all cursor-pointer"
                        >
                          <option value="technical">Technical Core</option>
                          <option value="behavioral">Behavioral (STAR)</option>
                          <option value="mixed">Mixed Assessment</option>
                          <option value="coding">Coding & DS Alg</option>
                        </select>
                      </div>

                      {/* Target Company input */}
                      <Input
                        label="Target Company (optional)"
                        placeholder="e.g. Google, Amazon, Startup"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />

                      {/* Experience select */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider">Experience Level</label>
                        <select
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(e.target.value)}
                          className="w-full bg-white border-[3px] border-black rounded-xl px-4 py-3 text-sm text-black font-semibold shadow-[2px_2px_0px_0px_#000000] outline-none transition-all cursor-pointer"
                        >
                          <option value="fresher">Fresher / Graduate</option>
                          <option value="1-2">Junior (1-2 years)</option>
                          <option value="3-5">Mid-level (3-5 years)</option>
                          <option value="5-10">Senior (5-10 years)</option>
                        </select>
                      </div>

                      {/* AI Provider select */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider">AI Coach Model</label>
                        <select
                          value={aiProvider}
                          onChange={(e) => setAiProvider(e.target.value)}
                          className="w-full bg-white border-[3px] border-black rounded-xl px-4 py-3 text-sm text-black font-semibold shadow-[2px_2px_0px_0px_#000000] outline-none transition-all cursor-pointer"
                        >
                          <option value="gemini">Gemini 1.5 Flash (Recommended)</option>
                          <option value="groq">Llama 3.1 70B (Fast)</option>
                        </select>
                      </div>

                      {/* Question count */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider">Question Count ({totalQuestions})</label>
                        <input
                          type="range"
                          min="3"
                          max="10"
                          value={totalQuestions}
                          onChange={(e) => setTotalQuestions(e.target.value)}
                          className="w-full h-2 bg-brutal-cream border-2 border-black rounded-lg appearance-none cursor-pointer accent-black"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={launching}
                        bg="#FFE600"
                        className="w-full justify-center py-3.5 flex items-center gap-2 mt-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      >
                        {launching ? (
                          <>
                            <RefreshCw className="w-4.5 h-4.5 animate-spin" /> Starting...
                          </>
                        ) : (
                          <>
                            Launch Interview Session <ArrowRight size={15} />
                          </>
                        )}
                      </Button>
                    </form>
                  </Card>
                </div>

                {/* Past History List */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xl font-black uppercase text-black font-mono">Past Interview Sessions</h3>

                  {loadingHistory ? (
                    <SkeletonLoader className="h-20" count={3} />
                  ) : interviews.length === 0 ? (
                    <EmptyState 
                      icon={Briefcase} 
                      title="No interviews completed yet" 
                      description="Use the launcher on the left to start practicing with the AI interviewer." 
                    />
                  ) : (
                    <div className="space-y-3">
                      {interviews.map((session) => (
                        <Card key={session._id} bg="#FFFFFF" className="p-4 border-3 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-black text-white px-2 py-0.5 text-[9px] font-mono font-black rounded uppercase">
                                {session.interviewType}
                              </span>
                              <span className="bg-brutal-cream border border-black px-1.5 py-0.2 text-[9px] font-bold rounded">
                                {session.format}
                              </span>
                              {session.status === 'completed' ? (
                                <Badge variant="success">Completed</Badge>
                              ) : (
                                <Badge variant="warning">In Progress</Badge>
                              )}
                            </div>
                            <h4 className="font-extrabold text-sm text-black leading-tight mt-2 uppercase">
                              {session.role}
                            </h4>
                            {session.company && (
                              <p className="text-[10px] font-bold text-black/55 uppercase mt-0.5">
                                Target Company: {session.company}
                              </p>
                            )}
                            <p className="text-[10px] font-mono text-black/45 mt-1">
                              Session Date: {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {session.status === 'completed' && session.aiFeedback?.overallScore ? (
                              <div className="text-center sm:text-right">
                                <span className="text-[9px] font-mono font-black block opacity-50">SCORE</span>
                                <span className="text-sm font-black block text-green-700">{session.aiFeedback.overallScore}%</span>
                              </div>
                            ) : null}

                            {session.status === 'completed' ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewPastFeedback(session._id)}
                                disabled={loadingFeedback}
                              >
                                View Feedback
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                bg="#FFE600"
                                onClick={() => {
                                  setActiveSession(session);
                                  // Fetch session messages
                                  api.get(`/interviews/${session._id}`).then(res => {
                                    setActiveChat(res.data.data.messages || []);
                                  });
                                }}
                              >
                                Resume
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'resume-coach' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {selectedResumeAnalysis ? (
              /* DETAILED RESUME ATS ANALYSIS PANEL */
              <div className="space-y-6">
                <Button 
                  onClick={() => setSelectedResumeAnalysis(null)} 
                  variant="secondary"
                  size="sm"
                  className="mb-2"
                >
                  ← Back to Upload
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ATS score gauge */}
                  <Card className="md:col-span-1 border-[3px] border-black bg-white p-6 shadow-brutal flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-mono font-black uppercase text-black/55">ATS MATCH SCORE</span>
                    <div className="w-32 h-32 rounded-full border-[5px] border-black bg-brutal-pink flex items-center justify-center font-black text-4xl shadow-brutal my-4">
                      {selectedResumeAnalysis.atsScore}%
                    </div>
                    <span className="bg-white border border-black px-2 py-0.5 text-[9px] font-mono font-black rounded uppercase">
                      Job Fit: {selectedResumeAnalysis.jobMatchScore}%
                    </span>
                  </Card>

                  {/* Keywords analysis */}
                  <Card className="md:col-span-2 border-[3px] border-black bg-white p-6 shadow-brutal space-y-4">
                    <h3 className="text-lg font-black uppercase">Job Keywords Analysis</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-black uppercase text-green-700 flex items-center gap-1.5 mb-1.5">
                          ✓ Matched Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedResumeAnalysis.keywordMatch?.matched?.map((tag, i) => (
                            <span key={i} className="bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              {tag}
                            </span>
                          )) ?? <span className="text-xs font-bold text-black/40">No keywords match detected.</span>}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-black/10">
                        <h4 className="text-xs font-black uppercase text-red-700 flex items-center gap-1.5 mb-1.5">
                          ✗ Missing Critical Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedResumeAnalysis.keywordMatch?.missing?.map((tag, i) => (
                            <span key={i} className="bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              {tag}
                            </span>
                          )) ?? <span className="text-xs font-bold text-black/40">No missing keywords detected.</span>}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Section Feedback */}
                {selectedResumeAnalysis.sectionFeedback && (
                  <Card className="border-[3px] border-black bg-white p-6 shadow-brutal space-y-4">
                    <h3 className="text-lg font-black uppercase">Detailed Section Review</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(selectedResumeAnalysis.sectionFeedback).map(([section, text]) => (
                        <div key={section} className="border-2 border-black p-3.5 rounded-lg bg-brutal-cream/25">
                          <span className="text-[10px] font-mono font-black uppercase text-black/55">{section}</span>
                          <p className="text-xs font-semibold text-black/85 leading-relaxed mt-1">{text}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Suggested Prep questions */}
                {selectedResumeAnalysis.suggestedQuestions?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase mt-4">Suggested Preparation Questions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedResumeAnalysis.suggestedQuestions.map((q, idx) => (
                        <Card key={idx} className="border-[3px] border-black bg-white p-5 shadow-brutal flex items-start gap-3">
                          <div className="w-6 h-6 rounded-md bg-brutal-yellow border-2 border-black flex items-center justify-center font-black text-xs shrink-0">
                            ?
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-extrabold text-black leading-snug">{q}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* UPLOAD SCREEN + PAST RESUMES LIST */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Upload Form */}
                <div className="lg:col-span-1">
                  <Card className="border-[3px] border-black bg-white p-6 shadow-brutal space-y-4">
                    <div className="flex items-center gap-2 border-b-2 border-black/15 pb-3">
                      <Upload className="w-5 h-5 text-black" />
                      <h3 className="font-black text-lg uppercase">Resume Upload</h3>
                    </div>

                    <form onSubmit={handleResumeUpload} className="space-y-4">
                      {/* PDF input */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider">Select Resume (PDF)</label>
                        <div className="border-[3px] border-dashed border-black/40 rounded-xl p-6 text-center cursor-pointer hover:bg-brutal-cream/20 transition-all relative">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setSelectedResumeFile(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <Upload className="w-8 h-8 mx-auto mb-2 text-black/50" />
                          <span className="text-xs font-black uppercase block text-black/60">
                            {selectedResumeFile ? selectedResumeFile.name : 'Upload PDF File'}
                          </span>
                        </div>
                      </div>

                      {/* Job Title */}
                      <Input
                        label="Target Job Title (optional)"
                        placeholder="e.g. Frontend React Developer"
                        value={targetJobTitle}
                        onChange={(e) => setTargetJobTitle(e.target.value)}
                      />

                      {/* Target Job Description text area */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider">Target Job Description (optional)</label>
                        <textarea
                          rows={4}
                          placeholder="Paste the target job description to match keywords and get ATS compatibility scoring..."
                          value={targetJobDescription}
                          onChange={(e) => setTargetJobDescription(e.target.value)}
                          className="w-full bg-white border-[3px] border-black rounded-xl p-3 text-sm text-black font-semibold placeholder:text-gray-500/70 focus:outline-none focus:translate-x-[-1px] focus:translate-y-[-1px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={uploadingResume}
                        bg="#FFAED7"
                        className="w-full justify-center py-3.5 flex items-center gap-2 mt-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      >
                        {uploadingResume ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Uploading & Analyzing...
                          </>
                        ) : (
                          <>
                            Analyze with Resume Coach <Sparkles size={14} />
                          </>
                        )}
                      </Button>
                    </form>
                  </Card>
                </div>

                {/* Resumes List */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xl font-black uppercase text-black font-mono">Uploaded Resumes</h3>

                  {loadingResumes ? (
                    <SkeletonLoader className="h-20" count={3} />
                  ) : resumes.length === 0 ? (
                    <EmptyState 
                      icon={FileText} 
                      title="No resumes uploaded yet" 
                      description="Use the launcher on the left to upload your CV/Resume PDF and get AI compatibility coaching." 
                    />
                  ) : (
                    <div className="space-y-3">
                      {resumes.map((res) => (
                        <Card key={res._id} bg="#FFFFFF" className="p-4 border-3 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-extrabold text-sm text-black leading-tight uppercase">
                              {res.fileName}
                            </h4>
                            <p className="text-[10px] font-mono text-black/55 uppercase mt-1">
                              File Size: {(res.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded: {new Date(res.createdAt).toLocaleDateString()}
                            </p>
                            {res.isAnalyzed && res.jobTitle && (
                              <p className="text-[10px] font-bold text-black/50 uppercase mt-0.5">
                                Analyzed For: {res.jobTitle}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {res.isAnalyzed ? (
                              <div className="text-center sm:text-right">
                                <span className="text-[9px] font-mono font-black block opacity-50 font-mono">ATS SCORE</span>
                                <span className="text-sm font-black block text-green-700">{res.atsScore}%</span>
                              </div>
                            ) : null}

                            {res.isAnalyzed ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setSelectedResumeAnalysis(res)}
                              >
                                View Analysis
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                bg="#FFE600"
                                onClick={() => handleAnalyzeExistingResume(res._id)}
                                disabled={analyzingResumeId === res._id}
                              >
                                {analyzingResumeId === res._id ? 'Analyzing...' : 'Run Coach Analysis'}
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'questions' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* AI Generator Panel */}
            <Card className="border-[3px] border-black bg-white p-5 shadow-brutal space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black/15 pb-2.5">
                <Sparkles className="w-5 h-5 text-black" />
                <h3 className="font-black text-base uppercase">AI Question Generator</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
                <Input
                  label="Role (e.g. React Developer)"
                  placeholder="e.g. SDE Frontend"
                  value={genRole}
                  onChange={(e) => setGenRole(e.target.value)}
                />
                <div className="space-y-1.5 text-black">
                  <label className="block text-sm font-black uppercase tracking-wider">Type</label>
                  <select
                    value={genType}
                    onChange={(e) => setGenType(e.target.value)}
                    className="w-full bg-white border-[3px] border-black rounded-xl px-4 py-3 text-sm text-black font-semibold shadow-[2px_2px_0px_0px_#000000] outline-none transition-all cursor-pointer"
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="coding">Coding / Algorithm</option>
                    <option value="mixed">Mixed Assessment</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label="Company (optional)"
                      placeholder="e.g. Meta"
                      value={genCompany}
                      onChange={(e) => setGenCompany(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={generatingQuestions || !genRole}
                    bg="#4ADE80"
                    className="py-3 shadow-[2px_2px_0px_0px_#000] h-[45px] self-end justify-center w-36"
                  >
                    {generatingQuestions ? 'Generating...' : 'Generate Qs'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Questions list with filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    icon={Search}
                    placeholder="Search interview question bank by text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-white border-[3px] border-black rounded-xl px-4 py-3 text-sm text-black font-semibold shadow-[2px_2px_0px_0px_#000000] outline-none transition-all cursor-pointer"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {loadingQuestions ? (
                <SkeletonLoader className="h-20" count={4} />
              ) : questions.length === 0 ? (
                <EmptyState 
                  icon={HelpCircle} 
                  title="No questions in bank" 
                  description="Use the AI Question Generator above to seed the question bank with custom topics." 
                />
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <Card
                      key={q._id}
                      hover
                      className="border-3 border-black bg-white p-5 cursor-pointer"
                      onClick={() => setExpandedQuestionId(expandedQuestionId === q._id ? null : q._id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="bg-black text-white px-2 py-0.5 text-[9px] font-mono font-black rounded uppercase">
                              {q.category}
                            </span>
                            <span className="bg-brutal-cream border border-black px-1.5 py-0.2 text-[9px] font-bold rounded">
                              {q.difficulty}
                            </span>
                            {q.role && (
                              <span className="bg-brutal-purple/35 border border-black/10 px-1.5 py-0.2 text-[9px] font-bold rounded uppercase">
                                {q.role}
                              </span>
                            )}
                            {q.company && (
                              <span className="bg-brutal-yellow/35 border border-black/10 px-1.5 py-0.2 text-[9px] font-bold rounded uppercase">
                                {q.company}
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-sm text-black mt-2 leading-snug">
                            {q.question}
                          </h4>
                        </div>
                        <ChevronRight 
                          size={16} 
                          className={`shrink-0 transition-transform ${expandedQuestionId === q._id ? 'rotate-90' : ''}`} 
                        />
                      </div>

                      <AnimatePresence>
                        {expandedQuestionId === q._id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3.5 pt-3.5 border-t border-black/10 space-y-3 text-xs"
                          >
                            {q.sampleAnswer && (
                              <div>
                                <h5 className="font-black uppercase text-green-700 tracking-wider">💡 Ideal Answer Structure:</h5>
                                <p className="font-bold text-green-950 mt-1 leading-relaxed bg-green-50/50 p-2.5 rounded border border-green-200">
                                  {q.sampleAnswer}
                                </p>
                              </div>
                            )}

                            {q.tips && (
                              <div>
                                <h5 className="font-black uppercase text-black/50 tracking-wider">💡 Study Tips & Notes:</h5>
                                <p className="font-bold text-black/75 mt-1 leading-relaxed bg-brutal-cream/20 p-2.5 rounded border border-black/10">
                                  {q.tips}
                                </p>
                              </div>
                            )}

                            {q.followUpQuestions?.length > 0 && (
                              <div>
                                <h5 className="font-black uppercase text-black/55 tracking-wider">💡 Potential Follow-up Questions:</h5>
                                <ul className="list-disc pl-4 mt-1 space-y-1 font-semibold text-black/80">
                                  {q.followUpQuestions.map((fol, i) => (
                                    <li key={i}>{fol}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
