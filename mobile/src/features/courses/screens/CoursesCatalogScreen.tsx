import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalButton } from '../../../components/BrutalButton';
import api from '../../../services/api';

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  platform: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  tags: string[];
  buyUrl?: string;
  thumbnail?: string;
}

const DIFFICULTY_COLORS = {
  beginner: '#4ADE80',
  intermediate: '#FFE600',
  advanced: '#F87171',
};

export default function CoursesCatalogScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses', {
        params: {
          search,
          difficulty: selectedDifficulty || undefined,
          limit: 20,
        },
      });
      // The API return format is { success: true, message: ..., data: { courses: [...] } }
      // Or simply { data: [...] }
      const fetched = res.data.data?.courses || res.data.data || [];
      setCourses(fetched);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDifficulty]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleOpenCourse = (url?: string) => {
    const targetUrl = url || 'https://www.udemy.com';
    Linking.openURL(targetUrl).catch((err) =>
      console.error('An error occurred linking to course:', err)
    );
  };

  const CARD_COLORS = ['#FFE600', '#4ADE80', '#FFAED7', '#E9D5FF'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Description header */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <BrutalCard bg="#E9D5FF" style={styles.introCard}>
          <Text style={styles.introTitle}>✦ Expert-Curated Courses ✦</Text>
          <Text style={styles.introText}>
            Hand-picked tutorials, bootcamps, and resources to help you master new technical skills fast.
          </Text>
        </BrutalCard>
      </Animated.View>

      {/* Search Input */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.searchContainer}>
        <View style={styles.searchShadow} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search courses, instructors, or topics..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
      </Animated.View>

      {/* Filter Chips */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.filterRow}>
        {[
          { label: 'All Levels', value: '' },
          { label: 'Beginner', value: 'beginner' },
          { label: 'Intermediate', value: 'intermediate' },
          { label: 'Advanced', value: 'advanced' },
        ].map((item) => {
          const isSelected = selectedDifficulty === item.value;
          return (
            <TouchableOpacity
              key={item.label}
              onPress={() => setSelectedDifficulty(item.value)}
              style={[
                styles.chip,
                isSelected && styles.chipActive,
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Courses List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#000" size="large" />
          <Text style={styles.loaderText}>Searching catalog...</Text>
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No Courses Found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your search criteria or checking back later.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {courses.map((course, idx) => {
            const randomColor = CARD_COLORS[course.title.charCodeAt(0) % CARD_COLORS.length];
            const diffColor = DIFFICULTY_COLORS[course.difficulty] || '#E5E7EB';
            return (
              <Animated.View
                key={course._id}
                entering={FadeInDown.delay(250 + idx * 50).springify()}
                style={styles.cardContainer}
              >
                <BrutalCard bg="#FFFFFF" style={styles.courseCard}>
                  {/* Category Banner Accent */}
                  <View style={[styles.accentBanner, { backgroundColor: randomColor }]} />
                  
                  {/* Badges */}
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: '#000000' }]}>
                      <Text style={styles.badgeTextWhite}>{course.platform || 'Udemy'}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: diffColor }]}>
                      <Text style={styles.badgeTextBlack}>{course.difficulty}</Text>
                    </View>
                  </View>

                  {/* Course Details */}
                  <Text style={styles.instructorText}>{course.instructor}</Text>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseDesc} numberOfLines={3}>
                    {course.description}
                  </Text>

                  {/* Price and Tags */}
                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>
                      {course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'FREE'}
                    </Text>
                    <View style={styles.tagsContainer}>
                      {course.tags?.slice(0, 2).map((t) => (
                        <View key={t} style={styles.tag}>
                          <Text style={styles.tagText}>#{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <BrutalButton
                    onPress={() => handleOpenCourse(course.buyUrl)}
                    bg={randomColor}
                    style={styles.actionBtn}
                  >
                    Start Learning ↗
                  </BrutalButton>
                </BrutalCard>
              </Animated.View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
  content: { padding: 20, paddingBottom: 40 },
  introCard: { marginBottom: 20 },
  introTitle: { fontWeight: '900', fontSize: 15, textTransform: 'uppercase', color: '#000', marginBottom: 4, letterSpacing: 0.5 },
  introText: { fontWeight: '600', fontSize: 12, color: '#000', opacity: 0.7, lineHeight: 18 },

  searchContainer: { position: 'relative', marginBottom: 16 },
  searchShadow: { position: 'absolute', top: 3, left: 3, right: -3, bottom: -3, backgroundColor: '#000', borderRadius: 10 },
  searchInput: {
    backgroundColor: '#FFF',
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },

  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 24 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#FFF',
  },
  chipActive: {
    backgroundColor: '#000',
  },
  chipText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', color: '#000', letterSpacing: 0.3 },
  chipTextActive: { color: '#FFF' },

  loaderContainer: { paddingVertical: 48, alignItems: 'center' },
  loaderText: { marginTop: 12, fontWeight: '700', color: '#000', fontSize: 11, textTransform: 'uppercase' },

  emptyContainer: { paddingVertical: 48, alignItems: 'center' },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase', color: '#000' },
  emptyText: { fontWeight: '600', fontSize: 12, color: '#000', opacity: 0.5, marginTop: 4, textAlign: 'center', maxWidth: 240 },

  grid: { gap: 18 },
  cardContainer: { width: '100%' },
  courseCard: { padding: 0, overflow: 'hidden' },
  accentBanner: { height: 10, width: '100%', borderBottomWidth: 2.5, borderColor: '#000' },
  badgeRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 14 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  badgeTextWhite: { color: '#FFF', fontWeight: '900', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeTextBlack: { color: '#000', fontWeight: '900', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  instructorText: { paddingHorizontal: 16, paddingTop: 10, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', color: '#000', opacity: 0.5, letterSpacing: 0.8 },
  courseTitle: { paddingHorizontal: 16, paddingTop: 4, fontSize: 15, fontWeight: '900', textTransform: 'uppercase', color: '#000', lineHeight: 20 },
  courseDesc: { paddingHorizontal: 16, paddingTop: 6, fontSize: 12, fontWeight: '600', color: '#000', opacity: 0.7, lineHeight: 18 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  priceText: { fontWeight: '900', fontSize: 16, color: '#000' },
  tagsContainer: { flexDirection: 'row', gap: 4 },
  tag: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#000', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 8, fontWeight: '800', color: '#000', textTransform: 'uppercase' },

  actionBtn: { marginHorizontal: 16, marginBottom: 16 },
});
