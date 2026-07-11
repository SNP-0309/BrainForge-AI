import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Clock, ArrowLeft, RefreshCw, CheckCircle, XCircle, Trophy, Zap, ChevronRight, AlertTriangle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useToastStore } from '../../../store/toastStore';
import api from '../../../config/api';

// ─── Fallback Bug Challenges (used if API fails) ───────────────────────────
const FALLBACK_CHALLENGES = [
  {
    id: 1,
    title: 'Off-by-One Error',
    language: 'JavaScript',
    description: 'Find the bug: This function should print numbers 1 through 10.',
    lines: [
      { code: 'function printNumbers() {', buggy: false },
      { code: '  for (let i = 1; i <= 9; i++) {', buggy: true },
      { code: '    console.log(i);', buggy: false },
      { code: '  }', buggy: false },
      { code: '}', buggy: false },
    ],
    explanation: 'The loop condition should be `i <= 10`, not `i <= 9`. This is a classic off-by-one error.',
    fixedLine: '  for (let i = 1; i <= 10; i++) {',
  },
  {
    id: 2,
    title: 'Wrong Array Method',
    language: 'JavaScript',
    description: 'Find the bug: This function should return the sum of all numbers in the array.',
    lines: [
      { code: 'function sumArray(arr) {', buggy: false },
      { code: '  return arr.filter((a, b) => a + b, 0);', buggy: true },
      { code: '}', buggy: false },
    ],
    explanation: '`filter` is the wrong method here. It should be `reduce` to accumulate a sum: `arr.reduce((a, b) => a + b, 0)`.',
    fixedLine: '  return arr.reduce((a, b) => a + b, 0);',
  },
  {
    id: 3,
    title: 'Missing Return',
    language: 'Python',
    description: 'Find the bug: This function should return the square of a number.',
    lines: [
      { code: 'def square(n):', buggy: false },
      { code: '    result = n * n', buggy: false },
      { code: '    print(result)', buggy: true },
      { code: '', buggy: false },
    ],
    explanation: '`print(result)` should be `return result`. The function prints the value but doesn\'t return it, so callers get `None`.',
    fixedLine: '    return result',
  },
  {
    id: 4,
    title: 'Index Out of Bounds',
    language: 'Python',
    description: 'Find the bug: This function should return the last element of a list.',
    lines: [
      { code: 'def last_element(lst):', buggy: false },
      { code: '    return lst[len(lst)]', buggy: true },
      { code: '', buggy: false },
    ],
    explanation: 'List indices go from 0 to len-1. `lst[len(lst)]` causes IndexError. It should be `lst[len(lst) - 1]` or simply `lst[-1]`.',
    fixedLine: '    return lst[-1]',
  },
  {
    id: 5,
    title: 'Comparison vs Assignment',
    language: 'JavaScript',
    description: 'Find the bug: This condition should check if x equals 10.',
    lines: [
      { code: 'let x = 5;', buggy: false },
      { code: 'if (x = 10) {', buggy: true },
      { code: '  console.log("x is 10");', buggy: false },
      { code: '}', buggy: false },
    ],
    explanation: '`x = 10` is an assignment, not a comparison. It should be `x === 10` (or `x == 10`). This bug always evaluates to true!',
    fixedLine: 'if (x === 10) {',
  },
  {
    id: 6,
    title: 'Wrong Variable Name',
    language: 'JavaScript',
    description: 'Find the bug: This function should return the factorial of n.',
    lines: [
      { code: 'function factorial(n) {', buggy: false },
      { code: '  if (n <= 1) return 1;', buggy: false },
      { code: '  return n * factorial(n - 2);', buggy: true },
      { code: '}', buggy: false },
    ],
    explanation: '`n - 2` should be `n - 1`. Using `n - 2` skips values and produces an incorrect result (or infinite recursion for odd n).',
    fixedLine: '  return n * factorial(n - 1);',
  },
  {
    id: 7,
    title: 'Missing Break Statement',
    language: 'JavaScript',
    description: 'Find the bug: Only "Monday" should be logged when day is 1.',
    lines: [
      { code: 'switch(day) {', buggy: false },
      { code: '  case 1:', buggy: false },
      { code: '    console.log("Monday");', buggy: false },
      { code: '  case 2:', buggy: true },
      { code: '    console.log("Tuesday");', buggy: false },
      { code: '    break;', buggy: false },
      { code: '}', buggy: false },
    ],
    explanation: 'Case 1 is missing a `break` statement. Without it, execution falls through to case 2 and also logs "Tuesday".',
    fixedLine: '  case 1: break;',
  },
  {
    id: 8,
    title: 'Incorrect Condition',
    language: 'Python',
    description: 'Find the bug: This should print "even" only for even numbers.',
    lines: [
      { code: 'def check_even(n):', buggy: false },
      { code: '    if n % 2 == 1:', buggy: true },
      { code: '        print("even")', buggy: false },
      { code: '    else:', buggy: false },
      { code: '        print("odd")', buggy: false },
    ],
    explanation: '`n % 2 == 1` checks for odd numbers, not even. It should be `n % 2 == 0`. The labels are also swapped.',
    fixedLine: '    if n % 2 == 0:',
  },
];

const ROUND_TIME = 30; // seconds per challenge
const POINTS_CORRECT = 10;
const POINTS_WRONG = -3;

export default function BugHuntPage() {
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.showToast);
  const timerRef = useRef(null);

  // ── Game State ──────────────────────────────────────────────────────────
  const [challenges, setChallenges] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [selectedLine, setSelectedLine] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [gamePhase, setGamePhase] = useState('loading'); // loading | playing | result | gameover
  const [roundResults, setRoundResults] = useState([]); // track per-round outcomes
  const [loadError, setLoadError] = useState(false);

  // ── Load challenges ─────────────────────────────────────────────────────
  const loadChallenges = useCallback(async () => {
    setGamePhase('loading');
    setLoadError(false);
    setScore(0);
    setCurrentIndex(0);
    setRoundResults([]);
    setSelectedLine(null);
    setRevealed(false);

    try {
      const res = await api.post('/ai/bughunt/generate', { count: 5 });
      const data = res?.data?.data?.challenges;
      if (data && Array.isArray(data) && data.length > 0) {
        setChallenges(data);
      } else {
        throw new Error('Empty response');
      }
    } catch {
      // Fallback to local challenges (shuffle)
      const shuffled = [...FALLBACK_CHALLENGES].sort(() => Math.random() - 0.5).slice(0, 6);
      setChallenges(shuffled);
    } finally {
      setGamePhase('playing');
    }
  }, []);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  // ── Timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gamePhase !== 'playing' || revealed) return;

    setTimeLeft(ROUND_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, gamePhase]);

  const handleTimeUp = () => {
    clearInterval(timerRef.current);
    // Count as wrong if no selection
    setRoundResults((prev) => [...prev, { correct: false, timedOut: true }]);
    setRevealed(true);
    showToast('⏰ Time\'s up! Moving to next challenge.', 'info');
  };

  // ── Line selection ──────────────────────────────────────────────────────
  const handleLineClick = (lineIndex) => {
    if (revealed || selectedLine !== null) return;
    clearInterval(timerRef.current);

    const challenge = challenges[currentIndex];
    const clickedLine = challenge.lines[lineIndex];
    const isCorrect = clickedLine.buggy;

    setSelectedLine(lineIndex);
    setRevealed(true);

    if (isCorrect) {
      setScore((s) => s + POINTS_CORRECT);
      setRoundResults((prev) => [...prev, { correct: true }]);
      showToast(`✅ Correct! +${POINTS_CORRECT} points`, 'success');
    } else {
      setScore((s) => s + POINTS_WRONG);
      setRoundResults((prev) => [...prev, { correct: false }]);
      showToast(`❌ Wrong line! ${POINTS_WRONG} points`, 'error');
    }
  };

  // ── Next challenge ──────────────────────────────────────────────────────
  const handleNext = () => {
    clearInterval(timerRef.current);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= challenges.length) {
      setGamePhase('gameover');
    } else {
      setCurrentIndex(nextIndex);
      setSelectedLine(null);
      setRevealed(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────
  const currentChallenge = challenges[currentIndex];
  const progressPct = challenges.length > 0 ? Math.round((currentIndex / challenges.length) * 100) : 0;
  const timerColor = timeLeft > 15 ? 'text-black' : timeLeft > 8 ? 'text-amber-600' : 'text-red-600';
  const timerBg = timeLeft > 15 ? 'bg-brutal-green' : timeLeft > 8 ? 'bg-brutal-yellow' : 'bg-red-200';

  // ── Loading Screen ──────────────────────────────────────────────────────
  if (gamePhase === 'loading') {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 bg-brutal-cream">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-5xl mb-4"
        >
          🐛
        </motion.div>
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono font-bold text-black text-sm uppercase">Planting bugs in code...</span>
      </div>
    );
  }

  // ── Game Over Screen ─────────────────────────────────────────────────────
  if (gamePhase === 'gameover') {
    const correct = roundResults.filter((r) => r.correct).length;
    const accuracy = challenges.length > 0 ? Math.round((correct / challenges.length) * 100) : 0;
    const isPerfect = correct === challenges.length;
    const grade = accuracy >= 80 ? '🏆 Expert Debugger' : accuracy >= 60 ? '🥈 Bug Hunter' : accuracy >= 40 ? '🥉 Code Apprentice' : '🐛 Keep Practicing';

    return (
      <div className="min-h-[calc(100vh-80px)] bg-brutal-cream py-10 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card bg={isPerfect ? '#4ADE80' : '#FFFFFF'} className="p-8 space-y-6 border-[3px] border-black text-black text-center">
            <div className="text-5xl">{isPerfect ? '🏆' : accuracy >= 60 ? '🥈' : '🐛'}</div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-wider">Bug Hunt Complete!</h1>
              <p className="text-sm font-bold text-black/70 mt-1">{grade}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                <p className="text-[9px] font-mono font-black text-black/50 uppercase">Score</p>
                <p className="text-2xl font-black text-black">{score}</p>
              </div>
              <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                <p className="text-[9px] font-mono font-black text-black/50 uppercase">Correct</p>
                <p className="text-2xl font-black text-black">{correct}/{challenges.length}</p>
              </div>
              <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                <p className="text-[9px] font-mono font-black text-black/50 uppercase">Accuracy</p>
                <p className="text-2xl font-black text-black">{accuracy}%</p>
              </div>
            </div>

            {/* Per-round breakdown */}
            <div className="flex gap-2 justify-center flex-wrap">
              {roundResults.map((r, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] text-xs font-black ${
                    r.correct ? 'bg-brutal-green' : 'bg-brutal-pink'
                  }`}
                >
                  {r.correct ? '✓' : '✗'}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={loadChallenges}
                bg="#FFE600"
                className="w-full py-3 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Play Again
              </Button>
              <Button
                onClick={() => navigate('/games')}
                variant="secondary"
                className="w-full py-3"
              >
                Back to Games Hub
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!currentChallenge) return null;

  // ── Main Game UI ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-80px)] bg-brutal-cream py-6 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button
            onClick={() => navigate('/games')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          <div className="flex flex-wrap gap-3 font-mono text-xs font-black">
            {/* Timer */}
            <div className={`${timerBg} border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 ${timerColor} transition-colors`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
            {/* Score */}
            <div className="bg-white border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 text-black">
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>{score} pts</span>
            </div>
            {/* Progress */}
            <div className="bg-brutal-purple border-2 border-black px-3.5 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
              {currentIndex + 1}/{challenges.length}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-white border-2 border-black rounded-full overflow-hidden shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
          <motion.div
            className="h-full bg-brutal-yellow border-r-2 border-black"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Challenge Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <Card bg="#FFFFFF" className="p-6 space-y-5">
              {/* Challenge Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-brutal-pink border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      Bug #{currentIndex + 1}
                    </span>
                    <span className="bg-brutal-yellow border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase rounded shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                      {currentChallenge.language}
                    </span>
                  </div>
                  <h2 className="text-lg font-black uppercase text-black">{currentChallenge.title}</h2>
                  <p className="text-xs font-bold text-black/70 mt-1">{currentChallenge.description}</p>
                </div>
                <div className="text-2xl shrink-0">🐛</div>
              </div>

              {/* Instruction Banner */}
              {!revealed && (
                <div className="bg-brutal-cream border-2 border-black rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-black shrink-0" />
                  <span className="text-xs font-black text-black uppercase">Click the line that contains the bug</span>
                </div>
              )}

              {/* Code Snippet */}
              <div className="rounded-xl border-[3px] border-black overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                {/* Code Editor top bar */}
                <div className="bg-black px-4 py-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 border border-red-700" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600" />
                  <div className="w-3 h-3 rounded-full bg-green-400 border border-green-600" />
                  <span className="ml-3 text-[11px] font-mono text-white/60 font-bold">
                    {currentChallenge.language?.toLowerCase() === 'python' ? 'script.py' : 'code.js'}
                  </span>
                </div>

                {/* Lines */}
                <div className="bg-[#1a1a2e] font-mono text-sm">
                  {currentChallenge.lines.map((line, lineIdx) => {
                    const isBugLine = line.buggy;
                    const isSelected = selectedLine === lineIdx;
                    const isCorrectReveal = revealed && isBugLine;
                    const isWrongReveal = revealed && isSelected && !isBugLine;
                    const isEmpty = line.code === '';

                    let lineClass = 'flex items-start gap-3 px-4 py-2.5 cursor-pointer select-none transition-all duration-200 ';

                    if (isEmpty) {
                      lineClass += 'cursor-default opacity-30';
                    } else if (!revealed) {
                      lineClass += 'hover:bg-white/10 hover:border-l-4 hover:border-brutal-yellow';
                    } else if (isCorrectReveal) {
                      lineClass += 'bg-red-600/30 border-l-4 border-red-500';
                    } else if (isWrongReveal) {
                      lineClass += 'bg-orange-500/20 border-l-4 border-orange-400';
                    } else {
                      lineClass += 'opacity-60';
                    }

                    return (
                      <div
                        key={lineIdx}
                        className={lineClass}
                        onClick={() => !isEmpty && handleLineClick(lineIdx)}
                      >
                        {/* Line number */}
                        <span className="text-white/30 text-xs font-mono w-5 shrink-0 pt-0.5 select-none text-right">
                          {lineIdx + 1}
                        </span>
                        {/* Line code */}
                        <span className={`text-sm font-mono leading-relaxed flex-1 ${
                          isCorrectReveal ? 'text-red-300 line-through' :
                          isWrongReveal ? 'text-orange-300' :
                          'text-[#a9c5e8]'
                        }`}>
                          {line.code || ' '}
                        </span>
                        {/* Reveal indicators */}
                        {revealed && isBugLine && (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        )}
                        {isSelected && !isBugLine && revealed && (
                          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation (shown after reveal) */}
              <AnimatePresence>
                {revealed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    {/* Bug explanation */}
                    <div className={`rounded-xl border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      roundResults[currentIndex]?.correct ? 'bg-brutal-green/20' : 'bg-brutal-pink/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {roundResults[currentIndex]?.correct ? (
                          <CheckCircle className="w-4 h-4 text-green-700 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-700 shrink-0" />
                        )}
                        <span className="text-xs font-black uppercase text-black">
                          {roundResults[currentIndex]?.correct ? '✓ Correct! Bug Found' : roundResults[currentIndex]?.timedOut ? '⏰ Time\'s Up!' : '✗ Wrong Line'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-black/85 leading-relaxed">
                        {currentChallenge.explanation}
                      </p>
                    </div>

                    {/* Fixed code */}
                    {currentChallenge.fixedLine && (
                      <div className="bg-[#1a1a2e] rounded-xl border-2 border-brutal-green overflow-hidden">
                        <div className="bg-brutal-green/20 px-3 py-1.5 border-b border-brutal-green">
                          <span className="text-[10px] font-mono font-black text-brutal-green uppercase">✓ Fixed Line</span>
                        </div>
                        <div className="px-4 py-2.5">
                          <code className="text-sm font-mono text-green-300">{currentChallenge.fixedLine}</code>
                        </div>
                      </div>
                    )}

                    {/* Next button */}
                    <Button
                      onClick={handleNext}
                      bg={currentIndex + 1 >= challenges.length ? '#4ADE80' : '#FFE600'}
                      className="w-full py-3 flex items-center justify-center gap-2 mt-2"
                    >
                      {currentIndex + 1 >= challenges.length ? (
                        <><Trophy className="w-4 h-4" /> See Results</>
                      ) : (
                        <>Next Bug <ChevronRight className="w-4 h-4" /></>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Hint / Rules */}
        {!revealed && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[9px] font-mono font-black text-black/50 uppercase">Correct</p>
              <p className="text-sm font-black text-black">+{POINTS_CORRECT} pts</p>
            </div>
            <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[9px] font-mono font-black text-black/50 uppercase">Wrong</p>
              <p className="text-sm font-black text-black">{POINTS_WRONG} pts</p>
            </div>
            <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[9px] font-mono font-black text-black/50 uppercase">Time Left</p>
              <p className={`text-sm font-black ${timerColor}`}>{timeLeft}s</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
