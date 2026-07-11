import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Vibration,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalButton } from '../../../components/BrutalButton';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';

// ─── Fallback Bug Challenges (used if API fails) ───────────────────────────
const BUG_FALLBACK_CHALLENGES = [
  {
    id: 'f1',
    title: 'Off-By-One Loop',
    language: 'JavaScript',
    description: 'This function should print numbers 1 through 10.',
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
    id: 'f2',
    title: 'Wrong Array Filter',
    language: 'JavaScript',
    description: 'This function should return the sum of all numbers in the array.',
    lines: [
      { code: 'function sumArray(arr) {', buggy: false },
      { code: '  return arr.filter((a, b) => a + b, 0);', buggy: true },
      { code: '}', buggy: false },
    ],
    explanation: '`filter` is the wrong method here. It should be `reduce` to accumulate a sum: `arr.reduce((a, b) => a + b, 0)`.',
    fixedLine: '  return arr.reduce((a, b) => a + b, 0);',
  },
  {
    id: 'f3',
    title: 'Missing Python Return',
    language: 'Python',
    description: 'This function should return the square of a number.',
    lines: [
      { code: 'def square(n):', buggy: false },
      { code: '    result = n * n', buggy: false },
      { code: '    print(result)', buggy: true },
    ],
    explanation: '`print(result)` should be `return result`. The function prints the value but doesn\'t return it.',
    fixedLine: '    return result',
  },
  {
    id: 'f4',
    title: 'Assignment vs Comparison',
    language: 'JavaScript',
    description: 'This condition should check if x equals 10.',
    lines: [
      { code: 'let x = 5;', buggy: false },
      { code: 'if (x = 10) {', buggy: true },
      { code: '  console.log("x is 10");', buggy: false },
      { code: '}', buggy: false },
    ],
    explanation: '`x = 10` is an assignment, not a comparison. It should be `x === 10`.',
    fixedLine: 'if (x === 10) {',
  },
];

const ROUND_TIME = 30; // 30s per bug hunt round

export default function GamesHubScreen() {
  const { user, setUser } = useAuthStore();

  // Mode: 'hub' | 'bughunt_loading' | 'bughunt_playing' | 'bughunt_result' | 'quiz_setup' | 'quiz_loading' | 'quiz_playing' | 'quiz_result'
  const [mode, setMode] = useState<string>('hub');

  // Stats
  const coins = user?.profile?.coins ?? 0;
  const xp = user?.profile?.xp ?? 0;

  // ─── BUG HUNT STATE ────────────────────────────────────────────────────────
  const [bugChallenges, setBugChallenges] = useState<any[]>([]);
  const [bugIndex, setBugIndex] = useState(0);
  const [bugScore, setBugScore] = useState(0);
  const [bugTimeLeft, setBugTimeLeft] = useState(ROUND_TIME);
  const [bugSelectedLine, setBugSelectedLine] = useState<number | null>(null);
  const [bugRevealed, setBugRevealed] = useState(false);
  const [bugHistory, setBugHistory] = useState<any[]>([]); // { buggySelected: boolean, points: number }[]
  const bugTimerRef = useRef<any>(null);

  // ─── QUIZ STATE ────────────────────────────────────────────────────────────
  const [quizTopic, setQuizTopic] = useState('');
  const [quizId, setQuizId] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizUserAnswers, setQuizUserAnswers] = useState<any[]>([]); // { questionIndex: number, selectedIndex: number }[]
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  // ─── START BUG HUNT GAME ───────────────────────────────────────────────────
  const startBugHunt = async () => {
    setMode('bughunt_loading');
    setBugIndex(0);
    setBugScore(0);
    setBugHistory([]);
    setBugSelectedLine(null);
    setBugRevealed(false);
    setBugTimeLeft(ROUND_TIME);

    try {
      const res = await api.post('/ai/bughunt/generate', { count: 5 });
      const data = res.data.data?.challenges;
      if (data && Array.isArray(data) && data.length > 0) {
        setBugChallenges(data);
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      const shuffled = [...BUG_FALLBACK_CHALLENGES].sort(() => Math.random() - 0.5);
      setBugChallenges(shuffled);
    } finally {
      setMode('bughunt_playing');
    }
  };

  // Timer logic for Bug Hunt
  useEffect(() => {
    if (mode === 'bughunt_playing' && !bugRevealed) {
      bugTimerRef.current = setInterval(() => {
        setBugTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(bugTimerRef.current);
            // Handle timeout
            handleBugAnswer(-1); // Timeout is represented by invalid index -1
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (bugTimerRef.current) clearInterval(bugTimerRef.current);
    };
  }, [mode, bugIndex, bugRevealed]);

  const handleBugAnswer = (lineIdx: number) => {
    if (bugRevealed) return;
    if (bugTimerRef.current) clearInterval(bugTimerRef.current);

    setBugSelectedLine(lineIdx);
    setBugRevealed(true);

    const currentChallenge = bugChallenges[bugIndex];
    const isCorrect = lineIdx !== -1 && currentChallenge.lines[lineIdx]?.buggy === true;
    const pointsGained = isCorrect ? 10 : -3;

    if (!isCorrect) {
      Vibration.vibrate(300);
    }

    setBugScore((prev) => prev + pointsGained);
    setBugHistory((prev) => [...prev, { buggySelected: isCorrect, points: pointsGained }]);
  };

  const handleNextBug = () => {
    if (bugIndex < bugChallenges.length - 1) {
      setBugIndex((prev) => prev + 1);
      setBugSelectedLine(null);
      setBugRevealed(false);
      setBugTimeLeft(ROUND_TIME);
    } else {
      // Game Over, credit rewards if score > 0
      awardBugHuntRewards();
    }
  };

  const awardBugHuntRewards = async () => {
    setMode('bughunt_result');
    // If user score is positive, grant some XP & Coins
    const xpReward = Math.max(0, bugScore);
    const coinsReward = bugScore >= 30 ? 5 : 1;
    if (xpReward > 0) {
      try {
        await api.put('/users/me', {
          profile: {
            xp: xp + xpReward,
            coins: coins + coinsReward,
          },
        });
        const userRes = await api.get('/users/me');
        setUser(userRes.data.data);
      } catch (err) {
        console.error('Failed to save bug hunt rewards:', err);
      }
    }
  };

  // ─── START AI QUIZ GAME ────────────────────────────────────────────────────
  const startQuizGeneration = async () => {
    if (!quizTopic.trim()) return;
    setMode('quiz_loading');
    setQuizIndex(0);
    setQuizUserAnswers([]);
    setQuizSelectedOption(null);
    setQuizRevealed(false);
    setQuizResult(null);

    try {
      const res = await api.post('/quizzes/generate', {
        topic: quizTopic.trim(),
        questionCount: 5,
        difficulty: 'intermediate',
      });
      const data = res.data.data;
      setQuizId(data._id);
      setQuizQuestions(data.questions);
      setMode('quiz_playing');
    } catch (err) {
      console.error('Quiz generation failed:', err);
      setMode('quiz_setup');
      Alert.alert('Error', 'Failed to generate practice quiz. Please try a different topic.');
    }
  };

  const handleQuizAnswer = (optIdx: number) => {
    if (quizRevealed) return;
    setQuizSelectedOption(optIdx);
    setQuizRevealed(true);

    setQuizUserAnswers((prev) => [
      ...prev,
      { questionIndex: quizIndex, selectedIndex: optIdx },
    ]);
  };

  const handleNextQuiz = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setQuizSelectedOption(null);
      setQuizRevealed(false);
    } else {
      submitQuizResults();
    }
  };

  const submitQuizResults = async () => {
    setSubmittingQuiz(true);
    try {
      const res = await api.post(`/quizzes/${quizId}/submit`, {
        answers: quizUserAnswers,
      });
      setQuizResult(res.data.data);
      // Reload user profile to capture the new coin and XP balances
      const userRes = await api.get('/users/me');
      setUser(userRes.data.data);
      setMode('quiz_result');
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      Alert.alert('Error', 'Failed to submit quiz scores to backend.');
      setMode('hub');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // ─── RENDER DETAILED UI ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      
      {/* ─── HUB VIEW ─── */}
      {mode === 'hub' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <BrutalCard bg="#E9D5FF" style={styles.introCard}>
              <Text style={styles.introTitle}>👾 BRAINFORGE ARCADE 👾</Text>
              <Text style={styles.introText}>
                Play interactive games to sharpen your technical coding skills, earn coins, and rank up.
              </Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceText}>🪙 {coins} Coins</Text>
                <Text style={styles.balanceText}>✨ {xp} XP</Text>
              </View>
            </BrutalCard>
          </Animated.View>

          {/* Bug Hunt Card */}
          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <BrutalCard bg="#FFFFFF" style={styles.gameSelectCard}>
              <Text style={styles.gameEmoji}>🐛</Text>
              <Text style={styles.gameTitle}>BUG HUNT CHALLENGE</Text>
              <Text style={styles.gameDesc}>
                Find and fix planted bugs in code snippets under a 30-second timer. Test your debugging skills!
              </Text>
              <BrutalButton onPress={startBugHunt} bg="#FF8B8B">
                Play Bug Hunt ➔
              </BrutalButton>
            </BrutalCard>
          </Animated.View>

          {/* AI Quiz Card */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <BrutalCard bg="#FFFFFF" style={styles.gameSelectCard}>
              <Text style={styles.gameEmoji}>❓</Text>
              <Text style={styles.gameTitle}>AI PRACTICE QUIZ</Text>
              <Text style={styles.gameDesc}>
                Generate a custom 5-question multiple choice test on any programming topic using Google Gemini.
              </Text>
              <BrutalButton onPress={() => setMode('quiz_setup')} bg="#FFE600">
                Generate Quiz ➔
              </BrutalButton>
            </BrutalCard>
          </Animated.View>
        </ScrollView>
      )}

      {/* ─── QUIZ SETUP VIEW ─── */}
      {mode === 'quiz_setup' && (
        <View style={styles.centerContainer}>
          <BrutalCard bg="#FFE600" style={styles.setupCard}>
            <Text style={styles.setupTitle}>Quiz Generator</Text>
            <Text style={styles.setupDesc}>
              Enter any technical topic (e.g., "React Hooks", "CSS Flexbox", "Python Decorators") to generate a test.
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                value={quizTopic}
                onChangeText={setQuizTopic}
                placeholder="Enter topic..."
                placeholderTextColor="#94A3B8"
                style={styles.input}
              />
            </View>

            <View style={styles.quickTopicRow}>
              {['JavaScript', 'Python', 'React.js', 'SQL', 'Git'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setQuizTopic(t)}
                  style={styles.quickTopicChip}
                >
                  <Text style={styles.quickTopicChipText}>#{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <BrutalButton onPress={startQuizGeneration} bg="#000" style={styles.submitSetupBtn}>
              <Text style={{ color: '#FFE600', fontWeight: '900' }}>GENERATE TEST</Text>
            </BrutalButton>

            <TouchableOpacity onPress={() => setMode('hub')} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </BrutalCard>
        </View>
      )}

      {/* ─── LOADING VIEWS ─── */}
      {(mode === 'bughunt_loading' || mode === 'quiz_loading') && (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#000" size="large" />
          <Text style={styles.loadingText}>
            {mode === 'bughunt_loading'
              ? 'Generating buggy snippets...'
              : 'Creating custom quiz questions...'}
          </Text>
        </View>
      )}

      {/* ─── BUG HUNT PLAYING ─── */}
      {mode === 'bughunt_playing' && bugChallenges.length > 0 && (() => {
        const challenge = bugChallenges[bugIndex];
        const progressVal = (bugIndex + 1) / bugChallenges.length;
        const progressPct = Math.round(progressVal * 100);
        
        // Color transition for timer
        const timerColor = bugTimeLeft > 15 ? '#4ADE80' : bugTimeLeft > 7 ? '#FFE600' : '#FF8B8B';

        return (
          <ScrollView contentContainerStyle={styles.gameContent}>
            
            {/* Header progress bar */}
            <View style={styles.gameHeaderRow}>
              <Text style={styles.gameHeaderTitle}>Bug Hunt {bugIndex + 1}/{bugChallenges.length}</Text>
              <Text style={styles.scoreText}>Score: {bugScore}</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
            </View>

            {/* Timer bar */}
            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>⏰ TIME LEFT:</Text>
              <View style={styles.timerBarBg}>
                <View style={[styles.timerBarFill, { width: `${(bugTimeLeft / ROUND_TIME) * 100}%` as any, backgroundColor: timerColor }]} />
              </View>
              <Text style={styles.timerSeconds}>{bugTimeLeft}s</Text>
            </View>

            {/* Description */}
            <BrutalCard bg="#FFFFFF" style={styles.descCard}>
              <Text style={styles.challengeLabel}>CHALLENGE Objective:</Text>
              <Text style={styles.challengeDescText}>{challenge.description}</Text>
            </BrutalCard>

            {/* Code editor snippet */}
            <View style={styles.editorContainer}>
              <View style={styles.editorShadow} />
              <View style={styles.editorHeader}>
                <View style={styles.editorDotRow}>
                  <View style={[styles.editorDot, { backgroundColor: '#FF8B8B' }]} />
                  <View style={[styles.editorDot, { backgroundColor: '#FFE600' }]} />
                  <View style={[styles.editorDot, { backgroundColor: '#4ADE80' }]} />
                </View>
                <Text style={styles.editorLangText}>
                  {challenge.language || 'CODE'}
                </Text>
              </View>
              <View style={styles.editorBody}>
                {challenge.lines.map((line: any, idx: number) => {
                  const isSelected = bugSelectedLine === idx;
                  let lineBg = 'transparent';
                  if (bugRevealed) {
                    if (line.buggy) lineBg = '#DCFCE7'; // correct answer highlighted green
                    else if (isSelected) lineBg = '#FEE2E2'; // incorrect answer highlighted red
                  } else if (isSelected) {
                    lineBg = '#FEF9C3';
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleBugAnswer(idx)}
                      disabled={bugRevealed}
                      activeOpacity={0.8}
                      style={[styles.editorLine, { backgroundColor: lineBg }]}
                    >
                      <Text style={styles.lineNumber}>{idx + 1}</Text>
                      <Text style={styles.lineCodeText}>{line.code || ' '}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Revealed Explanation */}
            {bugRevealed && (
              <Animated.View entering={FadeInUp.springify()}>
                <BrutalCard
                  bg={bugSelectedLine !== null && challenge.lines[bugSelectedLine]?.buggy ? '#DCFCE7' : '#FEE2E2'}
                  style={styles.explanationCard}
                >
                  <Text style={styles.explanationTitle}>
                    {bugSelectedLine !== null && challenge.lines[bugSelectedLine]?.buggy
                      ? '🎯 SPOT ON! ( +10 XP )'
                      : '❌ BUG MISSED! ( -3 XP )'}
                  </Text>
                  <Text style={styles.explanationText}>{challenge.explanation}</Text>
                  
                  {challenge.fixedLine && (
                    <View style={styles.fixedLineBox}>
                      <Text style={styles.fixedLineLabel}>FIXED CODE:</Text>
                      <Text style={styles.fixedLineCode}>{challenge.fixedLine}</Text>
                    </View>
                  )}

                  <BrutalButton onPress={handleNextBug} bg="#000" style={styles.nextBtn}>
                    <Text style={{ color: '#FFF', fontWeight: '900' }}>
                      {bugIndex === bugChallenges.length - 1 ? 'FINISH GAME' : 'NEXT BUG ➔'}
                    </Text>
                  </BrutalButton>
                </BrutalCard>
              </Animated.View>
            )}

          </ScrollView>
        );
      })()}

      {/* ─── BUG HUNT RESULT ─── */}
      {mode === 'bughunt_result' && (
        <View style={styles.centerContainer}>
          <BrutalCard bg="#FF8B8B" style={styles.resultCard}>
            <Text style={styles.resultEmoji}>🏆</Text>
            <Text style={styles.resultTitle}>DEBUG COMPLETED!</Text>
            <Text style={styles.resultScoreLabel}>Total Score:</Text>
            <Text style={styles.resultScoreValue}>{bugScore} pts</Text>

            {/* Rewards */}
            <View style={styles.rewardBox}>
              <Text style={styles.rewardText}>✨ XP EARNED: +{Math.max(0, bugScore)}</Text>
              <Text style={styles.rewardText}>🪙 COINS EARNED: +{bugScore >= 30 ? 5 : 1}</Text>
            </View>

            {/* Per round grids */}
            <View style={styles.gridRow}>
              {bugHistory.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.gridIndicator,
                    { backgroundColor: item.buggySelected ? '#4ADE80' : '#FF8B8B' },
                  ]}
                >
                  <Text style={styles.gridIndicatorText}>{item.buggySelected ? '✓' : '✕'}</Text>
                </View>
              ))}
            </View>

            <BrutalButton onPress={() => setMode('hub')} bg="#000" style={styles.doneBtn}>
              <Text style={{ color: '#FFF', fontWeight: '900' }}>BACK TO HUB</Text>
            </BrutalButton>
          </BrutalCard>
        </View>
      )}

      {/* ─── QUIZ PLAYING ─── */}
      {mode === 'quiz_playing' && quizQuestions.length > 0 && (() => {
        const question = quizQuestions[quizIndex];
        const progressVal = (quizIndex + 1) / quizQuestions.length;
        const progressPct = Math.round(progressVal * 100);

        return (
          <ScrollView contentContainerStyle={styles.gameContent}>
            <View style={styles.gameHeaderRow}>
              <Text style={styles.gameHeaderTitle}>Quiz {quizIndex + 1}/{quizQuestions.length}</Text>
              <Text style={styles.scoreText}>Practice Test</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
            </View>

            <BrutalCard bg="#FFFFFF" style={styles.quizQuestionCard}>
              <Text style={styles.quizQuestionText}>{question.questionText}</Text>
            </BrutalCard>

            {/* Options list */}
            <View style={styles.optionsList}>
              {question.options.map((opt: string, idx: number) => {
                const isSelected = quizSelectedOption === idx;
                
                // Color formatting
                let optBg = '#FFFFFF';
                if (quizRevealed) {
                  // In the generator API, the questions come with answers stripped for safety.
                  // Wait, wait! When generating casual quiz from `/quizzes/generate`, does the returned JSON have the answers stripped?
                  // Let's verify routes: `POST /generate` returns the created quiz, which includes correctAnswerIndex! Wait, yes, the route POST `/generate` returns the raw quiz (including correctAnswerIndex) to let users play immediately.
                  // Let's check `correctAnswerIndex`. If quizRevealed is true, highlight the correct one green, and if selected wrong, highlight selected red.
                  const isCorrect = idx === question.correctAnswerIndex;
                  if (isCorrect) optBg = '#DCFCE7'; // green
                  else if (isSelected) optBg = '#FEE2E2'; // red
                } else if (isSelected) {
                  optBg = '#FEF9C3';
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleQuizAnswer(idx)}
                    disabled={quizRevealed}
                    activeOpacity={0.8}
                    style={[styles.optionBtn, { backgroundColor: optBg }]}
                  >
                    <View style={styles.optionDot}>
                      <Text style={styles.optionLetter}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                    </View>
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Explanation box */}
            {quizRevealed && (
              <Animated.View entering={FadeInUp.springify()}>
                <BrutalCard bg="#FFFFFF" style={styles.explanationCard}>
                  <Text style={styles.explanationLabel}>Explanation:</Text>
                  <Text style={styles.explanationText}>
                    {question.explanation || 'No explanation provided.'}
                  </Text>
                  
                  <BrutalButton onPress={handleNextQuiz} bg="#000" style={styles.nextBtn}>
                    <Text style={{ color: '#FFF', fontWeight: '900' }}>
                      {quizIndex === quizQuestions.length - 1 ? 'SUBMIT TEST' : 'NEXT QUESTION ➔'}
                    </Text>
                  </BrutalButton>
                </BrutalCard>
              </Animated.View>
            )}

          </ScrollView>
        );
      })()}

      {/* ─── QUIZ SUBMITTING LOADER ─── */}
      {submittingQuiz && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Submitting test results...</Text>
        </View>
      )}

      {/* ─── QUIZ RESULT VIEW ─── */}
      {mode === 'quiz_result' && quizResult && (
        <View style={styles.centerContainer}>
          <BrutalCard bg="#4ADE80" style={styles.resultCard}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={styles.resultTitle}>TEST COMPLETED!</Text>
            <Text style={styles.resultScoreLabel}>Result:</Text>
            <Text style={styles.resultScoreValue}>
              {quizResult.score}/{quizResult.maxScore} pts ({quizResult.percentage}%)
            </Text>

            <View style={styles.rewardBox}>
              <Text style={styles.rewardText}>✨ XP EARNED: +{quizResult.rewards?.xp ?? 0}</Text>
              <Text style={styles.rewardText}>🪙 COINS EARNED: +{quizResult.rewards?.coins ?? 0}</Text>
            </View>

            <View style={styles.passBadge}>
              <Text style={styles.passBadgeText}>
                {quizResult.passed ? '✓ PASSED (70%+)' : '✕ FAILED (under 70%)'}
              </Text>
            </View>

            <BrutalButton onPress={() => setMode('hub')} bg="#000" style={styles.doneBtn}>
              <Text style={{ color: '#FFF', fontWeight: '900' }}>BACK TO HUB</Text>
            </BrutalButton>
          </BrutalCard>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
  content: { padding: 20, paddingBottom: 40 },
  gameContent: { padding: 20, paddingBottom: 60 },

  introCard: { marginBottom: 20 },
  introTitle: { fontWeight: '900', fontSize: 16, color: '#000', marginBottom: 4, letterSpacing: 0.5 },
  introText: { fontWeight: '600', fontSize: 12, color: '#000', opacity: 0.7, lineHeight: 18 },
  balanceRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  balanceText: { fontWeight: '900', fontSize: 12, color: '#000' },

  gameSelectCard: { marginBottom: 20 },
  gameEmoji: { fontSize: 32, marginBottom: 8 },
  gameTitle: { fontWeight: '900', fontSize: 16, color: '#000', letterSpacing: 0.5, marginBottom: 6 },
  gameDesc: { fontWeight: '600', fontSize: 12, color: '#000', opacity: 0.65, lineHeight: 18, marginBottom: 16 },

  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#FFFDF6' },
  loadingText: { marginTop: 14, fontWeight: '800', color: '#000', fontSize: 11, textTransform: 'uppercase' },

  // Setup Quiz Card
  setupCard: { width: '100%', maxWidth: 320 },
  setupTitle: { fontWeight: '900', fontSize: 20, textTransform: 'uppercase', color: '#000', marginBottom: 6 },
  setupDesc: { fontWeight: '600', fontSize: 12, color: '#000', opacity: 0.7, lineHeight: 18, marginBottom: 16 },
  inputContainer: { position: 'relative', marginBottom: 14 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  quickTopicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  quickTopicChip: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#000', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  quickTopicChipText: { fontSize: 10, fontWeight: '800', color: '#000' },
  submitSetupBtn: { width: '100%' },
  cancelBtn: { alignSelf: 'center', marginTop: 14 },
  cancelText: { fontWeight: '800', fontSize: 12, textTransform: 'uppercase', color: '#000', textDecorationLine: 'underline' },

  // Bug playing details
  gameHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  gameHeaderTitle: { fontWeight: '900', fontSize: 14, color: '#000', textTransform: 'uppercase' },
  scoreText: { fontWeight: '900', fontSize: 14, color: '#000' },
  progressBg: { height: 8, backgroundColor: '#00000020', borderRadius: 4, borderWidth: 1.5, borderColor: '#000', marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#000' },

  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  timerLabel: { fontSize: 10, fontWeight: '900', color: '#000' },
  timerBarBg: { flex: 1, height: 10, backgroundColor: '#00000015', borderRadius: 6, borderWidth: 1.5, borderColor: '#000', overflow: 'hidden' },
  timerBarFill: { height: '100%' },
  timerSeconds: { fontSize: 11, fontWeight: '900', color: '#000', width: 26, textAlign: 'right' },

  descCard: { marginBottom: 14 },
  challengeLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', opacity: 0.5, letterSpacing: 0.8, color: '#000' },
  challengeDescText: { fontSize: 12, fontWeight: '700', color: '#000', lineHeight: 18, marginTop: 2 },

  // Code editor styling
  editorContainer: { position: 'relative', marginBottom: 20 },
  editorShadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: '#000', borderRadius: 12 },
  editorHeader: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    borderColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editorDotRow: { flexDirection: 'row', gap: 6 },
  editorDot: { width: 8, height: 8, borderRadius: 4 },
  editorLangText: { color: '#94A3B8', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  editorBody: {
    backgroundColor: '#0F172A',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 2.5,
    borderColor: '#000',
    paddingVertical: 10,
  },
  editorLine: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 12, alignItems: 'center' },
  lineNumber: { color: '#475569', fontSize: 11, fontWeight: '700', width: 22, marginRight: 8 },
  lineCodeText: { color: '#E2E8F0', fontFamily: 'monospace', fontSize: 12, fontWeight: '600' },

  // Explanation Card
  explanationCard: { marginBottom: 20 },
  explanationTitle: { fontWeight: '900', fontSize: 14, color: '#000', marginBottom: 6 },
  explanationText: { fontWeight: '600', fontSize: 12, color: '#000', opacity: 0.8, lineHeight: 18 },
  fixedLineBox: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#000', borderRadius: 8, padding: 10, marginTop: 12 },
  fixedLineLabel: { fontSize: 8, fontWeight: '900', color: '#000', opacity: 0.5, letterSpacing: 0.8 },
  fixedLineCode: { fontFamily: 'monospace', fontSize: 11, fontWeight: '800', color: '#16A34A', marginTop: 2 },
  nextBtn: { width: '100%', marginTop: 16 },

  // Game over results
  resultCard: { width: '100%', maxWidth: 300, alignItems: 'center', padding: 20 },
  resultEmoji: { fontSize: 44, marginBottom: 8 },
  resultTitle: { fontWeight: '900', fontSize: 18, color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultScoreLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', opacity: 0.6, marginTop: 12 },
  resultScoreValue: { fontWeight: '900', fontSize: 24, color: '#000', marginTop: 2 },
  rewardBox: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', borderRadius: 10, padding: 12, marginVertical: 16, width: '100%', alignItems: 'center', gap: 4 },
  rewardText: { fontWeight: '900', fontSize: 11, color: '#000' },
  gridRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  gridIndicator: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#000', alignItems: 'center', justifyContent: 'center' },
  gridIndicatorText: { color: '#000', fontWeight: '900', fontSize: 10 },
  doneBtn: { width: '100%' },

  // Quiz details
  quizQuestionCard: { marginBottom: 16 },
  quizQuestionText: { fontWeight: '900', fontSize: 14, color: '#000', textTransform: 'uppercase', lineHeight: 20 },
  optionsList: { gap: 10, marginBottom: 16 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  optionDot: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: '#000', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  optionLetter: { fontWeight: '900', fontSize: 11, color: '#000' },
  optionText: { fontWeight: '900', fontSize: 12, color: '#000', flex: 1, textTransform: 'uppercase' },

  explanationLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', opacity: 0.5, letterSpacing: 0.8, color: '#000', marginBottom: 4 },
  passBadge: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  passBadgeText: { fontWeight: '900', fontSize: 10, color: '#000' },
});
