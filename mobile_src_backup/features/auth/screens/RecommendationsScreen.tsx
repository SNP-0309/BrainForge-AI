import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalButton } from '../../../components/BrutalButton';

interface Recommendation {
  title: string;
  matchPercentage: number;
  whyItFits: string;
  requiredSkills: string[];
  averageDuration: string;
  opportunities: string[];
  difficulty: string;
  salaryPotential: string;
}

const cardColors = ['#4ADE80', '#E9D5FF', '#FFAED7'];

export default function RecommendationsScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [selectingPath, setSelectingPath] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/users/me');
      const userData = res.data.data;
      if (!userData.profile?.assessmentCompleted || !userData.profile?.assessmentRecommendations?.length) {
        navigation.replace('Assessment');
        return;
      }
      setRecommendations(userData.profile.assessmentRecommendations);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleSelectPath = async (pathTitle: string) => {
    setSelectingPath(pathTitle);
    try {
      await api.post('/career/select', { careerPath: pathTitle });
      navigation.replace('Main');
    } catch (err) {
      console.error('Failed to select career path:', err);
    } finally {
      setSelectingPath(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>AI is analyzing your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>✦ AI RECOMMENDATIONS</Text>
        </View>
        <Text style={styles.headerTitle}>YOUR CAREER{'\n'}MATCHES</Text>
        <Text style={styles.headerSubtitle}>
          Based on your interests and background, our AI selected the best career paths for you.
        </Text>
      </Animated.View>

      {/* Recommendation Cards */}
      {recommendations.map((rec, idx) => {
        const isExpanded = expandedIndex === idx;
        const cardBg = cardColors[idx % cardColors.length];

        return (
          <Animated.View
            key={rec.title}
            entering={FadeInDown.delay(100 + idx * 80).springify()}
            style={styles.recCard}
          >
            {/* Card Header - Always visible */}
            <TouchableOpacity
              onPress={() => setExpandedIndex(isExpanded ? null : idx)}
              style={[styles.recHeader, { backgroundColor: cardBg }]}
              activeOpacity={0.85}
            >
              <View style={styles.recHeaderLeft}>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recMatch}>MATCH: {rec.matchPercentage}%</Text>
              </View>
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>{rec.matchPercentage}%</Text>
              </View>
            </TouchableOpacity>

            {/* Expanded Details */}
            {isExpanded && (
              <View style={styles.recBody}>
                <Text style={styles.sectionLabel}>WHY IT FITS YOU</Text>
                <View style={styles.whyFitsBox}>
                  <Text style={styles.whyFitsText}>{rec.whyItFits}</Text>
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>DURATION</Text>
                    <Text style={styles.statValue}>{rec.averageDuration}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>DIFFICULTY</Text>
                    <Text style={styles.statValue}>{rec.difficulty}</Text>
                  </View>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>SALARY POTENTIAL</Text>
                  <Text style={styles.statValue}>{rec.salaryPotential}</Text>
                </View>

                {/* Skills */}
                <Text style={styles.sectionLabel}>REQUIRED SKILLS</Text>
                <View style={styles.pillsRow}>
                  {rec.requiredSkills?.map((skill) => (
                    <View key={skill} style={styles.skillPill}>
                      <Text style={styles.pillText}>{skill}</Text>
                    </View>
                  ))}
                </View>

                {/* Opportunities */}
                <Text style={styles.sectionLabel}>CAREER ROLES</Text>
                <View style={styles.pillsRow}>
                  {rec.opportunities?.map((role) => (
                    <View key={role} style={[styles.skillPill, styles.rolePill]}>
                      <Text style={styles.pillText}>{role}</Text>
                    </View>
                  ))}
                </View>

                {/* Accept Button */}
                <BrutalButton
                  onPress={() => handleSelectPath(rec.title)}
                  bg={cardBg}
                  disabled={selectingPath !== null}
                  style={styles.acceptButton}
                >
                  {selectingPath === rec.title ? (
                    <ActivityIndicator color="#000000" size="small" />
                  ) : (
                    `Accept & Start Roadmap →`
                  )}
                </BrutalButton>
              </View>
            )}
          </Animated.View>
        );
      })}

      {/* Skip option */}
      <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.skipContainer}>
        <Text style={styles.skipText}>
          Want to choose manually?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.replace('Main')}>
          <Text style={styles.skipLink}>Skip & Explore →</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF6',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF6',
    gap: 16,
  },
  loadingText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  header: {
    marginBottom: 28,
    marginTop: 8,
  },
  headerBadge: {
    backgroundColor: '#FFE600',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  headerBadgeText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 32,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 38,
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#000000',
    fontWeight: '600',
    opacity: 0.7,
    fontSize: 13,
    lineHeight: 19,
  },
  recCard: {
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    // Brutalist hard shadow
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  recHeaderLeft: {
    flex: 1,
  },
  recTitle: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recMatch: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  matchBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 14,
  },
  recBody: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1.5,
    opacity: 0.5,
    marginTop: 4,
  },
  whyFitsBox: {
    backgroundColor: '#FFFDF6',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    padding: 12,
  },
  whyFitsText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFDF6',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 10,
    padding: 10,
  },
  statLabel: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 9,
    opacity: 0.5,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  statValue: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  skillPill: {
    backgroundColor: '#FFE600',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rolePill: {
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 11,
  },
  acceptButton: {
    marginTop: 8,
  },
  skipContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  skipText: {
    color: '#000000',
    fontWeight: '600',
    opacity: 0.65,
    fontSize: 13,
  },
  skipLink: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
