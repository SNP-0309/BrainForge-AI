import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../components/animations.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<dynamic> _rankings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLeaderboard();
  }

  Future<void> _fetchLeaderboard() async {
    try {
      final response = await ApiClient.get('/leaderboard');
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _rankings = body['data'] ?? [];
            _isLoading = false;
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GLOBAL LEADERBOARD'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Top 3 Podium
                if (_rankings.isNotEmpty) _buildPodiumSection(),

                // Scrollable Rankings List
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                    itemCount: _rankings.length,
                    itemBuilder: (context, index) {
                      final item = _rankings[index];
                      final profile = item['profile'] ?? {};
                      final name = item['name'] ?? 'Explorer';
                      final level = profile['level'] ?? 1;
                      final xp = profile['xp'] ?? 0;
                      final streak = profile['dailyStreak'] ?? 0;

                      return FadeInUp(
                        delay: Duration(milliseconds: 50 * index),
                        child: Card(
                          margin: const EdgeInsets.only(bottom: 12.0),
                          child: ListTile(
                            leading: CircleAvatar(
                              radius: 18,
                              backgroundColor: const Color(0xFF2E3440),
                              child: Text(
                                '${index + 1}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white70),
                              ),
                            ),
                            title: Text(
                              name.toUpperCase(),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            subtitle: Text(
                              'LEVEL $level ARCHMAGE',
                              style: const TextStyle(fontSize: 10, color: Color(0xFF6C63FF), fontWeight: FontWeight.bold),
                            ),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '$xp XP',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                if (streak > 0)
                                  Text(
                                    '🔥 $streak d',
                                    style: const TextStyle(fontSize: 9, color: Colors.orangeAccent),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildPodiumSection() {
    final first = _rankings[0];
    final second = _rankings.length > 1 ? _rankings[1] : null;
    final third = _rankings.length > 2 ? _rankings[2] : null;

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Card(
        color: const Color(0xFF6C63FF).withOpacity(0.08),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // 2nd Place
              if (second != null)
                Expanded(child: _buildPodiumColumn(second, 2, '🥈', const Color(0xFFC0C0C0))),

              // 1st Place
              Expanded(child: _buildPodiumColumn(first, 1, '👑', const Color(0xFFFFD700))),

              // 3rd Place
              if (third != null)
                Expanded(child: _buildPodiumColumn(third, 3, '🥉', const Color(0xFFCD7F32))),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPodiumColumn(Map<String, dynamic> user, int rank, String badge, Color color) {
    final profile = user['profile'] ?? {};
    final name = user['name'] ?? 'Explorer';
    final xp = profile['xp'] ?? 0;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(badge, style: const TextStyle(fontSize: 32)),
        const SizedBox(height: 8),
        CircleAvatar(
          radius: rank == 1 ? 28 : 24,
          backgroundColor: color,
          child: Text(
            name.substring(0, 2).toUpperCase(),
            style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          name.split(' ')[0].toUpperCase(),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
        ),
        Text(
          '$xp XP',
          style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
