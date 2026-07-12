class LessonModel {
  final String id;
  final String courseId;
  final String title;
  final String content;
  final String videoUrl;
  final int order;
  final int estimatedTime;

  LessonModel({
    required this.id,
    required this.courseId,
    required this.title,
    required this.content,
    required this.videoUrl,
    required this.order,
    required this.estimatedTime,
  });

  factory LessonModel.fromJson(Map<String, dynamic> json) {
    return LessonModel(
      id: json['_id'] ?? '',
      courseId: json['course'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      videoUrl: json['videoUrl'] ?? '',
      order: json['order'] ?? 1,
      estimatedTime: json['estimatedTime'] ?? 15,
    );
  }
}
