import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/course.dart';
import '../models/lesson.dart';

class CourseState {
  final List<CourseModel> courses;
  final List<LessonModel> lessons;
  final bool isLoading;
  final String? error;

  CourseState({
    this.courses = const [],
    this.lessons = const [],
    this.isLoading = false,
    this.error,
  });

  CourseState copyWith({
    List<CourseModel>? courses,
    List<LessonModel>? lessons,
    bool? isLoading,
    String? error,
  }) {
    return CourseState(
      courses: courses ?? this.courses,
      lessons: lessons ?? this.lessons,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class CourseNotifier extends StateNotifier<CourseState> {
  CourseNotifier() : super(CourseState());

  Future<void> fetchCourses({String search = '', String difficulty = ''}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      String query = '?limit=100';
      if (search.isNotEmpty) {
        query += '&search=${Uri.encodeComponent(search)}';
      }
      if (difficulty.isNotEmpty) {
        query += '&difficulty=$difficulty';
      }

      final response = await ApiClient.get('/courses$query');
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final List<dynamic> courseData = body['data']['courses'] ?? body['data'] ?? [];
        final courses = courseData.map((c) => CourseModel.fromJson(c)).toList();
        state = state.copyWith(courses: courses, isLoading: false);
      } else {
        throw Exception('Failed to load courses');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> fetchLessons(String courseId) async {
    state = state.copyWith(isLoading: true, error: null, lessons: []);
    try {
      final response = await ApiClient.get('/courses/$courseId/lessons');
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final List<dynamic> lessonData = body['data']['lessons'] ?? body['data'] ?? [];
        final lessons = lessonData.map((l) => LessonModel.fromJson(l)).toList();
        state = state.copyWith(lessons: lessons, isLoading: false);
      } else {
        throw Exception('Failed to load lessons');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<Map<String, dynamic>> completeLesson(String lessonId) async {
    try {
      final response = await ApiClient.post('/lessons/$lessonId/complete', {});
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        return body['data'] ?? {};
      } else {
        final body = jsonDecode(response.body);
        throw Exception(body['message'] ?? 'Failed to complete lesson');
      }
    } catch (e) {
      rethrow;
    }
  }
}

final courseProvider = StateNotifierProvider<CourseNotifier, CourseState>((ref) {
  return CourseNotifier();
});
