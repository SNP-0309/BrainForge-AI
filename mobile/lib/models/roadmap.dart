class RoadmapNodeModel {
  final String id;
  final String label;
  final String status; // 'locked' | 'available' | 'completed'
  final List<String> dependencies;

  RoadmapNodeModel({
    required this.id,
    required this.label,
    required this.status,
    required this.dependencies,
  });

  factory RoadmapNodeModel.fromJson(Map<String, dynamic> json) {
    return RoadmapNodeModel(
      id: json['id'] ?? '',
      label: json['label'] ?? '',
      status: json['status'] ?? 'locked',
      dependencies: List<String>.from(json['dependencies'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'label': label,
      'status': status,
      'dependencies': dependencies,
    };
  }
}

class RoadmapModel {
  final String id;
  final String title;
  final String description;
  final List<RoadmapNodeModel> nodes;
  final bool isCompleted;

  RoadmapModel({
    required this.id,
    required this.title,
    required this.description,
    required this.nodes,
    required this.isCompleted,
  });

  factory RoadmapModel.fromJson(Map<String, dynamic> json) {
    final List<dynamic> nodeData = json['nodes'] ?? [];
    return RoadmapModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      nodes: nodeData.map((n) => RoadmapNodeModel.fromJson(n)).toList(),
      isCompleted: json['isCompleted'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'description': description,
      'nodes': nodes.map((n) => n.toJson()).toList(),
      'isCompleted': isCompleted,
    };
  }
}
