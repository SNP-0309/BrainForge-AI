class UserModel {
  final String id;
  final String firebaseUid;
  final String name;
  final String email;
  final String role;
  final UserProfile profile;

  UserModel({
    required this.id,
    required this.firebaseUid,
    required this.name,
    required this.email,
    required this.role,
    required this.profile,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? '',
      firebaseUid: json['firebaseUid'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'student',
      profile: UserProfile.fromJson(json['profile'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'firebaseUid': firebaseUid,
      'name': name,
      'email': email,
      'role': role,
      'profile': profile.toJson(),
    };
  }

  UserModel copyWith({
    String? id,
    String? firebaseUid,
    String? name,
    String? email,
    String? role,
    UserProfile? profile,
  }) {
    return UserModel(
      id: id ?? this.id,
      firebaseUid: firebaseUid ?? this.firebaseUid,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      profile: profile ?? this.profile,
    );
  }
}

class UserProfile {
  final String avatar;
  final int xp;
  final int level;
  final int coins;
  final int dailyStreak;
  final String chosenCareerPath;
  final bool assessmentCompleted;
  final List<dynamic> assessmentRecommendations;

  UserProfile({
    required this.avatar,
    required this.xp,
    required this.level,
    required this.coins,
    required this.dailyStreak,
    required this.chosenCareerPath,
    required this.assessmentCompleted,
    required this.assessmentRecommendations,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      avatar: json['avatar'] ?? '',
      xp: json['xp'] ?? 0,
      level: json['level'] ?? 1,
      coins: json['coins'] ?? 0,
      dailyStreak: json['dailyStreak'] ?? 0,
      chosenCareerPath: json['chosenCareerPath'] ?? '',
      assessmentCompleted: json['assessmentCompleted'] ?? false,
      assessmentRecommendations: json['assessmentRecommendations'] ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'avatar': avatar,
      'xp': xp,
      'level': level,
      'coins': coins,
      'dailyStreak': dailyStreak,
      'chosenCareerPath': chosenCareerPath,
      'assessmentCompleted': assessmentCompleted,
      'assessmentRecommendations': assessmentRecommendations,
    };
  }

  UserProfile copyWith({
    String? avatar,
    int? xp,
    int? level,
    int? coins,
    int? dailyStreak,
    String? chosenCareerPath,
    bool? assessmentCompleted,
    List<dynamic>? assessmentRecommendations,
  }) {
    return UserProfile(
      avatar: avatar ?? this.avatar,
      xp: xp ?? this.xp,
      level: level ?? this.level,
      coins: coins ?? this.coins,
      dailyStreak: dailyStreak ?? this.dailyStreak,
      chosenCareerPath: chosenCareerPath ?? this.chosenCareerPath,
      assessmentCompleted: assessmentCompleted ?? this.assessmentCompleted,
      assessmentRecommendations: assessmentRecommendations ?? this.assessmentRecommendations,
    );
  }
}
