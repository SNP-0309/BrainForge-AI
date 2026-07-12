import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../providers/roadmap_provider.dart';
import '../models/roadmap.dart';

class RoadmapScreen extends ConsumerStatefulWidget {
  const RoadmapScreen({super.key});

  @override
  ConsumerState<RoadmapScreen> createState() => _RoadmapScreenState();
}

class _RoadmapScreenState extends ConsumerState<RoadmapScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final user = ref.read(authProvider).user;
      final chosenPath = user?.profile.chosenCareerPath ?? '';
      ref.read(roadmapProvider.notifier).fetchRoadmap(chosenPath);
    });
  }

  void _showNodeDetails(RoadmapModel roadmap, RoadmapNodeModel node) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E222B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Consumer(
          builder: (context, ref, _) {
            final activeRoadmap = ref.watch(roadmapProvider).activeRoadmap;
            final currentNode = activeRoadmap?.nodes.firstWhere((n) => n.id == node.id) ?? node;
            final isCompleted = currentNode.status == 'completed';
            final isAvailable = currentNode.status == 'available';
            final isLocked = currentNode.status == 'locked';

            final statusColor = isCompleted
                ? const Color(0xFF4ADE80)
                : isAvailable
                    ? const Color(0xFF00E5FF)
                    : Colors.white54;

            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: statusColor.withOpacity(0.4)),
                        ),
                        child: Text(
                          currentNode.status.toUpperCase(),
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: statusColor, letterSpacing: 0.5),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white54),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    currentNode.label,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  // Status Info Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? const Color(0xFF4ADE80).withOpacity(0.08)
                          : isAvailable
                              ? const Color(0xFF00E5FF).withOpacity(0.08)
                              : Colors.white.withOpacity(0.02),
                      border: Border.all(
                        color: isCompleted
                            ? const Color(0xFF4ADE80).withOpacity(0.2)
                            : isAvailable
                                ? const Color(0xFF00E5FF).withOpacity(0.2)
                                : const Color(0xFF2E3440),
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isCompleted
                          ? '🎉 Module Completed! Study materials, cheat sheets, and practice challenges are fully unlocked.'
                          : isAvailable
                              ? '📖 This module is ready to learn. Complete self-study, then check the completion button below!'
                              : '🔒 You must complete all previous dependency modules before you can unlock this topic.',
                      style: const TextStyle(fontSize: 13, height: 1.4),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // AI Tools List (If completed)
                  if (isCompleted) ...[
                    const Text('🤖 UNLOCKED AI STUDY TOOLS', style: TextStyle(fontSize: 10, letterSpacing: 1, color: Colors.white54, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    _buildToolTile('📄 AI Cheat Sheet', 'Generated study summary'),
                    const SizedBox(height: 8),
                    _buildToolTile('🧠 Quiz generator', '5 AI practice questions'),
                    const SizedBox(height: 24),
                  ],

                  // Action Button
                  if (isAvailable)
                    ElevatedButton(
                      onPressed: () async {
                        try {
                          await ref.read(roadmapProvider.notifier).completeNode(roadmap.id, node.id);
                          if (context.mounted) Navigator.pop(context);
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Failed to complete: $e'), backgroundColor: Colors.redAccent),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4ADE80),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('MARK MODULE AS COMPLETED', style: TextStyle(fontWeight: FontWeight.bold)),
                    )
                  else if (isLocked)
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2E3440),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        '🔒 COMPLETE PREVIOUS MODULES',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white38, fontSize: 13),
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildToolTile(String label, String desc) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        border: Border.all(color: const Color(0xFF2E3440)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 2),
              Text(desc, style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.5))),
            ],
          ),
          const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF00E5FF)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(roadmapProvider);

    if (state.isLoading && state.activeRoadmap == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final roadmap = state.activeRoadmap;
    if (roadmap == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('CAREER ROADMAP'),
          centerTitle: true,
          backgroundColor: Colors.transparent,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.map_outlined, size: 64, color: Colors.white30),
                const SizedBox(height: 16),
                const Text(
                  'No Roadmap Found',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Please complete your Career Discovery Assessment in the dashboard to generate your career path.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white.withOpacity(0.6), height: 1.4),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final completedCount = roadmap.nodes.where((n) => n.status == 'completed').length;
    final totalCount = roadmap.nodes.length;
    final progress = totalCount > 0 ? completedCount / totalCount : 0.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('CAREER ROADMAP'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
      ),
      body: Column(
        children: [
          // Roadmap Header Progress Card
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              color: const Color(0xFF6C63FF).withOpacity(0.12),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('ACTIVE PATHWAY', style: TextStyle(fontSize: 10, letterSpacing: 1.5, color: Colors.white60)),
                    const SizedBox(height: 4),
                    Text(roadmap.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('$completedCount/$totalCount modules done', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        Text('${(progress * 100).round()}% Completed', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF00E5FF))),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: progress,
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

          // Learning path vertical timeline
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              itemCount: roadmap.nodes.length,
              itemBuilder: (context, index) {
                final node = roadmap.nodes[index];
                final isCompleted = node.status == 'completed';
                final isAvailable = node.status == 'available';
                final isLocked = node.status == 'locked';

                final nodeColor = isCompleted
                    ? const Color(0xFF4ADE80)
                    : isAvailable
                        ? const Color(0xFFFFCC00)
                        : const Color(0xFF2E3440);

                return Stack(
                  children: [
                    // Vertical rail indicator
                    if (index < roadmap.nodes.length - 1)
                      Positioned(
                        left: 20,
                        top: 28,
                        bottom: 0,
                        width: 3,
                        child: Container(color: const Color(0xFF2E3440)),
                      ),

                    Padding(
                      padding: const EdgeInsets.only(bottom: 18.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Index Node Circle
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: isCompleted ? const Color(0xFF4ADE80) : const Color(0xFF1E222B),
                              border: Border.all(
                                color: isLocked ? const Color(0xFF2E3440) : nodeColor,
                                width: 2,
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: isCompleted
                                  ? const Icon(Icons.check, color: Colors.black, size: 20)
                                  : Text(
                                      '${index + 1}',
                                      style: TextStyle(
                                        color: isLocked ? Colors.white30 : Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(width: 16),

                          // Node Description Card
                          Expanded(
                            child: Card(
                              color: isLocked
                                  ? const Color(0xFF1E222B).withOpacity(0.5)
                                  : isAvailable
                                      ? const Color(0xFF6C63FF).withOpacity(0.1)
                                      : const Color(0xFF1E222B),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: BorderSide(
                                  color: isLocked
                                      ? const Color(0xFF2E3440)
                                      : isAvailable
                                          ? const Color(0xFF6C63FF)
                                          : const Color(0xFF2E3440),
                                  width: 1.2,
                                ),
                              ),
                              child: ListTile(
                                enabled: !isLocked,
                                title: Text(
                                  node.label.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: isLocked ? Colors.white30 : Colors.white,
                                  ),
                                ),
                                subtitle: Padding(
                                  padding: const EdgeInsets.only(top: 4.0),
                                  child: Text(
                                    isCompleted
                                        ? 'COMPLETED'
                                        : isAvailable
                                            ? 'ACTIVE'
                                            : 'LOCKED',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: isCompleted
                                          ? const Color(0xFF4ADE80)
                                          : isAvailable
                                              ? const Color(0xFF00E5FF)
                                              : Colors.white30,
                                    ),
                                  ),
                                ),
                                trailing: isLocked
                                    ? const Icon(Icons.lock, size: 16, color: Colors.white30)
                                    : const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.white70),
                                onTap: () => _showNodeDetails(roadmap, node),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
