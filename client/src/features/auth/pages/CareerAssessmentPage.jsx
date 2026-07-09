import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../../config/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { ArrowLeft, ArrowRight, Brain, Sparkles } from 'lucide-react';
import { useToastStore } from '../../../store/toastStore';

const questions = [
  {
    key: 'interests',
    question: 'What are your core technical interests?',
    options: [
      { value: 'ai_ml', label: 'AI & Machine Learning', desc: 'Neural networks, LLMs, and computer vision' },
      { value: 'web_dev', label: 'Web & Apps Development', desc: 'Building beautiful websites, APIs, and client platforms' },
      { value: 'data_science', label: 'Data & Analytics', desc: 'Big data pipeline, statistics, and business insight reports' },
      { value: 'security', label: 'Systems & Cybersecurity', desc: 'Network defense, systems programming, and cryptography' },
    ],
  },
  {
    key: 'personality',
    question: 'Describe your favorite working style:',
    options: [
      { value: 'analytical', label: 'Logical & Analytical', desc: 'I love breaking down complex equations and writing pure logic' },
      { value: 'creative', label: 'Creative & Visual', desc: 'I love designing layouts, interactive flows, and graphics' },
      { value: 'user_centric', label: 'User & Product Focused', desc: 'I want to build apps that solve real user pains directly' },
      { value: 'defensive', label: 'Detail & Rules Oriented', desc: 'I love auditing security, optimization, and bug hunting' },
    ],
  },
  {
    key: 'problem_solving',
    question: 'What type of problems do you enjoy solving?',
    options: [
      { value: 'puzzles', label: 'Mathematical Puzzles', desc: 'Algorithmic optimization and data modeling' },
      { value: 'architecture', label: 'System Architecture', desc: 'Connecting databases, APIs, and backend server layers' },
      { value: 'interfaces', label: 'Interactive Interfaces', desc: 'Animating UI pages and handling user events' },
      { value: 'audit', label: 'Performance Audit', desc: 'Tracing server memory leaks and server vulnerabilities' },
    ],
  },
  {
    key: 'creativity',
    question: 'How important is visual creativity in your daily learning?',
    options: [
      { value: 'high', label: 'Extremely Important', desc: 'I need to see visual feedback of my work immediately' },
      { value: 'medium', label: 'Moderately Important', desc: 'I like structural design, but coding logic is primary' },
      { value: 'low', label: 'Not Important', desc: 'I prefer text-based servers, scripts, and pure logic' },
    ],
  },
  {
    key: 'background',
    question: 'What is your current coding background?',
    options: [
      { value: 'beginner', label: 'Absolute Beginner', desc: 'I am starting my coding journey today' },
      { value: 'intermediate', label: 'Familiar with Basics', desc: 'I know some HTML, basic Python syntax, or variables' },
      { value: 'advanced', label: 'Experienced Coder', desc: 'I have built projects or worked with core frameworks' },
    ],
  },
  {
    key: 'learning_style',
    question: 'What is your preferred learning format?',
    options: [
      { value: 'visual', label: 'Visual Playlists', desc: 'YouTube video series, creators, and visual examples' },
      { value: 'reading', label: 'Documentation & Books', desc: 'Reading official specifications and step-by-step guides' },
      { value: 'interactive', label: 'Code Challenges', desc: 'Hands-on practice problems and instant tests' },
    ],
  },
  {
    key: 'daily_time',
    question: 'How much time can you commit to learning daily?',
    options: [
      { value: 'quick', label: '30 Minutes / day', desc: 'Bite-sized learning sessions' },
      { value: 'regular', label: '1 - 2 Hours / day', desc: 'Steady, structured learning' },
      { value: 'heavy', label: '3+ Hours / day', desc: 'Fast-track career pivot' },
    ],
  },
  {
    key: 'favorite_subject',
    question: 'What was your favorite subject in school?',
    options: [
      { value: 'math', label: 'Mathematics & Logic', desc: 'Formulas, statistics, and puzzle-solving' },
      { value: 'computer', label: 'Computer Science', desc: 'Typing scripts, playing games, and building files' },
      { value: 'art', label: 'Art & Design', desc: 'Drawing, photography, and building visuals' },
      { value: 'science', label: 'Physics & Analysis', desc: 'Understanding how complex systems work' },
    ],
  },
];

export default function CareerAssessmentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  const handleSelect = (value) => {
    setAnswers({
      ...answers,
      [questions[currentStep].key]: value,
    });
  };

  const handleNext = () => {
    if (!answers[questions[currentStep].key]) {
      showToast('Please select an option to continue', 'error');
      return;
    }
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAssessment();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      await api.post('/career/assessment', { responses: answers });
      showToast('AI analysis completed!', 'success');
      navigate('/career/recommendations');
    } catch (err) {
      console.error('Assessment submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const activeQuestion = questions[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-brutal-cream flex items-center justify-center p-4">
      <div className="w-full max-w-2xl my-8">
        {/* Progress header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brutal-yellow border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-md flex items-center justify-center">
              <Brain className="w-4 h-4 text-black" />
            </div>
            <span className="font-black text-black uppercase tracking-wider text-sm">
              Career Assessment
            </span>
          </div>
          <span className="font-mono font-bold text-black bg-white border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">
            Step {currentStep + 1} of {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-6 bg-white border-[3px] border-black rounded-lg mb-8 overflow-hidden relative shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div
            className="h-full bg-brutal-green border-r-[3px] border-black transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center font-black text-xs font-mono uppercase mix-blend-difference text-white">
            {progressPercent}% Analyzed
          </div>
        </div>

        {/* Question card */}
        <Card bg="#FFFFFF" className="p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-black uppercase text-black leading-tight mb-8">
            {activeQuestion.question}
          </h2>

          <div className="space-y-4 mb-8">
            {activeQuestion.options.map((opt) => {
              const isSelected = answers[activeQuestion.key] === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`cursor-pointer p-4 rounded-xl border-[3px] border-black transition-all shadow-brutal flex items-start gap-3 hover:-translate-x-0.5 hover:-translate-y-0.5 ${
                    isSelected ? 'bg-brutal-yellow' : 'bg-brutal-cream hover:bg-white'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-black text-white font-bold text-xs' : 'bg-white'
                  }`}>
                    {isSelected && '✓'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-black uppercase text-sm md:text-base">
                      {opt.label}
                    </h3>
                    <p className="text-xs md:text-sm text-black/70 font-semibold mt-1">
                      {opt.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center gap-4">
            <Button
              onClick={handleBack}
              disabled={currentStep === 0 || submitting}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={submitting}
              className="flex items-center gap-2"
              bg={currentStep === questions.length - 1 ? '#4ADE80' : '#FFE600'}
            >
              {submitting ? (
                'Analyzing...'
              ) : currentStep === questions.length - 1 ? (
                <>
                  Analyze My Career <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next Question <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
