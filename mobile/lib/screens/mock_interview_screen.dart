import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/api_client.dart';

class MockInterviewScreen extends StatefulWidget {
  const MockInterviewScreen({super.key});

  @override
  State<MockInterviewScreen> createState() => _MockInterviewScreenState();
}

class _MockInterviewScreenState extends State<MockInterviewScreen> {
  // Mode: 'setup' | 'playing' | 'loading' | 'scorecard'
  String _mode = 'setup';
  String _loadingText = '';

  // Setup parameters
  final _roleController = TextEditingController(text: 'Software Engineer');
  final _companyController = TextEditingController(text: 'Google');
  String _interviewType = 'mixed';
  int _totalQuestions = 5;

  // Session details
  String _interviewId = '';
  List<dynamic> _messages = [];
  int _currentQuestionIndex = 0;
  final _responseController = TextEditingController();
  bool _submittingResponse = false;

  // Scorecard / Feedback
  Map<String, dynamic>? _feedback;

  @override
  void dispose() {
    _roleController.dispose();
    _companyController.dispose();
    _responseController.dispose();
    super.dispose();
  }

  Future<void> _startInterview() async {
    setState(() {
      _mode = 'loading';
      _loadingText = 'AI Interviewer is preparing questions...';
    });

    try {
      final response = await ApiClient.post('/interviews/start', {
        'role': _roleController.text.trim(),
        'company': _companyController.text.trim(),
        'interviewType': _interviewType,
        'totalQuestions': _totalQuestions,
        'format': 'text',
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = jsonDecode(response.body);
        final interviewData = body['data']['interview'];
        _interviewId = interviewData['_id'];
        _currentQuestionIndex = 0;
        _messages = [
          {
            'role': 'interviewer',
            'content': body['data']['firstMessage'] ?? 'Hello! Welcome to your interview. Let\'s begin.',
          }
        ];

        setState(() {
          _mode = 'playing';
        });
      } else {
        throw Exception();
      }
    } catch (e) {
      setState(() {
        _mode = 'setup';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to start interview session. Check your server.'), backgroundColor: Colors.redAccent),
      );
    }
  }

  Future<void> _submitResponse() async {
    final text = _responseController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _submittingResponse = true;
    });

    // Optimistically add user message
    _messages.add({
      'role': 'candidate',
      'content': text,
    });
    _responseController.clear();

    try {
      final response = await ApiClient.post('/interviews/$_interviewId/respond', {
        'message': text,
      });

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final data = body['data'];
        final isCompleted = data['isCompleted'] == true;
        _currentQuestionIndex = data['currentQuestionIndex'] ?? _currentQuestionIndex;

        setState(() {
          _messages.add({
            'role': 'interviewer',
            'content': data['aiMessage'] ?? '',
          });
          _submittingResponse = false;
        });

        if (isCompleted) {
          _generateScorecard();
        }
      } else {
        throw Exception();
      }
    } catch (_) {
      setState(() {
        _submittingResponse = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to submit response.'), backgroundColor: Colors.redAccent),
      );
    }
  }

  Future<void> _generateScorecard() async {
    setState(() {
      _mode = 'loading';
      _loadingText = 'AI is evaluating transcript & generating scorecard...';
    });

    try {
      final response = await ApiClient.post('/interviews/$_interviewId/feedback', {});
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        setState(() {
          _feedback = body['data'];
          _mode = 'scorecard';
        });
      } else {
        throw Exception();
      }
    } catch (e) {
      setState(() {
        _mode = 'playing';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to compile interview scorecard.'), backgroundColor: Colors.redAccent),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI MOCK INTERVIEW'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    switch (_mode) {
      case 'setup':
        return _buildSetupView();
      case 'loading':
        return _buildLoadingView();
      case 'playing':
        return _buildPlayingView();
      case 'scorecard':
        return _buildScorecardView();
      default:
        return const SizedBox();
    }
  }

  Widget _buildSetupView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.settings_voice, size: 64, color: Color(0xFF00E5FF)),
              const SizedBox(height: 16),
              const Text('INTERVIEW SIMULATOR', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                'Generate an active role-based coding and behavioral interview powered by Google Gemini / Groq.',
                style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5), height: 1.4),
              ),
              const SizedBox(height: 24),

              // Target Role Input
              TextField(
                controller: _roleController,
                decoration: InputDecoration(
                  labelText: 'Target Job Role',
                  hintText: 'e.g. Frontend Developer',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),

              // Company Target
              TextField(
                controller: _companyController,
                decoration: InputDecoration(
                  labelText: 'Target Company Name',
                  hintText: 'e.g. Meta',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),

              // Type Selector
              DropdownButtonFormField<String>(
                value: _interviewType,
                decoration: InputDecoration(
                  labelText: 'Questions Focus',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: const [
                  DropdownMenuItem(value: 'mixed', child: Text('Mixed (Tech + Behavior)')),
                  DropdownMenuItem(value: 'technical', child: Text('Technical Only')),
                  DropdownMenuItem(value: 'behavioral', child: Text('Behavioral Only')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _interviewType = value;
                    });
                  }
                },
              ),
              const SizedBox(height: 24),

              // Total questions count slider
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Interview Length', style: TextStyle(fontWeight: FontWeight.bold)),
                  Text('$_totalQuestions Questions', style: const TextStyle(color: Color(0xFF00E5FF), fontWeight: FontWeight.bold)),
                ],
              ),
              Slider(
                value: _totalQuestions.toDouble(),
                min: 3,
                max: 10,
                divisions: 7,
                activeColor: const Color(0xFF6C63FF),
                onChanged: (val) {
                  setState(() {
                    _totalQuestions = val.round();
                  });
                },
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _startInterview,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E5FF),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('START SESSION 🎙️', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
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

  Widget _buildPlayingView() {
    return Column(
      children: [
        // Top status info bar
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Role: ${_roleController.text}',
                style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.5)),
              ),
              Text(
                'Question ${_currentQuestionIndex + 1} of $_totalQuestions',
                style: const TextStyle(fontSize: 11, color: Color(0xFF00E5FF), fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),

        // Chat messages timeline
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            itemCount: _messages.length,
            itemBuilder: (context, index) {
              final msg = _messages[index];
              final isInterviewer = msg['role'] == 'interviewer';

              return Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: Row(
                  mainAxisAlignment: isInterviewer ? MainAxisAlignment.start : MainAxisAlignment.end,
                  children: [
                    if (isInterviewer) ...[
                      const CircleAvatar(
                        backgroundColor: Color(0xFF6C63FF),
                        radius: 16,
                        child: Icon(Icons.support_agent, size: 18, color: Colors.white),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isInterviewer ? const Color(0xFF1E222B) : const Color(0xFF6C63FF).withOpacity(0.16),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isInterviewer ? const Color(0xFF2E3440) : const Color(0xFF6C63FF).withOpacity(0.4),
                          ),
                        ),
                        child: Text(
                          msg['content'] ?? '',
                          style: const TextStyle(fontSize: 13, height: 1.4),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),

        // Input entry bar
        Padding(
          padding: const EdgeInsets.all(24.0),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _responseController,
                  decoration: InputDecoration(
                    hintText: 'Type your response...',
                    filled: true,
                    fillColor: const Color(0xFF1E222B),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _submittingResponse ? null : _submitResponse,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E5FF),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _submittingResponse
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.black)),
                      )
                    : const Icon(Icons.send),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildScorecardView() {
    final overall = _feedback?['overallScore'] ?? 0;
    final technical = _feedback?['technicalScore'] ?? 0;
    final communication = _feedback?['communicationScore'] ?? 0;
    final confidence = _feedback?['confidenceScore'] ?? 0;

    final strengths = List<String>.from(_feedback?['strengthPoints'] ?? []);
    final improvements = List<String>.from(_feedback?['improvementPoints'] ?? []);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Overall Score Card
          Card(
            color: const Color(0xFF4ADE80).withOpacity(0.08),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const Text('🏆 INTERVIEW SCORECARD', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1)),
                  const SizedBox(height: 20),
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        height: 96,
                        width: 96,
                        child: CircularProgressIndicator(
                          value: overall / 100.0,
                          strokeWidth: 10,
                          backgroundColor: Colors.white10,
                          valueColor: const AlwaysStoppedAnimation(Color(0xFF4ADE80)),
                        ),
                      ),
                      Text('$overall%', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text(
                    _feedback?['detailedFeedback'] ?? 'Session analyzed successfully.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.7), height: 1.4),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Core Metrics Bar
          const Text('CORE METRICS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1)),
          const SizedBox(height: 12),
          _buildMetricRow('Technical Knowledge', technical),
          const SizedBox(height: 10),
          _buildMetricRow('Communication Quality', communication),
          const SizedBox(height: 10),
          _buildMetricRow('Self Confidence & Pacing', confidence),
          const SizedBox(height: 24),

          // Strengths
          if (strengths.isNotEmpty) ...[
            const Text('🌟 KEY STRENGTHS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF4ADE80))),
            const SizedBox(height: 8),
            ...strengths.map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 6.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
                      Expanded(child: Text(s, style: const TextStyle(fontSize: 12, height: 1.4))),
                    ],
                  ),
                )),
            const SizedBox(height: 24),
          ],

          // Improvement
          if (improvements.isNotEmpty) ...[
            const Text('🔧 FOCUS FOR IMPROVEMENT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.orangeAccent)),
            const SizedBox(height: 8),
            ...improvements.map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 6.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
                      Expanded(child: Text(s, style: const TextStyle(fontSize: 12, height: 1.4))),
                    ],
                  ),
                )),
            const SizedBox(height: 32),
          ],

          ElevatedButton(
            onPressed: () {
              setState(() {
                _mode = 'setup';
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6C63FF),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('BACK TO ARCADE SETUP', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricRow(String label, int val) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12)),
            Text('$val%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: val / 100.0,
            minHeight: 6,
            backgroundColor: Colors.white10,
            valueColor: const AlwaysStoppedAnimation(Color(0xFF00E5FF)),
          ),
        ),
      ],
    );
  }
}
