import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/roadmap.dart';

class RoadmapState {
  final RoadmapModel? activeRoadmap;
  final bool isLoading;
  final String? error;

  RoadmapState({
    this.activeRoadmap,
    this.isLoading = false,
    this.error,
  });

  RoadmapState copyWith({
    RoadmapModel? activeRoadmap,
    bool? isLoading,
    String? error,
  }) {
    return RoadmapState(
      activeRoadmap: activeRoadmap ?? this.activeRoadmap,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class RoadmapNotifier extends StateNotifier<RoadmapState> {
  RoadmapNotifier() : super(RoadmapState());

  Future<void> fetchRoadmap(String chosenPath) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient.get('/roadmaps');
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final List<dynamic> roadmapsData = body['data'] ?? [];
        if (roadmapsData.isNotEmpty) {
          // Find roadmap matching user's chosen career path, otherwise default to first
          final activeJson = roadmapsData.firstWhere(
            (r) => (r['title'] as String).toLowerCase().contains(chosenPath.toLowerCase()),
            orElse: () => roadmapsData.first,
          );
          final active = RoadmapModel.fromJson(activeJson);
          state = RoadmapState(activeRoadmap: active, isLoading: false);
        } else {
          state = RoadmapState(activeRoadmap: null, isLoading: false);
        }
      } else {
        throw Exception('Failed to load roadmap');
      }
    } catch (e) {
      state = RoadmapState(isLoading: false, error: e.toString());
    }
  }

  Future<void> completeNode(String roadmapId, String nodeId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await ApiClient.put(
        '/roadmaps/$roadmapId/node/$nodeId',
        {'status': 'completed'},
      );
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final updatedRoadmap = RoadmapModel.fromJson(body['data']['roadmap']);
        state = RoadmapState(activeRoadmap: updatedRoadmap, isLoading: false);
      } else {
        final body = jsonDecode(response.body);
        throw Exception(body['message'] ?? 'Failed to complete module');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }
}

final roadmapProvider = StateNotifierProvider<RoadmapNotifier, RoadmapState>((ref) {
  return RoadmapNotifier();
});
