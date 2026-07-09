import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Award, AlertTriangle, ArrowRight, RefreshCw, BookOpen, Clock } from 'lucide-react';
import api from '../../../config/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useToastStore } from '../../../store/toastStore';
import { useAuthStore } from '../../../store/authStore';

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const { setUser } = useAuthStore();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionIndex: selectedIndex }
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null); // Result data from backend after submission

  const fetchQuiz = async () => {
    try {
      const res = await api.get(`/quizzes/${id}`);
      setQuiz(res.data.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load quiz details.', 'error');
      navigate('/games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const handleSelectOption = (optionIndex) => {
    if (results) return; // Prevent changing after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIdx]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Format answers for backend: Array of { questionIndex, selectedIndex }
    const answersPayload = Object.entries(selectedAnswers).map(([qIdx, selIdx]) => ({
      questionIndex: Number(qIdx),
      selectedIndex: selIdx
    }));

    // Check if user answered all questions
    if (answersPayload.length < quiz.questions.length) {
      const confirmSubmit = window.confirm('You have not answered all questions. Submit anyway?');
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/quizzes/${id}/submit`, {
        answers: answersPayload
      });
      setResults(res.data.data);
      showToast('Quiz submitted successfully!', 'success');

      // Sync user profile state (XP / Coins)
      const userRes = await api.get('/users/me');
      setUser(userRes.data.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to submit quiz.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono font-bold text-black">Loading Quiz Arena...</span>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-brutal-cream">
        <Card bg="#FFFFFF" className="p-8 text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h2 className="text-xl font-black uppercase text-black">Quiz Not Found</h2>
          <Button onClick={() => navigate('/games')} bg="#FFE600" className="w-full mt-5">
            Back to Games Hub
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const isLastQuestion = currentIdx === quiz.questions.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-brutal-cream py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {!results ? (
            /* ACTIVE QUIZ SESSION INTERFACE */
            <motion.div
              key="quiz-session"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Top Progress bar & stats */}
              <Card bg="#FFFFFF" className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono font-black text-black">
                      QUESTION {currentIdx + 1} OF {quiz.questions.length}
                    </span>
                    <span className="text-[10px] font-mono font-black text-black">
                      {answeredCount} / {quiz.questions.length} ANSWERED
                    </span>
                  </div>
                  <div className="w-full h-3 bg-brutal-cream border-2 border-black rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brutal-yellow transition-all duration-300"
                      style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 font-mono text-xs font-black bg-brutal-purple border-2 border-black px-2.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Clock className="w-3.5 h-3.5" /> QUIZ
                </div>
              </Card>

              {/* Main Question Card */}
              <Card bg="#FFFFFF" className="p-6 md:p-8 min-h-[300px] flex flex-col justify-between">
                <div>
                  <span className="bg-brutal-pink border-2 border-black text-[9px] font-mono font-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase">
                    {quiz.difficulty} difficulty
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-black mt-4 leading-snug">
                    {currentQuestion.questionText}
                  </h2>
                </div>

                {/* Options List */}
                <div className="space-y-3.5 mt-8">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedAnswers[currentIdx] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left p-4 rounded-xl border-[3px] border-black transition-all flex items-center justify-between gap-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] ${
                          isSelected
                            ? 'bg-brutal-yellow text-black font-extrabold -translate-x-0.5 -translate-y-0.5'
                            : 'bg-white hover:bg-brutal-cream text-black font-semibold'
                        }`}
                      >
                        <span className="text-sm md:text-base">{option}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-brutal-yellow border border-black shrink-0">
                            <Check className="w-3 h-3 stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center gap-4">
                <Button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  variant="secondary"
                  className="px-6"
                >
                  Previous
                </Button>

                {isLastQuestion ? (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    bg="#4ADE80"
                    className="px-8 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        Finish & Submit <Award className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="px-6 flex items-center gap-1.5"
                  >
                    Next Question <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            /* DETAILED RESULTS SCREEN INTERFACE */
            <motion.div
              key="quiz-results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="space-y-8"
            >
              {/* Score & Rewards Summary Card */}
              <Card bg={results.passed ? '#E9D5FF' : '#FFAED7'} className="p-8 text-black border-3 border-black text-center relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-white border-2 border-black font-mono text-[10px] font-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase">
                  {results.passed ? 'PASSED' : 'FAILED'}
                </div>
                
                <h1 className="text-3xl font-black uppercase tracking-wider">
                  {results.passed ? '🎉 Excellent Job! ' : '💡 Keep Learning!'}
                </h1>
                <p className="text-sm font-bold text-black/75 mt-1.5">
                  You completed {quiz.title}
                </p>

                {/* Score percentage circle or big numbers */}
                <div className="my-6 inline-flex flex-col items-center justify-center bg-white border-4 border-black w-32 h-32 rounded-full shadow-brutal mx-auto">
                  <span className="text-3xl font-black text-black leading-tight">
                    {Math.round(results.percentage)}%
                  </span>
                  <span className="text-[10px] font-mono font-black text-black/60">
                    {results.score} / {results.maxScore} PTS
                  </span>
                </div>

                {/* Gamification rewards */}
                <div className="flex justify-center mt-2">
                   <div className="bg-white border-2 border-black px-6 py-2 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center min-w-[120px]">
                     <p className="text-[9px] font-mono font-black text-black/50">COINS EARNED</p>
                     <p className="text-lg font-black text-black">+{results.rewards?.coinsAwarded || 0}</p>
                   </div>
                 </div>

                {/* Newly unlocked achievements */}
                {results.newlyUnlockedAchievements && results.newlyUnlockedAchievements.length > 0 && (
                  <div className="mt-6 bg-white border-2 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3">
                    <span className="text-lg">🏆</span>
                    <div className="text-left">
                      <p className="text-[10px] font-mono font-black text-black/50">NEW ACHIEVEMENT UNLOCKED!</p>
                      <p className="text-xs font-black uppercase text-black">
                        {results.newlyUnlockedAchievements.map(a => a.name).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => navigate('/games')}
                  variant="secondary"
                  className="flex-1 py-3.5"
                >
                  Back to Games Hub
                </Button>
                <Button
                  onClick={() => {
                    setResults(null);
                    setSelectedAnswers({});
                    setCurrentIdx(0);
                    fetchQuiz();
                  }}
                  bg="#FFE600"
                  className="flex-1 py-3.5 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </Button>
              </div>

              {/* Question Breakdown and Explanations */}
              <div className="space-y-4">
                <h3 className="text-lg font-black uppercase tracking-wider text-black">
                  Question Review & Analogy Analysis
                </h3>

                {results.results.map((item, idx) => (
                  <Card 
                    key={idx} 
                    bg="#FFFFFF" 
                    className={`p-5 space-y-4 border-2 border-black relative ${
                      item.isCorrect ? 'bg-green-50/5' : 'bg-red-50/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-[10px] font-mono font-black text-black/45">QUESTION {idx + 1}</span>
                        <h4 className="font-extrabold text-sm md:text-base text-black mt-1 leading-snug">
                          {item.questionText}
                        </h4>
                      </div>
                      <div className="shrink-0 mt-1">
                        {item.isCorrect ? (
                          <div className="w-6 h-6 rounded-full bg-brutal-green border-2 border-black flex items-center justify-center text-black">
                            <Check className="w-4 h-4 stroke-[3px]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-brutal-pink border-2 border-black flex items-center justify-center text-black">
                            <X className="w-4 h-4 stroke-[3px]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Options status */}
                    <div className="text-xs space-y-2 font-bold">
                      <div className="flex gap-2">
                        <span className="text-black/60 shrink-0 min-w-[110px]">Your Answer:</span>
                        <span className={item.isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {item.userAnswerIndex !== null ? quiz.questions[idx].options[item.userAnswerIndex] : 'Unanswered'}
                        </span>
                      </div>
                      {!item.isCorrect && (
                        <div className="flex gap-2">
                          <span className="text-black/60 shrink-0 min-w-[110px]">Correct Answer:</span>
                          <span className="text-green-700">
                            {quiz.questions[idx].options[item.correctAnswerIndex]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Explanation / Analogy block */}
                    {item.explanation && (
                      <div className="bg-brutal-cream/50 border-2 border-black p-3.5 rounded-lg text-xs leading-relaxed text-black/85 font-semibold">
                        <strong className="text-black block mb-1 uppercase text-[10px] tracking-wide font-black">Explanation:</strong>
                        {item.explanation}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
