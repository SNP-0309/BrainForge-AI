import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/course_provider.dart';
import '../models/course.dart';
import 'lesson_screen.dart';

class CoursesScreen extends ConsumerStatefulWidget {
  const CoursesScreen({super.key});

  @override
  ConsumerState<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends ConsumerState<CoursesScreen> {
  final _searchController = TextEditingController();
  String _selectedDifficulty = '';

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(courseProvider.notifier).fetchCourses());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String val) {
    ref.read(courseProvider.notifier).fetchCourses(
          search: val,
          difficulty: _selectedDifficulty,
        );
  }

  void _onDifficultySelected(String diff) {
    setState(() {
      _selectedDifficulty = diff;
    });
    ref.read(courseProvider.notifier).fetchCourses(
          search: _searchController.text.trim(),
          difficulty: diff,
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(courseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('COURSES CATALOG'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
      ),
      body: Column(
        children: [
          // Search & Filters Header
          Padding(
            padding: const EdgeInsets.fromLTRB(24.0, 8.0, 24.0, 16.0),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  controller: _searchController,
                  onChanged: _onSearchChanged,
                  decoration: InputDecoration(
                    hintText: 'Search skills, topics, or creators...',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: const Color(0xFF1E222B),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Difficulty Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildChip('All Levels', ''),
                      const SizedBox(width: 8),
                      _buildChip('Beginner', 'beginner'),
                      const SizedBox(width: 8),
                      _buildChip('Intermediate', 'intermediate'),
                      const SizedBox(width: 8),
                      _buildChip('Advanced', 'advanced'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Course List View
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.courses.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.search_off, size: 48, color: Colors.white54),
                            const SizedBox(height: 12),
                            Text('No courses found', style: TextStyle(color: Colors.white.withOpacity(0.6))),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(24.0, 0, 24.0, 24.0),
                        itemCount: state.courses.length,
                        itemBuilder: (context, index) {
                          final course = state.courses[index];
                          return _buildCourseCard(course);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String value) {
    final isSelected = _selectedDifficulty == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => _onDifficultySelected(value),
      backgroundColor: const Color(0xFF1E222B),
      selectedColor: const Color(0xFF6C63FF).withOpacity(0.24),
      checkmarkColor: const Color(0xFF00E5FF),
      labelStyle: TextStyle(
        color: isSelected ? const Color(0xFF00E5FF) : Colors.white60,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: isSelected ? const Color(0xFF6C63FF) : const Color(0xFF2E3440),
        ),
      ),
    );
  }

  Widget _buildCourseCard(CourseModel course) {
    final diffColor = course.difficulty == 'beginner'
        ? const Color(0xFF4ADE80)
        : course.difficulty == 'intermediate'
            ? const Color(0xFFFFCC00)
            : const Color(0xFFFF5722);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => LessonScreen(course: course),
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Tags & Badges
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFF2E3440)),
                    ),
                    child: Text(
                      course.platform.toUpperCase(),
                      style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: diffColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: diffColor.withOpacity(0.4)),
                    ),
                    child: Text(
                      course.difficulty.toUpperCase(),
                      style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: diffColor, letterSpacing: 0.5),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Title & Instructor
              Text(
                course.instructor.toUpperCase(),
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white.withOpacity(0.5), letterSpacing: 1),
              ),
              const SizedBox(height: 4),
              Text(
                course.title,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, height: 1.3),
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                course.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.65), height: 1.4),
              ),
              const SizedBox(height: 16),

              // Footer Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    course.price > 0 ? '₹${course.price}' : 'FREE',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF4ADE80)),
                  ),
                  if (course.tags.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2E3440),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '#${course.tags[0]}',
                        style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white70),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
