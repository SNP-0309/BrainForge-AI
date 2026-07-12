import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
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
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;

  AuthNotifier() : super(AuthState(isLoading: true)) {
    initialize();
  }

  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final userJson = prefs.getString('auth_user');

      // Try to restore Firebase session
      final firebaseUser = _firebaseAuth.currentUser;
      if (firebaseUser != null && token != null && userJson != null) {
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

  /// Syncs Firebase token with the backend and stores the user
  Future<void> _syncWithBackend(User firebaseUser) async {
    // Get the Firebase ID token to send to our backend
    final idToken = await firebaseUser.getIdToken();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', idToken!);

    final response = await ApiClient.post('/auth/sync', {});
    if (response.statusCode == 200 || response.statusCode == 201) {
      final body = jsonDecode(response.body);
      final userData = body['data']['user'];
      final user = UserModel.fromJson(userData);

      await prefs.setString('auth_user', jsonEncode(userData));
      state = AuthState(
        user: user,
        token: idToken,
        isAuthenticated: true,
        isLoading: false,
      );
    } else {
      final body = jsonDecode(response.body);
      throw Exception(body['message'] ?? 'Backend sync failed');
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final credential = await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      await _syncWithBackend(credential.user!);
    } on FirebaseAuthException catch (e) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      final message = _firebaseErrorMessage(e.code);
      state = AuthState(isLoading: false, error: message);
      throw Exception(message);
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      state = AuthState(isLoading: false, error: e.toString().replaceFirst('Exception: ', ''));
      rethrow;
    }
  }

  Future<void> loginWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      UserCredential credential;
      if (kIsWeb) {
        final provider = GoogleAuthProvider();
        credential = await _firebaseAuth.signInWithPopup(provider);
      } else {
        final provider = GoogleAuthProvider();
        credential = await _firebaseAuth.signInWithProvider(provider);
      }
      await _syncWithBackend(credential.user!);
    } on FirebaseAuthException catch (e) {
      final message = _firebaseErrorMessage(e.code);
      state = AuthState(isLoading: false, error: message);
      throw Exception(message);
    } catch (e) {
      state = AuthState(isLoading: false, error: e.toString().replaceFirst('Exception: ', ''));
      rethrow;
    }
  }

  Future<void> loginWithGithub() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final provider = GithubAuthProvider();
      UserCredential credential;
      if (kIsWeb) {
        credential = await _firebaseAuth.signInWithPopup(provider);
      } else {
        credential = await _firebaseAuth.signInWithProvider(provider);
      }
      await _syncWithBackend(credential.user!);
    } on FirebaseAuthException catch (e) {
      final message = _firebaseErrorMessage(e.code);
      state = AuthState(isLoading: false, error: message);
      throw Exception(message);
    } catch (e) {
      state = AuthState(isLoading: false, error: e.toString().replaceFirst('Exception: ', ''));
      rethrow;
    }
  }

  Future<void> register(String name, String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final credential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      // Set display name in Firebase
      await credential.user!.updateDisplayName(name);
      await _syncWithBackend(credential.user!);
    } on FirebaseAuthException catch (e) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      final message = _firebaseErrorMessage(e.code);
      state = AuthState(isLoading: false, error: message);
      throw Exception(message);
    } catch (e) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      state = AuthState(isLoading: false, error: e.toString().replaceFirst('Exception: ', ''));
      rethrow;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    await _firebaseAuth.signOut();
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

  String _firebaseErrorMessage(String code) {
    switch (code) {
      case 'user-not-found':
        return 'No account found with this email.';
      case 'wrong-password':
        return 'Incorrect password. Please try again.';
      case 'email-already-in-use':
        return 'An account with this email already exists.';
      case 'weak-password':
        return 'Password must be at least 6 characters.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'network-request-failed':
        return 'Network error. Check your connection.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
