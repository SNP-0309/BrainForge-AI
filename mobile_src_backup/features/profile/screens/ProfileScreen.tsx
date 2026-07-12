import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalButton } from '../../../components/BrutalButton';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';

interface UserAchievement {
  _id: string;
  achievement: {
    _id: string;
    title: string;
    description: string;
    icon: string; // Emoji
    xpReward: number;
    coinsReward: number;
  };
  unlockedAt: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await api.get('/achievements/me');
      setUnlocked(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch user achievements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const username = user?.name || 'Explorer';
  const email = user?.email || '';
  const role = user?.role || 'student';
  const xp = user?.profile?.xp ?? 0;
  const level = user?.profile?.level ?? 1;
  const coins = user?.profile?.coins ?? 0;
  const streak = user?.profile?.dailyStreak ?? 1;
  const chosenPath = user?.profile?.chosenCareerPath;

  // XP progression calculation (e.g. 100 XP per level)
  const xpInCurrentLevel = xp % 100;
  const nextLevelXp = 100;
  const xpProgressPct = Math.min((xpInCurrentLevel / nextLevelXp) * 100, 100);

  const handleShowBadgeDetails = (badge: UserAchievement) => {
    Alert.alert(
      `${badge.achievement.icon} ${badge.achievement.title}`,
      `${badge.achievement.description}\n\nRewarded: +${badge.achievement.xpReward} XP, +${badge.achievement.coinsReward} Coins\nUnlocked on: ${new Date(badge.unlockedAt).toLocaleDateString()}`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Profile Card */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <BrutalCard bg="#FFFFFF" style={styles.profileCard}>
          <View style={styles.headerRow}>
            <Avatar.Text
              size={64}
              label={username.substring(0, 2).toUpperCase()}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.nameText}>{username}</Text>
              <Text style={styles.emailText}>{email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{role.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Level Progress */}
          <View style={styles.xpSection}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>Level {level}</Text>
              <Text style={styles.xpValue}>{xpInCurrentLevel}/{nextLevelXp} XP</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${xpProgressPct}%` as any }]} />
            </View>
          </View>
        </BrutalCard>
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.statsGrid}>
        <BrutalCard bg="#FFE600" style={styles.statCard} contentStyle={styles.statContent}>
          <Text style={styles.statLabel}>STREAK</Text>
          <Text style={styles.statVal}>🔥 {streak}d</Text>
        </BrutalCard>
        <BrutalCard bg="#FFAED7" style={styles.statCard} contentStyle={styles.statContent}>
          <Text style={styles.statLabel}>COINS</Text>
          <Text style={styles.statVal}>🪙 {coins}</Text>
        </BrutalCard>
        <BrutalCard bg="#4ADE80" style={styles.statCard} contentStyle={styles.statContent}>
          <Text style={styles.statLabel}>TOTAL XP</Text>
          <Text style={styles.statVal}>✨ {xp}</Text>
        </BrutalCard>
      </Animated.View>

      {/* Active Path */}
      <Animated.View entering={FadeInDown.delay(220).springify()}>
        <BrutalCard bg="#E9D5FF" style={styles.pathCard}>
          <Text style={styles.pathLabel}>CHOSEN PATH</Text>
          <Text style={styles.pathTitle}>{chosenPath || 'No Career Path Chosen Yet'}</Text>
          {chosenPath ? (
            <Text style={styles.pathDesc}>
              Track your daily learning objectives and courses on the Roadmap tab!
            </Text>
          ) : (
            <Text style={styles.pathDesc}>
              Complete the Career Discovery Assessment to receive tailored recommendations.
            </Text>
          )}
        </BrutalCard>
      </Animated.View>

      {/* Achievements / Badges Section */}
      <Animated.View entering={FadeInDown.delay(280).springify()}>
        <Text style={styles.sectionTitle}>🏆 Unlocked Badges ({unlocked.length})</Text>
        {loading ? (
          <ActivityIndicator color="#000" style={styles.loadingBadges} />
        ) : unlocked.length === 0 ? (
          <BrutalCard bg="#FFFFFF" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No badges unlocked yet. Start completing quizzes or missions to unlock awards!</Text>
          </BrutalCard>
        ) : (
          <View style={styles.badgeGrid}>
            {unlocked.map((badge, idx) => (
              <Animated.View
                key={badge._id}
                entering={FadeInDown.delay(300 + idx * 40).springify()}
                style={styles.badgeItemWrapper}
              >
                <TouchableOpacity
                  onPress={() => handleShowBadgeDetails(badge)}
                  style={styles.badgeItem}
                  activeOpacity={0.8}
                >
                  <Text style={styles.badgeIcon}>{badge.achievement.icon || '🏅'}</Text>
                  <Text style={styles.badgeTitle} numberOfLines={1}>
                    {badge.achievement.title}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Logout */}
      <Animated.View entering={FadeInDown.delay(350).springify()}>
        <BrutalButton onPress={logout} bg="#FF8B8B" style={styles.logoutBtn}>
          Sign Out / Clear Session
        </BrutalButton>
      </Animated.View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
  content: { padding: 20, paddingBottom: 40 },

  profileCard: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { backgroundColor: '#FFE600', borderWidth: 2.5, borderColor: '#000' },
  avatarLabel: { color: '#000', fontWeight: '900' },
  headerInfo: { flex: 1 },
  nameText: { fontWeight: '900', fontSize: 20, textTransform: 'uppercase', color: '#000', letterSpacing: 0.5 },
  emailText: { fontWeight: '700', fontSize: 12, color: '#000', opacity: 0.6, marginTop: 1 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE600',
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  roleText: { fontSize: 8, fontWeight: '900', color: '#000', letterSpacing: 0.8 },

  xpSection: { marginTop: 16 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  xpLabel: { fontWeight: '900', fontSize: 11, color: '#000', textTransform: 'uppercase' },
  xpValue: { fontWeight: '800', fontSize: 11, color: '#000' },
  progressBarBg: { height: 10, backgroundColor: '#00000020', borderRadius: 6, borderWidth: 1.5, borderColor: '#000', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4ADE80', borderRadius: 4 },

  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1 },
  statContent: { alignItems: 'center', paddingVertical: 12 },
  statLabel: { fontWeight: '900', fontSize: 8, color: '#000', opacity: 0.6, letterSpacing: 0.8 },
  statVal: { fontWeight: '900', fontSize: 15, color: '#000', marginTop: 3 },

  pathCard: { marginBottom: 24 },
  pathLabel: { fontWeight: '900', fontSize: 8, letterSpacing: 1.2, color: '#000', opacity: 0.6 },
  pathTitle: { fontWeight: '900', fontSize: 15, textTransform: 'uppercase', color: '#000', marginTop: 4 },
  pathDesc: { fontWeight: '600', fontSize: 11, color: '#000', opacity: 0.7, marginTop: 4, lineHeight: 16 },

  sectionTitle: { fontWeight: '900', fontSize: 13, textTransform: 'uppercase', color: '#000', marginBottom: 12, letterSpacing: 0.5 },
  loadingBadges: { paddingVertical: 20 },
  emptyCard: { marginBottom: 24, padding: 14 },
  emptyText: { fontWeight: '600', fontSize: 12, color: '#000', opacity: 0.6, textAlign: 'center', lineHeight: 18 },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  badgeItemWrapper: { width: '31%' },
  badgeItem: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  badgeIcon: { fontSize: 26, marginBottom: 4 },
  badgeTitle: { fontSize: 9, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 0.3 },

  logoutBtn: { width: '100%', marginTop: 8 },
});
