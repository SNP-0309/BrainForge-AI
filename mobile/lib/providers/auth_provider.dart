import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_client.dart';
import '../models/user.dart';

class AuthState {
  final UserModel? user;
  final String? token;
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  AuthState({
    this.user,
    this.token,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    UserModel? user,
    String? token,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState(isLoading: true)) {
    initialize();
  }

  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final userJson = prefs.getString('auth_user');

      if (token != null && userJson != null) {
        final userMap = jsonDecode(userJson);
        final user = UserModel.fromJson(userMap);
        state = AuthState(
          user: user,
          token: token,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        state = AuthState(isAuthenticated: false, isLoading: false);
      }
    } catch (e) {
      state = AuthState(isAuthenticated: false, isLoading: false);
    }
  }

  Future<void> login(String email) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final username = email.split('@')[0];
      const role = 'student';
      final mockToken = 'mock-$role-$username';

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', mockToken);

      final response = await ApiClient.post('/auth/sync', {});
      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = jsonDecode(response.body);
        final userData = body['data']['user'];
        final user = UserModel.fromJson(userData);

        await prefs.setString('auth_user', jsonEncode(userData));
        state = AuthState(
          user: user,
          token: mockToken,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        final body = jsonDecode(response.body);
        throw Exception(body['message'] ?? 'Authentication failed');
      }
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      state = AuthState(isLoading: false, error: e.toString().replaceFirst('Exception: ', ''));
      rethrow;
    }
  }

  Future<void> register(String name, String email) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final username = email.split('@')[0];
      const role = 'student';
      final mockToken = 'mock-$role-$username';

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', mockToken);

      final response = await ApiClient.post('/auth/sync', {});
      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = jsonDecode(response.body);
        var userData = body['data']['user'];
        var user = UserModel.fromJson(userData);

        // Update name if customized
        if (name.isNotEmpty && name != user.name) {
          final updateResponse = await ApiClient.put('/users/me', {'name': name});
          if (updateResponse.statusCode == 200) {
            final updateBody = jsonDecode(updateResponse.body);
            userData = updateBody['data'];
            user = UserModel.fromJson(userData);
          }
        }

        await prefs.setString('auth_user', jsonEncode(userData));
        state = AuthState(
          user: user,
          token: mockToken,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        final body = jsonDecode(response.body);
        throw Exception(body['message'] ?? 'Registration failed');
      }
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      state = AuthState(isLoading: false, error: e.toString().replaceFirst('Exception: ', ''));
      rethrow;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_user');
    state = AuthState(user: null, token: null, isAuthenticated: false, isLoading: false);
  }

  void updateUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_user', jsonEncode(user.toJson()));
    state = state.copyWith(user: user);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
