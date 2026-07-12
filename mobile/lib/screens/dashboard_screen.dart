import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../core/api_client.dart';
import '../models/user.dart';
import '../components/animations.dart';
import 'assessment_screen.dart';
import 'leaderboard_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  Map<String, dynamic>? _mission;
  bool _missionLoading = true;
  String? _completingTaskId;
  bool _claiming = false;

  @override
  void initState() {
    super.initState();
    _fetchMission();
  }

  Future<void> _fetchMission() async {
    try {
      final response = await ApiClient.get('/missions/today');
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _mission = body['data'];
            _missionLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _missionLoading = false;
        });
      }
    }
  }

  Future<void> _handleCompleteTask(String taskId) async {
    setState(() {
      _completingTaskId = taskId;
    });
    try {
      final response = await ApiClient.put('/missions/task/$taskId/complete', {});
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        setState(() {
          _mission = body['data'];
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to complete task: $e'), backgroundColor: Colors.redAccent),
      );
    } finally {
      setState(() {
        _completingTaskId = null;
      });
    }
  }

  Future<void> _handleClaimRewards() async {
    setState(() {
      _claiming = true;
    });
    try {
      final claimRes = await ApiClient.post('/missions/claim', {});
      if (claimRes.statusCode == 200) {
        final userResponse = await ApiClient.get('/users/me');
        if (userResponse.statusCode == 200) {
          final userBody = jsonDecode(userResponse.body);
          final updatedUser = UserModel.fromJson(userBody['data']);
          ref.read(authProvider.notifier).updateUser(updatedUser);
        }
        await _fetchMission();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to claim rewards: $e'), backgroundColor: Colors.redAccent),
      );
    } finally {
      setState(() {
        _claiming = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    if (user == null) return const SizedBox();

    final xp = user.profile.xp;
    final level = user.profile.level;
    final coins = user.profile.coins;
    final streak = user.profile.dailyStreak;
    final chosenPath = user.profile.chosenCareerPath;

    // Calculate level progression (e.g. 100 XP per level milestone)
    final xpInCurrentLevel = xp % 100;
    final progressToNextLevel = xpInCurrentLevel / 100.0;

    final tasks = _mission?['tasks'] as List<dynamic>? ?? [];
    final isMissionComplete = tasks.isNotEmpty && tasks.every((t) => t['completed'] == true);
    final claimed = _mission?['claimed'] == true;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Row
              FadeInDown(
                delay: const Duration(milliseconds: 100),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome back,',
                          style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14),
                        ),
                        Text(
                          user.name.toUpperCase(),
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 1),
                        ),
                        Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF6C63FF).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFF6C63FF).withOpacity(0.5)),
                          ),
                          child: Text(
                            user.role.toUpperCase(),
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF6C63FF)),
                          ),
                        ),
                      ],
                    ),
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: const Color(0xFF6C63FF),
                      child: Text(
                        user.name.substring(0, 2).toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Level Progression Bar
              FadeInDown(
                delay: const Duration(milliseconds: 150),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'LEVEL $level ARCHMAGE',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1.2),
                            ),
                            Text(
                              '$xpInCurrentLevel / 100 XP',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF00E5FF)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: progressToNextLevel,
                            minHeight: 8,
                            backgroundColor: Colors.white.withOpacity(0.05),
                            valueColor: const AlwaysStoppedAnimation(Color(0xFF6C63FF)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Active Path CTA
              FadeInDown(
                delay: const Duration(milliseconds: 200),
                child: chosenPath.isNotEmpty
                    ? Card(
                        color: const Color(0xFF6C63FF).withOpacity(0.12),
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Row(
                            children: [
                              const Icon(Icons.explore, size: 40, color: Color(0xFF00E5FF)),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('ACTIVE CAREER PATH', style: TextStyle(fontSize: 10, letterSpacing: 1.2, color: Colors.white60)),
                                    const SizedBox(height: 4),
                                    Text(chosenPath, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ElevatedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const AssessmentScreen()),
                          );
                        },
                        icon: const Icon(Icons.auto_awesome),
                        label: const Text('DISCOVER CAREER PATH ✦', style: TextStyle(fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00E5FF),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
              ),
              const SizedBox(height: 28),

              // Stats Grid
              FadeInDown(
                delay: const Duration(milliseconds: 300),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('YOUR STATS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1)),
                        IconButton(
                          icon: const Icon(Icons.emoji_events, color: Color(0xFFFFCC00)),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const LeaderboardScreen()),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 1.5,
                      children: [
                        _buildStatCard('TOTAL XP', '$xp', const Color(0xFF6C63FF), Icons.insights),
                        _buildStatCard('COIN BALANCE', '🪙 $coins', const Color(0xFFFFCC00), Icons.monetization_on),
                        _buildStatCard('DAILY STREAK', '🔥 ${streak}d', const Color(0xFFFF5722), Icons.local_fire_department),
                        _buildStatCard('COMPLETED', '${xp ~/ 15}', const Color(0xFF4ADE80), Icons.task_alt),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Daily Mission Card
              FadeInDown(
                delay: const Duration(milliseconds: 380),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text("TODAY'S MISSION", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1)),
                    const SizedBox(height: 12),
                    _missionLoading
                        ? const Card(
                            child: Padding(
                              padding: EdgeInsets.all(32.0),
                              child: Center(child: CircularProgressIndicator()),
                            ),
                          )
                        : Card(
                            child: Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Mission status header
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        claimed ? '✓ MISSION CLAIMED' : isMissionComplete ? '★ REWARDS READY' : '⧖ IN PROGRESS',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: claimed
                                              ? const Color(0xFF4ADE80)
                                              : isMissionComplete
                                                  ? const Color(0xFF00E5FF)
                                                  : Colors.white60,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),

                                  // Mission Tasks list
                                  if (tasks.isEmpty)
                                    const Padding(
                                      padding: EdgeInsets.symmetric(vertical: 16.0),
                                      child: Text('No missions assigned for today. Go start learning!', style: TextStyle(color: Colors.white54)),
                                    )
                                  else
                                    Column(
                                      children: tasks.map((task) {
                                        final isCompleted = task['completed'] == true;
                                        return Padding(
                                          padding: const EdgeInsets.only(bottom: 8.0),
                                          child: InkWell(
                                            onTap: isCompleted || _completingTaskId == task['id']
                                                ? null
                                                : () => _handleCompleteTask(task['id']),
                                            borderRadius: BorderRadius.circular(10),
                                            child: Container(
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                color: isCompleted ? const Color(0xFF4ADE80).withOpacity(0.08) : Colors.white.withOpacity(0.02),
                                                border: Border.all(
                                                  color: isCompleted ? const Color(0xFF4ADE80).withOpacity(0.3) : const Color(0xFF2E3440),
                                                ),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Row(
                                                children: [
                                                  _completingTaskId == task['id']
                                                      ? const SizedBox(
                                                          height: 18,
                                                          width: 18,
                                                          child: CircularProgressIndicator(strokeWidth: 2),
                                                        )
                                                      : Icon(
                                                          isCompleted ? Icons.check_box : Icons.check_box_outline_blank,
                                                          color: isCompleted ? const Color(0xFF4ADE80) : Colors.white54,
                                                          size: 20,
                                                        ),
                                                  const SizedBox(width: 12),
                                                  Expanded(
                                                    child: Text(
                                                      task['label'] ?? '',
                                                      style: TextStyle(
                                                        fontSize: 12,
                                                        decoration: isCompleted ? TextDecoration.lineThrough : null,
                                                        color: isCompleted ? Colors.white60 : Colors.white,
                                                        fontWeight: FontWeight.w600,
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

                                  // Reward claim button
                                  if (isMissionComplete && !claimed) ...[
                                    const SizedBox(height: 16),
                                    ElevatedButton(
                                      onPressed: _claiming ? null : _handleClaimRewards,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF4ADE80),
                                        foregroundColor: Colors.black,
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      child: _claiming
                                          ? const SizedBox(
                                              height: 18,
                                              width: 18,
                                              child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.black)),
                                            )
                                          : const Text('CLAIM REWARDS (+50 XP / 15 COINS) 🎁', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                                    ),
                                  ],
                                  if (claimed) ...[
                                    const SizedBox(height: 12),
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF4ADE80).withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: const Color(0xFF4ADE80).withOpacity(0.3)),
                                      ),
                                      child: const Text(
                                        '🎉 All rewards claimed! Come back tomorrow for new daily missions.',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF4ADE80)),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                  ],
                ),
              ),
              const SizedBox(height: 36),

              // Logout Button
              FadeInDown(
                delay: const Duration(milliseconds: 480),
                child: OutlinedButton.icon(
                  onPressed: () => ref.read(authProvider.notifier).logout(),
                  icon: const Icon(Icons.logout, size: 18),
                  label: const Text('SIGN OUT', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.redAccent,
                    side: const BorderSide(color: Colors.redAccent),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),

            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 16),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: TextStyle(fontSize: 9, color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.bold, letterSpacing: 0.8),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
