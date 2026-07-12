import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../core/api_client.dart';
import '../models/user.dart';
import 'mock_interview_screen.dart';

// Fallback Bug Challenges if AI generate request fails
final bugFallbacks = [
  {
    'id': 'f1',
    'title': 'Off-By-One Loop',
    'language': 'JavaScript',
    'description': 'This function should print numbers 1 through 10.',
    'lines': [
      {'code': 'function printNumbers() {', 'buggy': false},
      {'code': '  for (let i = 1; i <= 9; i++) {', 'buggy': true},
      {'code': '    console.log(i);', 'buggy': false},
      {'code': '  }', 'buggy': false},
      {'code': '}', 'buggy': false},
    ],
    'explanation': 'The loop condition should be i <= 10, not i <= 9. This is a classic off-by-one error.',
    'fixedLine': '  for (let i = 1; i <= 10; i++) {',
  },
  {
    'id': 'f2',
    'title': 'Wrong Array Method',
    'language': 'JavaScript',
    'description': 'This function should return the sum of all numbers in the array.',
    'lines': [
      {'code': 'function sumArray(arr) {', 'buggy': false},
      {'code': '  return arr.filter((a, b) => a + b, 0);', 'buggy': true},
      {'code': '}', 'buggy': false},
    ],
    'explanation': 'filter is the wrong method here. It should be reduce to accumulate a sum: arr.reduce((a, b) => a + b, 0).',
    'fixedLine': '  return arr.reduce((a, b) => a + b, 0);',
  },
];

class GamesScreen extends ConsumerStatefulWidget {
  const GamesScreen({super.key});

  @override
  ConsumerState<GamesScreen> createState() => _GamesScreenState();
}

class _GamesScreenState extends ConsumerState<GamesScreen> {
  // Mode: 'hub' | 'bughunt_playing' | 'bughunt_result' | 'quiz_setup' | 'quiz_playing' | 'quiz_result' | 'loading'
  String _mode = 'hub';
  String _loadingText = '';

  // Bug Hunt states
  List<dynamic> _bugChallenges = [];
  int _bugIndex = 0;
  int _bugScore = 0;
  int _bugTimeLeft = 30;
  int? _bugSelectedLine;
  bool _bugRevealed = false;
  Timer? _bugTimer;

  // Quiz states
  final _quizTopicController = TextEditingController();
  String _quizId = '';
  List<dynamic> _quizQuestions = [];
  int _quizIndex = 0;
  List<Map<String, int>> _quizUserAnswers = [];
  int? _quizSelectedOption;
  bool _quizRevealed = false;
  Map<String, dynamic>? _quizResult;

  @override
  void dispose() {
    _quizTopicController.dispose();
    _bugTimer?.cancel();
    super.dispose();
  }

  // --- BUG HUNT LOGIC ---
  Future<void> _startBugHunt() async {
    setState(() {
      _mode = 'loading';
      _loadingText = 'AI is preparing buggy snippets...';
      _bugIndex = 0;
      _bugScore = 0;
      _bugSelectedLine = null;
      _bugRevealed = false;
      _bugTimeLeft = 30;
    });

    try {
      final response = await ApiClient.post('/ai/bughunt/generate', {'count': 5});
      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = jsonDecode(response.body);
        _bugChallenges = body['data']['challenges'] ?? [];
      } else {
        throw Exception();
      }
    } catch (_) {
      _bugChallenges = List.from(bugFallbacks)..shuffle();
    }

    setState(() {
      _mode = 'bughunt_playing';
    });
    _startTimer();
  }

  void _startTimer() {
    _bugTimer?.cancel();
    _bugTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_bugTimeLeft > 0 && !_bugRevealed) {
        setState(() {
          _bugTimeLeft--;
        });
      } else if (_bugTimeLeft == 0 && !_bugRevealed) {
        _handleBugAnswer(-1); // Timeout
      }
    });
  }

  void _handleBugAnswer(int lineIndex) {
    _bugTimer?.cancel();
    setState(() {
      _bugSelectedLine = lineIndex;
      _bugRevealed = true;
    });

    final current = _bugChallenges[_bugIndex];
    bool isCorrect = false;
    if (lineIndex != -1 && lineIndex < current['lines'].length) {
      isCorrect = current['lines'][lineIndex]['buggy'] == true;
    }

    setState(() {
      _bugScore += isCorrect ? 10 : -3;
    });
  }

  void _handleNextBug() {
    if (_bugIndex < _bugChallenges.length - 1) {
      setState(() {
        _bugIndex++;
        _bugSelectedLine = null;
        _bugRevealed = false;
        _bugTimeLeft = 30;
      });
      _startTimer();
    } else {
      _finishBugHunt();
    }
  }

  Future<void> _finishBugHunt() async {
    setState(() {
      _mode = 'loading';
      _loadingText = 'Recording score in dashboard...';
    });

    final xpReward = _bugScore > 0 ? _bugScore : 0;
    final coinsReward = _bugScore >= 20 ? 5 : 1;

    try {
      final user = ref.read(authProvider).user;
      if (user != null && xpReward > 0) {
        await ApiClient.put('/users/me', {
          'profile': {
            'xp': user.profile.xp + xpReward,
            'coins': user.profile.coins + coinsReward,
          }
        });
        final userResponse = await ApiClient.get('/users/me');
        if (userResponse.statusCode == 200) {
          final userBody = jsonDecode(userResponse.body);
          final updatedUser = UserModel.fromJson(userBody['data']);
          ref.read(authProvider.notifier).updateUser(updatedUser);
        }
      }
    } catch (_) {}

    setState(() {
      _mode = 'bughunt_result';
    });
  }

  // --- QUIZ LOGIC ---
  Future<void> _startQuiz() async {
    final topic = _quizTopicController.text.trim();
    if (topic.isEmpty) return;

    setState(() {
      _mode = 'loading';
      _loadingText = 'Google Gemini is drafting custom questions...';
      _quizIndex = 0;
      _quizUserAnswers = [];
      _quizSelectedOption = null;
      _quizRevealed = false;
    });

    try {
      final response = await ApiClient.post('/quizzes/generate', {
        'topic': topic,
        'questionCount': 5,
        'difficulty': 'intermediate',
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = jsonDecode(response.body);
        _quizId = body['data']['_id'];
        _quizQuestions = body['data']['questions'];
        setState(() {
          _mode = 'quiz_playing';
        });
      } else {
        throw Exception();
      }
    } catch (e) {
      setState(() {
        _mode = 'quiz_setup';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to generate quiz on "$topic"'), backgroundColor: Colors.redAccent),
      );
    }
  }

  void _handleQuizOption(int optionIndex) {
    if (_quizRevealed) return;
    setState(() {
      _quizSelectedOption = optionIndex;
      _quizRevealed = true;
      _quizUserAnswers.add({
        'questionIndex': _quizIndex,
        'selectedIndex': optionIndex,
      });
    });
  }

  Future<void> _handleNextQuiz() async {
    if (_quizIndex < _quizQuestions.length - 1) {
      setState(() {
        _quizIndex++;
        _quizSelectedOption = null;
        _quizRevealed = false;
      });
    } else {
      setState(() {
        _mode = 'loading';
        _loadingText = 'Analyzing results & claiming points...';
      });

      try {
        final response = await ApiClient.post('/quizzes/$_quizId/submit', {
          'answers': _quizUserAnswers,
        });
        if (response.statusCode == 200) {
          final body = jsonDecode(response.body);
          _quizResult = body['data'];

          // Update user achievements & stats
          final userResponse = await ApiClient.get('/users/me');
          if (userResponse.statusCode == 200) {
            final userBody = jsonDecode(userResponse.body);
            final updatedUser = UserModel.fromJson(userBody['data']);
            ref.read(authProvider.notifier).updateUser(updatedUser);
          }

          setState(() {
            _mode = 'quiz_result';
          });
        }
      } catch (e) {
        setState(() {
          _mode = 'hub';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit quiz'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (_mode != 'hub') {
          setState(() {
            _mode = 'hub';
          });
          return false;
        }
        return true;
      },
      child: Scaffold(
        body: SafeArea(
          child: _buildBody(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    switch (_mode) {
      case 'hub':
        return _buildHubView();
      case 'loading':
        return _buildLoadingView();
      case 'bughunt_playing':
        return _buildBugHuntPlaying();
      case 'bughunt_result':
        return _buildBugHuntResult();
      case 'quiz_setup':
        return _buildQuizSetup();
      case 'quiz_playing':
        return _buildQuizPlaying();
      case 'quiz_result':
        return _buildQuizResult();
      default:
        return const SizedBox();
    }
  }

  Widget _buildHubView() {
    final user = ref.watch(authProvider).user;
    final coins = user?.profile.coins ?? 0;
    final xp = user?.profile.xp ?? 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Card
          Card(
            color: const Color(0xFF6C63FF).withOpacity(0.12),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                children: [
                  const Text('👾 ARCADE HUB 👾', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1, color: Colors.black)),
                  const SizedBox(height: 6),
                  const Text(
                    'Play quick games to lock in coding skills, earn coins, and rank up.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: Colors.black54),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      Text('🪙 $coins COINS', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFFFCC00))),
                      Text('✨ $xp XP', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00E5FF))),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Bug Hunt Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Row(
                    children: [
                      Text('🐛', style: TextStyle(fontSize: 28)),
                      SizedBox(width: 12),
                      Text('BUG HUNT CHALLENGE', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Spot the buggy line in code blocks under a 30-second ticking clock. Be fast, be precise!',
                    style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.6), height: 1.4),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _startBugHunt,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6C63FF),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('PLAY BUG HUNT', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // AI Quiz Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Row(
                    children: [
                      Text('❓', style: TextStyle(fontSize: 28)),
                      SizedBox(width: 12),
                      Text('AI PRACTICE QUIZ', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Provide any technical topic to generate a custom 5-question test with immediate feedback.',
                    style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.6), height: 1.4),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _mode = 'quiz_setup';
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00E5FF),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('GENERATE QUIZ', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // AI Mock Interview Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Row(
                    children: [
                      Text('🎙️', style: TextStyle(fontSize: 28)),
                      SizedBox(width: 12),
                      Text('AI MOCK INTERVIEW', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Simulate a live engineering interview for any job role. Answer questions and receive an AI scorecard evaluation.',
                    style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.6), height: 1.4),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const MockInterviewScreen()),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6C63FF),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('START INTERVIEW', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFF00E5FF))),
          const SizedBox(height: 24),
          Text(_loadingText, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
        ],
      ),
    );
  }

  Widget _buildBugHuntPlaying() {
    final challenge = _bugChallenges[_bugIndex];
    final progress = (_bugIndex + 1) / _bugChallenges.length;
    final timerPercent = _bugTimeLeft / 30.0;
    final timerColor = _bugTimeLeft > 15 ? const Color(0xFF4ADE80) : _bugTimeLeft > 7 ? const Color(0xFFFFCC00) : Colors.redAccent;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Stats
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Bug Hunt ${_bugIndex + 1}/${_bugChallenges.length}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              Text('Score: $_bugScore', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00E5FF))),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 4,
              backgroundColor: Colors.white.withOpacity(0.05),
              valueColor: const AlwaysStoppedAnimation(Color(0xFF6C63FF)),
            ),
          ),
          const SizedBox(height: 16),

          // Timer row
          Row(
            children: [
              const Text('⏰ TIME LEFT: ', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white54)),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: timerPercent,
                    minHeight: 8,
                    backgroundColor: Colors.white.withOpacity(0.05),
                    valueColor: AlwaysStoppedAnimation(timerColor),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text('${_bugTimeLeft}s', style: TextStyle(fontWeight: FontWeight.bold, color: timerColor)),
            ],
          ),
          const SizedBox(height: 20),

          // Objective
          Card(
            color: Colors.white.withOpacity(0.02),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('OBJECTIVE', style: TextStyle(fontSize: 10, letterSpacing: 1, color: Colors.white54, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text(challenge['description'] ?? '', style: const TextStyle(fontSize: 13, height: 1.4)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Interactive code editor list
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF1E222B),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF2E3440)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: List.generate(challenge['lines'].length, (idx) {
                final line = challenge['lines'][idx];
                final isSelected = _bugSelectedLine == idx;
                final isBuggy = line['buggy'] == true;

                Color rowBg = Colors.transparent;
                if (_bugRevealed) {
                  if (isBuggy) {
                    rowBg = const Color(0xFF4ADE80).withOpacity(0.12);
                  } else if (isSelected) {
                    rowBg = Colors.redAccent.withOpacity(0.12);
                  }
                } else if (isSelected) {
                  rowBg = Colors.white.withOpacity(0.05);
                }

                return InkWell(
                  onTap: _bugRevealed ? null : () => _handleBugAnswer(idx),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    color: rowBg,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${idx + 1}',
                          style: const TextStyle(color: Colors.white30, fontFamily: 'monospace', fontSize: 12),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            line['code'] ?? '',
                            style: TextStyle(
                              color: isSelected && !_bugRevealed ? const Color(0xFF00E5FF) : Colors.white70,
                              fontFamily: 'monospace',
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 24),

          // Answer revealed block
          if (_bugRevealed) ...[
            Card(
              color: _bugSelectedLine != null && challenge['lines'][_bugSelectedLine!]['buggy'] == true
                  ? const Color(0xFF4ADE80).withOpacity(0.12)
                  : Colors.redAccent.withOpacity(0.12),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      _bugSelectedLine != null && challenge['lines'][_bugSelectedLine!]['buggy'] == true
                          ? '🎯 SPOT ON! (+10 XP)'
                          : '❌ BUG MISSED! (-3 XP)',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    const SizedBox(height: 8),
                    Text(challenge['explanation'] ?? '', style: const TextStyle(height: 1.4, fontSize: 13)),
                    if (challenge['fixedLine'] != null) ...[
                      const SizedBox(height: 12),
                      const Text('FIXED LINE:', style: TextStyle(fontSize: 10, color: Colors.white54, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(challenge['fixedLine'], style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: Color(0xFF4ADE80))),
                    ],
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _handleNextBug,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: Text(_bugIndex == _bugChallenges.length - 1 ? 'FINISH GAME' : 'NEXT BUG ➔'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBugHuntResult() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🏆', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 16),
            const Text('BUG HUNT COMPLETE!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text(
              'Your total score is $_bugScore points.',
              style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _mode = 'hub';
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6C63FF),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('RETURN TO ARCADE', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuizSetup() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('QUIZ GENERATOR', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 8),
                Text(
                  'Enter any programming topic (e.g. "CSS Flexbox", "React Hooks", "Rust Ownership") to draft a challenge.',
                  style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5), height: 1.4),
                ),
                const SizedBox(height: 24),

                // Text Input
                TextField(
                  controller: _quizTopicController,
                  decoration: InputDecoration(
                    labelText: 'Topic',
                    hintText: 'e.g. JavaScript Async/Await',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),

                // Quick selector
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['JavaScript', 'Python', 'React.js', 'SQL', 'Git'].map((t) {
                    return InkWell(
                      onTap: () {
                        _quizTopicController.text = t;
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2E3440),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('#$t', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: _startQuiz,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E5FF),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('GENERATE TEST', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _mode = 'hub';
                    });
                  },
                  child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuizPlaying() {
    final question = _quizQuestions[_quizIndex];
    final progress = (_quizIndex + 1) / _quizQuestions.length;
    final options = question['options'] as List<dynamic>;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Quiz Question ${_quizIndex + 1}/${_quizQuestions.length}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const Text(' Gemini AI', style: TextStyle(fontSize: 11, color: Color(0xFF00E5FF), fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 4,
              backgroundColor: Colors.white.withOpacity(0.05),
              valueColor: const AlwaysStoppedAnimation(Color(0xFF00E5FF)),
            ),
          ),
          const SizedBox(height: 28),

          // Question Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    question['questionText'] ?? '',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, height: 1.4),
                  ),
                  const SizedBox(height: 24),
                  Column(
                    children: List.generate(options.length, (optIdx) {
                      final optText = options[optIdx];
                      final isSelected = _quizSelectedOption == optIdx;
                      final isCorrectOption = optIdx == question['correctOptionIndex'];

                      Color itemBorder = const Color(0xFF2E3440);
                      Color itemBg = Colors.transparent;

                      if (_quizRevealed) {
                        if (isCorrectOption) {
                          itemBorder = const Color(0xFF4ADE80);
                          itemBg = const Color(0xFF4ADE80).withOpacity(0.12);
                        } else if (isSelected) {
                          itemBorder = Colors.redAccent;
                          itemBg = Colors.redAccent.withOpacity(0.12);
                        }
                      } else if (isSelected) {
                        itemBorder = const Color(0xFF00E5FF);
                        itemBg = const Color(0xFF00E5FF).withOpacity(0.05);
                      }

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: InkWell(
                          onTap: _quizRevealed ? null : () => _handleQuizOption(optIdx),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: itemBg,
                              border: Border.all(color: itemBorder, width: 1.5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 12,
                                  backgroundColor: const Color(0xFF2E3440),
                                  child: Text(
                                    String.fromCharCode(65 + optIdx),
                                    style: const TextStyle(fontSize: 10, color: Colors.white70, fontWeight: FontWeight.bold),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    optText,
                                    style: TextStyle(
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Explanation Card
          if (_quizRevealed) ...[
            Card(
              color: Colors.white.withOpacity(0.02),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('AI EXPLANATION', style: TextStyle(fontSize: 10, color: Colors.white54, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
                    const SizedBox(height: 6),
                    Text(
                      question['explanation'] ?? 'No explanation provided.',
                      style: const TextStyle(fontSize: 12, height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _handleNextQuiz,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: Text(_quizIndex == _quizQuestions.length - 1 ? 'SUBMIT TEST' : 'NEXT QUESTION ➔'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQuizResult() {
    final correctCount = _quizResult?['correctCount'] ?? 0;
    final totalCount = _quizResult?['totalQuestions'] ?? 5;
    final scorePercent = (correctCount / totalCount * 100).round();

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🎉', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 16),
            const Text('QUIZ SUBMITTED!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text(
              'You scored $correctCount out of $totalCount ($scorePercent%)',
              style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14),
            ),
            const SizedBox(height: 8),
            Text(
              'Rewarded: +${_quizResult?['xpAwarded'] ?? 0} XP, +${_quizResult?['coinsAwarded'] ?? 0} Coins',
              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF00E5FF)),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _mode = 'hub';
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6C63FF),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('RETURN TO ARCADE', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
