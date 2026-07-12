import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../providers/auth_provider.dart';
import '../providers/roadmap_provider.dart';
import '../models/user.dart';

final questionsList = [
  {
    'key': 'interests',
    'question': 'What are your core technical interests?',
    'options': [
      {'value': 'ai_ml', 'label': 'AI & Machine Learning'},
      {'value': 'web_dev', 'label': 'Web & App Development'},
      {'value': 'data_science', 'label': 'Data & Analytics'},
      {'value': 'security', 'label': 'Systems & Security'},
    ],
  },
  {
    'key': 'personality',
    'question': 'Describe your working style:',
    'options': [
      {'value': 'analytical', 'label': 'Logical & Analytical'},
      {'value': 'creative', 'label': 'Creative & Visual'},
      {'value': 'user_centric', 'label': 'User & Product Focused'},
      {'value': 'defensive', 'label': 'Detail & Rules Oriented'},
    ],
  },
  {
    'key': 'problem_solving',
    'question': 'What problems do you enjoy solving?',
    'options': [
      {'value': 'puzzles', 'label': 'Math & Puzzles'},
      {'value': 'architecture', 'label': 'System Architecture'},
      {'value': 'interfaces', 'label': 'Interactive UI Design'},
      {'value': 'audit', 'label': 'Performance & Security Audit'},
    ],
  },
  {
    'key': 'background',
    'question': 'Your current coding background?',
    'options': [
      {'value': 'beginner', 'label': 'Absolute Beginner'},
      {'value': 'intermediate', 'label': 'Familiar with Basics'},
      {'value': 'advanced', 'label': 'Experienced Coder'},
    ],
  },
  {
    'key': 'daily_time',
    'question': 'Daily learning time commitment?',
    'options': [
      {'value': 'quick', 'label': '30 Minutes / day'},
      {'value': 'regular', 'label': '1 - 2 Hours / day'},
      {'value': 'heavy', 'label': '3+ Hours / day'},
    ],
  },
];

class AssessmentScreen extends ConsumerStatefulWidget {
  const AssessmentScreen({super.key});

  @override
  ConsumerState<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends ConsumerState<AssessmentScreen> {
  int _currentStep = 0;
  final Map<String, String> _answers = {};
  bool _submitting = false;

  void _handleSelect(String key, String value) {
    setState(() {
      _answers[key] = value;
    });
  }

  Future<void> _handleNext() async {
    final activeQuestion = questionsList[_currentStep];
    final selectedValue = _answers[activeQuestion['key']];
    if (selectedValue == null) return;

    if (_currentStep < questionsList.length - 1) {
      setState(() {
        _currentStep++;
      });
    } else {
      setState(() {
        _submitting = true;
      });
      try {
        final response = await ApiClient.post('/career/assessment', {'responses': _answers});
        if (response.statusCode == 200 || response.statusCode == 201) {
          // Fetch updated user info to get the recommendations
          final userResponse = await ApiClient.get('/users/me');
          if (userResponse.statusCode == 200) {
            final userBody = jsonDecode(userResponse.body);
            final updatedUser = UserModel.fromJson(userBody['data']);
            ref.read(authProvider.notifier).updateUser(updatedUser);
            
            if (mounted) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const RecommendationsScreen()),
              );
            }
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Submission failed: $e'), backgroundColor: Colors.redAccent),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _submitting = false;
          });
        }
      }
    }
  }

  void _handleBack() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeQuestion = questionsList[_currentStep];
    final selectedValue = _answers[activeQuestion['key']];

    return Scaffold(
      appBar: AppBar(
        title: const Text('CAREER DISCOVERY'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Progress
            Text(
              'STEP ${_currentStep + 1} OF ${questionsList.length}',
              style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5, color: Color(0xFF6C63FF)),
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: (_currentStep + 1) / questionsList.length,
                minHeight: 10,
                backgroundColor: Colors.white.withOpacity(0.1),
                valueColor: const AlwaysStoppedAnimation(Color(0xFF00E5FF)),
              ),
            ),
            const SizedBox(height: 40),

            // Question Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      activeQuestion['question'] as String,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 24),
                    Column(
                      children: (activeQuestion['options'] as List<Map<String, String>>).map((opt) {
                        final isSelected = selectedValue == opt['value'];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12.0),
                          child: InkWell(
                            onTap: () => _handleSelect(activeQuestion['key'] as String, opt['value']!),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFF6C63FF).withOpacity(0.2) : Colors.transparent,
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF6C63FF) : const Color(0xFF2E3440),
                                  width: 1.5,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    isSelected ? Icons.check_circle : Icons.radio_button_off,
                                    color: isSelected ? const Color(0xFF00E5FF) : Colors.white60,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      opt['label']!,
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
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Nav Buttons
            Row(
              children: [
                if (_currentStep > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _handleBack,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: Color(0xFF2E3440)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('BACK'),
                    ),
                  ),
                if (_currentStep > 0) const SizedBox(width: 16),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: selectedValue == null || _submitting ? null : _handleNext,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00E5FF),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _submitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.black)),
                          )
                        : Text(_currentStep == questionsList.length - 1 ? 'ANALYZE PATH ✦' : 'NEXT'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class RecommendationsScreen extends ConsumerStatefulWidget {
  const RecommendationsScreen({super.key});

  @override
  ConsumerState<RecommendationsScreen> createState() => _RecommendationsScreenState();
}

class _RecommendationsScreenState extends ConsumerState<RecommendationsScreen> {
  int? _expandedIndex = 0;
  String? _selectingPath;

  Future<void> _handleSelectPath(String pathTitle) async {
    setState(() {
      _selectingPath = pathTitle;
    });
    try {
      final response = await ApiClient.post('/career/select', {'careerPath': pathTitle});
      if (response.statusCode == 200 || response.statusCode == 201) {
        // Fetch fresh user profile
        final userResponse = await ApiClient.get('/users/me');
        if (userResponse.statusCode == 200) {
          final userBody = jsonDecode(userResponse.body);
          final updatedUser = UserModel.fromJson(userBody['data']);
          ref.read(authProvider.notifier).updateUser(updatedUser);
          
          // Re-load the career roadmap provider
          ref.read(roadmapProvider.notifier).fetchRoadmap(pathTitle);

          if (mounted) {
            Navigator.popUntil(context, (route) => route.isFirst);
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to select path: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _selectingPath = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final recs = user?.profile.assessmentRecommendations ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('YOUR CAREER MATCHES'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
      ),
      body: recs.isEmpty
          ? const Center(child: Text('No recommendations found. Please take the assessment.'))
          : ListView.builder(
              padding: const EdgeInsets.all(24.0),
              itemCount: recs.length,
              itemBuilder: (context, idx) {
                final rec = recs[idx];
                final isExpanded = _expandedIndex == idx;
                final accentColor = idx == 0
                    ? const Color(0xFF00E5FF)
                    : idx == 1
                        ? const Color(0xFF6C63FF)
                        : const Color(0xFFFF007F);

                return Card(
                  margin: const EdgeInsets.only(bottom: 16.0),
                  child: Column(
                    children: [
                      ListTile(
                        title: Text(
                          rec['title'] ?? 'Title',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        subtitle: Text(
                          'Match Score: ${rec['matchPercentage']}%',
                          style: TextStyle(color: accentColor, fontWeight: FontWeight.w600),
                        ),
                        trailing: Icon(isExpanded ? Icons.expand_less : Icons.expand_more),
                        onTap: () {
                          setState(() {
                            _expandedIndex = isExpanded ? null : idx;
                          });
                        },
                      ),
                      if (isExpanded)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16.0, 0, 16.0, 16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Divider(color: Color(0xFF2E3440)),
                              const SizedBox(height: 8),
                              const Text('WHY IT FITS YOU', style: TextStyle(fontSize: 10, letterSpacing: 1.5, color: Colors.white54)),
                              const SizedBox(height: 4),
                              Text(rec['whyItFits'] ?? '', style: const TextStyle(height: 1.4)),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('EST. DURATION', style: TextStyle(fontSize: 10, color: Colors.white54)),
                                        const SizedBox(height: 4),
                                        Text(rec['averageDuration'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('DIFFICULTY', style: TextStyle(fontSize: 10, color: Colors.white54)),
                                        const SizedBox(height: 4),
                                        Text(rec['difficulty'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              const Text('SALARY POTENTIAL', style: TextStyle(fontSize: 10, color: Colors.white54)),
                              const SizedBox(height: 4),
                              Text(rec['salaryPotential'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4ADE80))),
                              const SizedBox(height: 16),
                              const Text('REQUIRED SKILLS', style: TextStyle(fontSize: 10, color: Colors.white54)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: List<String>.from(rec['requiredSkills'] ?? []).map((skill) {
                                  return Chip(
                                    label: Text(skill, style: const TextStyle(fontSize: 11)),
                                    backgroundColor: const Color(0xFF2E3440),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 24),
                              ElevatedButton(
                                onPressed: _selectingPath != null ? null : () => _handleSelectPath(rec['title']),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: accentColor,
                                  foregroundColor: idx == 0 ? Colors.black : Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: _selectingPath == rec['title']
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.black)),
                                      )
                                    : const Text('ACCEPT & START ROADMAP →', style: TextStyle(fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
