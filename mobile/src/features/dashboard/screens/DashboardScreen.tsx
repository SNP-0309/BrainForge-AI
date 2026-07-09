import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useAuthStore } from '../../../store/authStore';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalButton } from '../../../components/BrutalButton';
import { useNavigation } from '@react-navigation/native';
import api from '../../../services/api';

interface MissionTask {
  id: string;
  label: string;
  completed: boolean;
  type: string;
}

interface Mission {
  date: string;
  tasks: MissionTask[];
  claimed: boolean;
}

export default function DashboardScreen() {
  const { user, logout, setUser } = useAuthStore();
  const navigation = useNavigation<any>();

  const [mission, setMission] = useState<Mission | null>(null);
  const [missionLoading, setMissionLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const username = user?.name || 'Explorer';
  const role = user?.role || 'student';
  const xp = user?.profile?.xp ?? 0;
  const level = user?.profile?.level ?? 1;
  const coins = user?.profile?.coins ?? 0;
  const dailyStreak = user?.profile?.dailyStreak ?? 1;
  const chosenCareerPath = user?.profile?.chosenCareerPath;

  const fetchMission = useCallback(async () => {
    try {
      const res = await api.get('/missions/today');
      setMission(res.data.data);
    } catch (err) {
      console.error('Failed to fetch mission:', err);
    } finally {
      setMissionLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMission();
  }, [fetchMission]);

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    try {
      const res = await api.put(`/missions/task/${taskId}/complete`);
      setMission(res.data.data);
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleClaimRewards = async () => {
    setClaiming(true);
    try {
      await api.post('/missions/claim');
      const userRes = await api.get('/users/me');
      setUser(userRes.data.data);
      await fetchMission();
    } catch (err) {
      console.error('Failed to claim rewards:', err);
    } finally {
      setClaiming(false);
    }
  };

  const isMissionComplete = mission?.tasks?.every((t) => t.completed);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.header}>
        <View>
          <Text variant="titleMedium" style={styles.welcomeText}>Welcome back,</Text>
          <Text variant="headlineMedium" style={styles.nameText}>{username}</Text>
          <Text variant="bodySmall" style={styles.roleText}>{role.toUpperCase()}</Text>
        </View>
        <Avatar.Text
          size={56}
          label={username.substring(0, 2).toUpperCase()}
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
      </Animated.View>

      {/* Career Path CTA */}
      <Animated.View entering={FadeInDown.delay(150).springify()}>
        {chosenCareerPath ? (
          <BrutalCard bg="#FFE600" style={styles.ctaCard}>
            <Text style={styles.ctaLabel}>ACTIVE PATH</Text>
            <Text style={styles.ctaTitle}>{chosenCareerPath}</Text>
            <Text style={styles.ctaSubtitle}>Continue your learning journey below</Text>
          </BrutalCard>
        ) : (
          <BrutalButton
            onPress={() => navigation.navigate('Assessment')}
            bg="#4ADE80"
            style={styles.discoveryButton}
          >
            ✦ Start Career Discovery Assessment
          </BrutalButton>
        )}
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View entering={FadeInDown.delay(200).duration(500).springify()}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Your Progress</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(300).duration(500).springify()} style={styles.statsGrid}>
        <BrutalCard bg="#4ADE80" style={styles.statCard} contentStyle={styles.cardContent}>
          <Text variant="bodySmall" style={styles.cardLabel}>LEVEL</Text>
          <Text variant="headlineMedium" style={styles.cardValue}>{level}</Text>
        </BrutalCard>
        <BrutalCard bg="#E9D5FF" style={styles.statCard} contentStyle={styles.cardContent}>
          <Text variant="bodySmall" style={styles.cardLabel}>TOTAL XP</Text>
          <Text variant="headlineMedium" style={styles.cardValue}>{xp}</Text>
        </BrutalCard>
        <BrutalCard bg="#FFE600" style={styles.statCard} contentStyle={styles.cardContent}>
          <Text variant="bodySmall" style={styles.cardLabel}>STREAK</Text>
          <Text variant="headlineMedium" style={styles.cardValue}>🔥 {dailyStreak}d</Text>
        </BrutalCard>
        <BrutalCard bg="#FFAED7" style={styles.statCard} contentStyle={styles.cardContent}>
          <Text variant="bodySmall" style={styles.cardLabel}>COINS</Text>
          <Text variant="headlineMedium" style={styles.cardValue}>🪙 {coins}</Text>
        </BrutalCard>
      </Animated.View>

      {/* Daily Mission Checklist */}
      <Animated.View entering={FadeInDown.delay(380).springify()}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Today's Mission</Text>

        {missionLoading ? (
          <BrutalCard bg="#FFFFFF" style={styles.missionCard}>
            <ActivityIndicator color="#000000" />
          </BrutalCard>
        ) : mission ? (
          <BrutalCard bg="#FFFFFF" style={styles.missionCard}>
            {/* Status badge */}
            <View style={styles.missionBadgeRow}>
              <View style={[
                styles.missionStatusBadge,
                mission.claimed && styles.missionStatusBadgeClaimed,
                isMissionComplete && !mission.claimed && styles.missionStatusBadgeReady,
              ]}>
                <Text style={styles.missionStatusText}>
                  {mission.claimed ? '✓ CLAIMED' : isMissionComplete ? '★ READY TO CLAIM' : '⧖ IN PROGRESS'}
                </Text>
              </View>
            </View>

            {/* Task items */}
            <View style={styles.tasksContainer}>
              {mission.tasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => !task.completed && handleCompleteTask(task.id)}
                  disabled={task.completed || completingTaskId === task.id}
                  style={[
                    styles.taskItem,
                    task.completed && styles.taskItemCompleted,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxDone]}>
                    {completingTaskId === task.id ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : task.completed ? (
                      <Text style={styles.taskCheckmark}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.taskLabel, task.completed && styles.taskLabelDone]}>
                    {task.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Claim button */}
            {isMissionComplete && !mission.claimed && (
              <BrutalButton
                onPress={handleClaimRewards}
                bg="#4ADE80"
                disabled={claiming}
                style={styles.claimButton}
              >
                {claiming ? <ActivityIndicator color="#000000" size="small" /> : 'Claim +50 XP & +15 Coins 🎁'}
              </BrutalButton>
            )}

            {mission.claimed && (
              <View style={styles.claimedBanner}>
                <Text style={styles.claimedText}>🎉 Rewards claimed! Back tomorrow for new missions.</Text>
              </View>
            )}
          </BrutalCard>
        ) : null}
      </Animated.View>

      {/* Logout */}
      <Animated.View entering={FadeInDown.delay(480).springify()}>
        <BrutalButton onPress={logout} bg="#FFAED7" style={styles.logoutButton}>
          Sign Out / Reset Sandbox
        </BrutalButton>
      </Animated.View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
  contentContainer: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeText: { color: '#000', opacity: 0.7, fontWeight: 'bold' },
  nameText: { color: '#000', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  roleText: { color: '#000', fontWeight: '900', textDecorationLine: 'underline', marginTop: 4 },
  avatar: { backgroundColor: '#FFE600', borderWidth: 2, borderColor: '#000' },
  avatarLabel: { color: '#000', fontWeight: '900' },

  ctaCard: { marginBottom: 20 },
  ctaLabel: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1.2, opacity: 0.6 },
  ctaTitle: { color: '#000', fontWeight: '900', fontSize: 18, textTransform: 'uppercase', marginTop: 4 },
  ctaSubtitle: { color: '#000', fontWeight: '600', opacity: 0.7, fontSize: 12, marginTop: 2 },
  discoveryButton: { marginBottom: 20 },

  sectionTitle: {
    color: '#000',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: { width: '47%', marginBottom: 16 },
  cardContent: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  cardLabel: { color: '#000', fontWeight: '900', letterSpacing: 1.1, marginBottom: 4 },
  cardValue: { color: '#000', fontWeight: '900' },

  missionCard: { marginBottom: 24 },
  missionBadgeRow: { marginBottom: 12 },
  missionStatusBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  missionStatusBadgeClaimed: { backgroundColor: '#D1FAE5' },
  missionStatusBadgeReady: { backgroundColor: '#FEF08A' },
  missionStatusText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 0.8 },

  tasksContainer: { gap: 10, marginBottom: 16 },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFDF6',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    padding: 12,
  },
  taskItemCompleted: { backgroundColor: '#F0FDF4' },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxDone: { backgroundColor: '#22C55E' },
  taskCheckmark: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  taskLabel: { color: '#000', fontWeight: '700', fontSize: 13, flex: 1, textTransform: 'uppercase', letterSpacing: 0.3 },
  taskLabelDone: { textDecorationLine: 'line-through', opacity: 0.5 },

  claimButton: { marginTop: 4 },
  claimedBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  claimedText: { color: '#000', fontWeight: '700', fontSize: 13, textAlign: 'center' },

  logoutButton: { marginTop: 8 },
});

