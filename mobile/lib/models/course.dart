class CourseModel {
  final String id;
  final String title;
  final String description;
  final String instructor;
  final String platform;
  final String difficulty;
  final int price;
  final List<String> tags;
  final String buyUrl;
  final String thumbnail;

  CourseModel({
    required this.id,
    required this.title,
    required this.description,
    required this.instructor,
    required this.platform,
    required this.difficulty,
    required this.price,
    required this.tags,
    required this.buyUrl,
    required this.thumbnail,
  });

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    return CourseModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      instructor: json['instructor'] ?? 'Unknown',
      platform: json['platform'] ?? 'Web',
      difficulty: json['difficulty'] ?? 'beginner',
      price: json['price'] ?? 0,
      tags: List<String>.from(json['tags'] ?? []),
      buyUrl: json['buyUrl'] ?? '',
      thumbnail: json['thumbnail'] ?? '',
    );
  }
}
