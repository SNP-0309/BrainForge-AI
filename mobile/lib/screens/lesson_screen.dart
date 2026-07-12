import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../providers/course_provider.dart';
import '../providers/auth_provider.dart';
import '../models/course.dart';
import '../models/lesson.dart';
import '../models/user.dart';
import '../core/api_client.dart';

class LessonScreen extends ConsumerStatefulWidget {
  final CourseModel course;

  const LessonScreen({super.key, required this.course});

  @override
  ConsumerState<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends ConsumerState<LessonScreen> {
  LessonModel? _selectedLesson;
  YoutubePlayerController? _ytController;
  bool _completing = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      await ref.read(courseProvider.notifier).fetchLessons(widget.course.id);
      final lessons = ref.read(courseProvider).lessons;
      if (lessons.isNotEmpty) {
        _selectLesson(lessons.first);
      }
    });
  }

  @override
  void dispose() {
    _ytController?.dispose();
    super.dispose();
  }

  void _selectLesson(LessonModel lesson) {
    setState(() {
      _selectedLesson = lesson;
    });

    _ytController?.dispose();
    _ytController = null;

    if (lesson.videoUrl.isNotEmpty) {
      final videoId = YoutubePlayer.convertUrlToId(lesson.videoUrl);
      if (videoId != null) {
        _ytController = YoutubePlayerController(
          initialVideoId: videoId,
          flags: const YoutubePlayerFlags(
            autoPlay: false,
            mute: false,
          ),
        );
      }
    }
  }

  Future<void> _handleCompleteLesson() async {
    if (_selectedLesson == null) return;
    setState(() {
      _completing = true;
    });

    try {
      final result = await ref.read(courseProvider.notifier).completeLesson(_selectedLesson!.id);
      
      // Update the user profile locally with rewarded coins & XP
      final userResponse = await ApiClient.get('/users/me');
      if (userResponse.statusCode == 200) {
        final userBody = jsonDecode(userResponse.body);
        final updatedUser = UserModel.fromJson(userBody['data']);
        ref.read(authProvider.notifier).updateUser(updatedUser);
      }

      final xp = result['xpAwarded'] ?? 0;
      final coins = result['coinsAwarded'] ?? 0;

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lesson completed! Awarded +$xp XP and +$coins Coins 🎁'),
            backgroundColor: const Color(0xFF4ADE80),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to complete: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _completing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(courseProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.course.title.toUpperCase(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
      ),
      body: state.isLoading && state.lessons.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Player Section (YouTube or Paid Card)
                if (_selectedLesson != null)
                  _buildVideoOrPaidHeader()
                else
                  Container(
                    height: 200,
                    color: Colors.black12,
                    child: const Center(child: Text('Select a lesson to start')),
                  ),

                // 2. Syllabus & Lessons List
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(24.0),
                    children: [
                      if (_selectedLesson != null) ...[
                        Text(
                          _selectedLesson!.title,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Estimated Time: ${_selectedLesson!.estimatedTime} mins',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF00E5FF), fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _selectedLesson!.content,
                          style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.7), height: 1.5),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _completing ? null : _handleCompleteLesson,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF6C63FF),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: _completing
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                                )
                              : const Text('MARK LESSON AS COMPLETED', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(height: 32),
                      ],

                      // Syllabus Header
                      const Text(
                        'COURSE SYLLABUS',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.2),
                      ),
                      const SizedBox(height: 12),

                      // Lessons items
                      if (state.lessons.isEmpty)
                        const Text('No lessons uploaded for this course yet.', style: TextStyle(color: Colors.white54))
                      else
                        ...state.lessons.map((lesson) {
                          final isSelected = _selectedLesson?.id == lesson.id;
                          return Card(
                            color: isSelected ? const Color(0xFF6C63FF).withOpacity(0.12) : const Color(0xFF1E222B),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: BorderSide(
                                color: isSelected ? const Color(0xFF6C63FF) : const Color(0xFF2E3440),
                                width: 1.2,
                              ),
                            ),
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: CircleAvatar(
                                radius: 14,
                                backgroundColor: isSelected ? const Color(0xFF00E5FF) : const Color(0xFF2E3440),
                                child: Text(
                                  '${lesson.order}',
                                  style: TextStyle(
                                    color: isSelected ? Colors.black : Colors.white70,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              title: Text(
                                lesson.title,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                  color: isSelected ? Colors.white : Colors.white70,
                                ),
                              ),
                              subtitle: Text('${lesson.estimatedTime} mins', style: const TextStyle(fontSize: 10)),
                              onTap: () => _selectLesson(lesson),
                            ),
                          );
                        }),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildVideoOrPaidHeader() {
    if (_ytController != null) {
      return YoutubePlayer(
        controller: _ytController!,
        showVideoProgressIndicator: true,
        progressIndicatorColor: const Color(0xFF00E5FF),
      );
    }

    // Checkout card for paid external courses
    return Container(
      padding: const EdgeInsets.all(24),
      color: const Color(0xFF1E222B),
      child: Column(
        children: [
          const Icon(Icons.lock_outline, size: 48, color: Color(0xFF00E5FF)),
          const SizedBox(height: 12),
          const Text(
            'PREMIUM COURSE SYLLABUS',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 1),
          ),
          const SizedBox(height: 6),
          Text(
            'To access premium quizzes, workspaces, and full check-out files, please visit ${widget.course.platform}:',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.6), height: 1.4),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {}, // Handled by launcher
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00E5FF),
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('GET LIFETIME ACCESS ↗', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
