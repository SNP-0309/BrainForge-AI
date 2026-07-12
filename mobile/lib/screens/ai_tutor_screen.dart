import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../core/api_client.dart';

class AiTutorScreen extends ConsumerStatefulWidget {
  const AiTutorScreen({super.key});

  @override
  ConsumerState<AiTutorScreen> createState() => _AiTutorScreenState();
}

class _AiTutorScreenState extends ConsumerState<AiTutorScreen> {
  final List<Map<String, String>> _messages = [];
  String? _chatId;
  final _inputController = TextEditingController();
  String _aiProvider = 'groq'; // Default fast provider
  bool _loading = false;
  bool _loadingWeak = true;
  List<dynamic> _weakTopics = [];

  @override
  void initState() {
    super.initState();
    _fetchWeakTopics();
  }

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  Future<void> _fetchWeakTopics() async {
    try {
      final response = await ApiClient.get('/ai/weak-topics');
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _weakTopics = body['data'] ?? [];
            _loadingWeak = false;
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loadingWeak = false;
        });
      }
    }
  }

  Future<void> _sendMessage(String text) async {
    final msg = text.trim();
    if (msg.isEmpty) return;

    setState(() {
      _messages.add({'sender': 'user', 'content': msg});
      _loading = true;
    });
    _inputController.clear();

    try {
      final response = await ApiClient.post('/ai/tutor/chat', {
        if (_chatId != null) 'chatId': _chatId,
        'message': msg,
        'aiProvider': _aiProvider,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = jsonDecode(response.body);
        final data = body['data'];
        if (mounted) {
          setState(() {
            _chatId = data['chatId'];
            _messages.add({'sender': 'assistant', 'content': data['response'] ?? ''});
            _loading = false;
          });
        }
      } else {
        throw Exception();
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _messages.add({'sender': 'assistant', 'content': 'Error: Failed to fetch response from AI Mentor.'});
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI STUDY MENTOR'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _messages.clear();
                _chatId = null;
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Sidebar metrics translated to horizontal collapsible cards
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Row(
              children: [
                // Path Indicator Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    child: Row(
                      children: [
                        const Icon(Icons.explore, size: 18, color: Colors.blueAccent),
                        const SizedBox(width: 8),
                        Text(
                          'TARGET: ${user?.profile.chosenCareerPath.toUpperCase() ?? "NONE"}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),

                // Weak Topics Card
                if (!_loadingWeak && _weakTopics.isNotEmpty)
                  ..._weakTopics.map((topic) {
                    final name = topic['name'] ?? '';
                    final score = topic['averageScore'] ?? 0;
                    return InkWell(
                      onTap: () => _sendMessage(
                        'I want to review my weak topic "$name". Can you explain the concepts simply and give a practice question?',
                      ),
                      child: Card(
                        color: const Color(0xFFFFAED7).withOpacity(0.12),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          child: Row(
                            children: [
                              const Icon(Icons.warning_amber_rounded, size: 18, color: Colors.orangeAccent),
                              const SizedBox(width: 8),
                              Text(
                                'REVIEW $name (${score.round()}%)',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
              ],
            ),
          ),

          // Provider selector bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 6.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('AI LLM Engine:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'groq', label: Text('Groq (Fast)', style: TextStyle(fontSize: 10))),
                    ButtonSegment(value: 'gemini', label: Text('Gemini', style: TextStyle(fontSize: 10))),
                  ],
                  selected: {_aiProvider},
                  onSelectionChanged: (val) {
                    setState(() {
                      _aiProvider = val.first;
                    });
                  },
                ),
              ],
            ),
          ),

          // Chat Feed Timeline
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.chat_bubble_outline, size: 48, color: Colors.black54),
                          const SizedBox(height: 16),
                          const Text(
                            'Ask Your AI Learning Mentor',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Solve logic doubts, review code, or request simpler conceptual explanations in real-time.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12, color: Colors.black.withOpacity(0.5)),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(24),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final m = _messages[index];
                      final isAssistant = m['sender'] == 'assistant';

                      return Padding(
                        child: Row(
                          mainAxisAlignment: isAssistant ? MainAxisAlignment.start : MainAxisAlignment.end,
                          children: [
                            if (isAssistant) ...[
                              const CircleAvatar(
                                radius: 14,
                                backgroundColor: Color(0xFFFFE600),
                                child: Icon(Icons.smart_toy_outlined, size: 16, color: Colors.black),
                              ),
                              const SizedBox(width: 8),
                            ],
                            Flexible(
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isAssistant ? Colors.white : const Color(0xFFFFE600).withOpacity(0.12),
                                  border: Border.all(color: Colors.black, width: 2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  m['content'] ?? '',
                                  style: const TextStyle(fontSize: 13, height: 1.4),
                                ),
                              ),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.only(bottom: 12.0),
                      );
                    },
                  ),
          ),

          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12.0),
              child: Center(child: CircularProgressIndicator()),
            ),

          // Message Input Field
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    decoration: InputDecoration(
                      hintText: 'Ask a doubt or explain a concept...',
                      filled: true,
                      fillColor: Colors.white,
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Colors.black, width: 2),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Colors.black, width: 2.5),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () => _sendMessage(_inputController.text),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFE600),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.all(16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: const BorderSide(color: Colors.black, width: 2),
                    ),
                  ),
                  child: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
