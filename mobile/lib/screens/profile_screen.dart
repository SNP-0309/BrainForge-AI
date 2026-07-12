import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../core/api_client.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  List<dynamic> _unlockedBadges = [];
  bool _loadingBadges = true;

  @override
  void initState() {
    super.initState();
    _fetchAchievements();
  }

  Future<void> _fetchAchievements() async {
    try {
      final response = await ApiClient.get('/achievements/me');
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _unlockedBadges = body['data'] ?? [];
            _loadingBadges = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingBadges = false;
        });
      }
    }
  }

  void _showBadgeDetails(Map<String, dynamic> badge) {
    final achievement = badge['achievement'] ?? {};
    final title = achievement['title'] ?? 'Badge';
    final desc = achievement['description'] ?? '';
    final icon = achievement['icon'] ?? '🏅';
    final xp = achievement['xpReward'] ?? 0;
    final coins = achievement['coinsReward'] ?? 0;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1E222B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Text(icon, style: const TextStyle(fontSize: 28)),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                desc,
                style: TextStyle(color: Colors.white.withOpacity(0.8), height: 1.4),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'XP REWARD: +$xp XP',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF6C63FF)),
                  ),
                  Text(
                    'COINS: +$coins COINS',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFFFCC00)),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('AWESOME', style: TextStyle(color: Color(0xFF00E5FF), fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    if (user == null) return const SizedBox();

    final xp = user.profile.xp;
    final level = user.profile.level;
    final coins = user.profile.coins;
    final streak = user.profile.dailyStreak;
    final chosenPath = user.profile.chosenCareerPath;

    final xpInCurrentLevel = xp % 100;
    final progressToNextLevel = xpInCurrentLevel / 100.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('STUDENT PROFILE'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Info Header Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 32,
                          backgroundColor: const Color(0xFF6C63FF),
                          child: Text(
                            user.name.substring(0, 2).toUpperCase(),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user.name.toUpperCase(),
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                user.email,
                                style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5)),
                              ),
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF6C63FF).withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  user.role.toUpperCase(),
                                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF6C63FF), letterSpacing: 0.5),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    // Level progress
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Level $level PROGRESS', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1)),
                        Text('$xpInCurrentLevel / 100 XP', style: const TextStyle(fontSize: 11, color: Color(0xFF00E5FF), fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: progressToNextLevel,
                        minHeight: 6,
                        backgroundColor: Colors.white.withOpacity(0.05),
                        valueColor: const AlwaysStoppedAnimation(Color(0xFF6C63FF)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Mini Stats Grid
            Row(
              children: [
                _buildMiniStat('STREAK', '🔥 $streak d'),
                const SizedBox(width: 12),
                _buildMiniStat('COINS', '🪙 $coins'),
                const SizedBox(width: 12),
                _buildMiniStat('XP', '✨ $xp'),
              ],
            ),
            const SizedBox(height: 24),

            // Chosen Career Path Card
            Card(
              color: const Color(0xFF1E222B),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('CAREER TRACK', style: TextStyle(fontSize: 10, letterSpacing: 1.2, color: Colors.white54, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      chosenPath.isNotEmpty ? chosenPath : 'No Career Path Selected',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      chosenPath.isNotEmpty
                          ? 'Visit the Roadmap tab to view detailed study milestones and unlock custom AI-generated study tools!'
                          : 'Go to the Dashboard and start the Assessment to get matching tech role recommendations.',
                      style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.5), height: 1.4),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Achievements Badge Grid
            const Text('🏆 UNLOCKED BADGES', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1)),
            const SizedBox(height: 12),
            _loadingBadges
                ? const Center(child: CircularProgressIndicator())
                : _unlockedBadges.isEmpty
                    ? Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E222B),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF2E3440)),
                        ),
                        child: const Text(
                          'No badges unlocked yet. Start completing daily missions and lessons to unlock achievements!',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Colors.white54, height: 1.4),
                        ),
                      )
                    : GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.95,
                        ),
                        itemCount: _unlockedBadges.length,
                        itemBuilder: (context, index) {
                          final badge = _unlockedBadges[index];
                          final achievement = badge['achievement'] ?? {};
                          final icon = achievement['icon'] ?? '🏅';
                          final title = achievement['title'] ?? 'Title';

                          return Card(
                            margin: EdgeInsets.zero,
                            child: InkWell(
                              onTap: () => _showBadgeDetails(badge),
                              borderRadius: BorderRadius.circular(16),
                              child: Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(icon, style: const TextStyle(fontSize: 26)),
                                    const SizedBox(height: 6),
                                    Text(
                                      title.toUpperCase(),
                                      textAlign: TextAlign.center,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
            const SizedBox(height: 36),

            // Logout Button
            OutlinedButton.icon(
              onPressed: () => ref.read(authProvider.notifier).logout(),
              icon: const Icon(Icons.logout, size: 18),
              label: const Text('LOGOUT SESSION', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1)),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.redAccent,
                side: const BorderSide(color: Colors.redAccent),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value) {
    return Expanded(
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                label,
                style: TextStyle(fontSize: 9, color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.bold, letterSpacing: 0.8),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
