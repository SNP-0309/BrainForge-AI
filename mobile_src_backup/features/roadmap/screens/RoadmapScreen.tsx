import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalButton } from '../../../components/BrutalButton';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';

interface RoadmapNode {
  id: string;
  label: string;
  status: 'locked' | 'available' | 'completed';
  dependencies: string[];
}

interface Roadmap {
  _id: string;
  title: string;
  description: string;
  nodes: RoadmapNode[];
  isCompleted: boolean;
}

const STATUS_CONFIG = {
  completed: { color: '#4ADE80', badge: 'DONE ✓', emoji: '✅' },
  available: { color: '#FFE600', badge: 'IN PROGRESS', emoji: '▶' },
  locked: { color: '#E5E7EB', badge: 'LOCKED', emoji: '🔒' },
};

export default function RoadmapScreen() {
  const { user } = useAuthStore();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [completing, setCompleting] = useState(false);

  const fetchRoadmap = useCallback(async () => {
    try {
      const res = await api.get('/roadmaps');
      const roadmaps: Roadmap[] = res.data.data;
      if (roadmaps.length > 0) {
        const active =
          roadmaps.find((r) =>
            r.title.toLowerCase().includes(
              (user?.profile?.chosenCareerPath || '').toLowerCase()
            )
          ) || roadmaps[0];
        setRoadmap(active);
      }
    } catch (err) {
      console.error('Failed to fetch roadmap:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.profile?.chosenCareerPath]);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleComplete = async () => {
    if (!selectedNode || !roadmap) return;
    setCompleting(true);
    try {
      const res = await api.put(
        `/roadmaps/${roadmap._id}/node/${selectedNode.id}`,
        { status: 'completed' }
      );
      const updated: Roadmap = res.data.data.roadmap;
      setRoadmap(updated);
      const updatedNode = updated.nodes.find((n) => n.id === selectedNode.id);
      if (updatedNode) setSelectedNode(updatedNode);
    } catch (err) {
      console.error('Failed to complete node:', err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Building your roadmap...</Text>
      </View>
    );
  }

  if (!roadmap) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🗺️</Text>
        <Text style={styles.emptyTitle}>No Roadmap Found</Text>
        <Text style={styles.emptySubtitle}>
          Complete a Career Discovery Assessment to generate your personalized learning path.
        </Text>
      </View>
    );
  }

  const completedCount = roadmap.nodes.filter((n) => n.status === 'completed').length;
  const totalCount = roadmap.nodes.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Header Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <BrutalCard bg="#FFE600" style={styles.headerCard}>
            <Text style={styles.headerLabel}>ACTIVE PATH</Text>
            <Text style={styles.headerTitle}>{roadmap.title}</Text>
            <Text style={styles.headerSubtitle}>{roadmap.description}</Text>

            {/* Progress */}
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{completedCount}/{totalCount} modules</Text>
              <Text style={styles.progressPct}>{progressPct}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
            </View>
          </BrutalCard>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.statsRow}>
          <BrutalCard bg="#4ADE80" style={styles.statCard} contentStyle={styles.statContent}>
            <Text style={styles.statNum}>{completedCount}</Text>
            <Text style={styles.statLabel}>DONE</Text>
          </BrutalCard>
          <BrutalCard bg="#FFFFFF" style={styles.statCard} contentStyle={styles.statContent}>
            <Text style={styles.statNum}>{roadmap.nodes.filter((n) => n.status === 'available').length}</Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </BrutalCard>
          <BrutalCard bg="#F3F4F6" style={styles.statCard} contentStyle={styles.statContent}>
            <Text style={styles.statNum}>{roadmap.nodes.filter((n) => n.status === 'locked').length}</Text>
            <Text style={styles.statLabel}>LOCKED</Text>
          </BrutalCard>
        </Animated.View>

        {/* Timeline nodes */}
        <Text style={styles.sectionTitle}>Learning Path</Text>
        <View style={styles.timeline}>
          {/* Vertical rail */}
          <View style={styles.rail} />

          {roadmap.nodes.map((node, idx) => {
            const cfg = STATUS_CONFIG[node.status];
            const isLocked = node.status === 'locked';
            return (
              <Animated.View
                key={node.id}
                entering={FadeInDown.delay(250 + idx * 40).springify()}
                style={styles.nodeRow}
              >
                {/* Circle */}
                <View style={[styles.nodeCircle, { backgroundColor: cfg.color }]}>
                  <Text style={styles.nodeCircleText}>
                    {node.status === 'completed' ? '✓' : String(idx + 1)}
                  </Text>
                </View>

                {/* Card */}
                <TouchableOpacity
                  style={[
                    styles.nodeCard,
                    { opacity: isLocked ? 0.5 : 1 },
                    node.status === 'completed' && styles.nodeCardDone,
                    node.status === 'available' && styles.nodeCardActive,
                  ]}
                  disabled={isLocked}
                  onPress={() => setSelectedNode(node)}
                  activeOpacity={0.8}
                >
                  <View style={styles.nodeCardInner}>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.nodeBadge, { backgroundColor: cfg.color }]}>
                        <Text style={styles.nodeBadgeText}>{cfg.badge}</Text>
                      </View>
                      <Text style={styles.nodeLabel} numberOfLines={2}>
                        {node.label}
                      </Text>
                    </View>
                    {!isLocked && (
                      <Text style={styles.nodeChevron}>›</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Node Detail Modal ─────────────────────────────── */}
      <Modal
        visible={!!selectedNode}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedNode(null)}
      >
        {selectedNode && (() => {
          const cfg = STATUS_CONFIG[selectedNode.status];
          return (
            <View style={styles.modal}>
              <View style={styles.modalHandle} />

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={[styles.modalBadge, { backgroundColor: cfg.color }]}>
                    <Text style={styles.modalBadgeText}>{cfg.badge}</Text>
                  </View>
                  <Text style={styles.modalTitle}>{selectedNode.label}</Text>
                </View>
                <Pressable style={styles.closeBtn} onPress={() => setSelectedNode(null)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody}>

                {/* Status info */}
                <BrutalCard
                  bg={selectedNode.status === 'completed' ? '#D1FAE5' : '#FEF9C3'}
                  style={styles.modalInfoCard}
                >
                  <Text style={styles.modalInfoText}>
                    {selectedNode.status === 'completed'
                      ? '🎉 You have completed this module! AI tools are unlocked.'
                      : selectedNode.status === 'available'
                      ? '📖 This module is ready to learn. Mark it complete when done!'
                      : '🔒 Complete previous modules to unlock this one.'}
                  </Text>
                </BrutalCard>

                {/* AI Tools (shown when completed) */}
                {selectedNode.status === 'completed' && (
                  <View style={styles.toolsSection}>
                    <Text style={styles.toolsTitle}>🤖 AI Study Tools Unlocked</Text>
                    {[
                      { emoji: '📄', label: 'AI Study Summary', desc: 'Custom cheat sheet for this topic' },
                      { emoji: '❓', label: 'Practice Quiz', desc: '5 AI-generated practice questions' },
                      { emoji: '🧠', label: 'Flashcards', desc: 'Spaced repetition review cards' },
                      { emoji: '🛠️', label: 'Mini Projects', desc: '3 beginner project guides' },
                    ].map((tool) => (
                      <View key={tool.label} style={styles.toolCard}>
                        <Text style={styles.toolEmoji}>{tool.emoji}</Text>
                        <View>
                          <Text style={styles.toolLabel}>{tool.label}</Text>
                          <Text style={styles.toolDesc}>{tool.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Footer */}
              <View style={styles.modalFooter}>
                {selectedNode.status === 'completed' ? (
                  <View style={styles.completedBanner}>
                    <Text style={styles.completedText}>✅ Module Completed!</Text>
                  </View>
                ) : selectedNode.status === 'available' ? (
                  <BrutalButton
                    onPress={handleComplete}
                    bg="#4ADE80"
                    disabled={completing}
                    style={styles.completeBtn}
                  >
                    {completing ? <ActivityIndicator color="#000" size="small" /> : 'Mark Module as Completed'}
                  </BrutalButton>
                ) : (
                  <View style={styles.lockedBanner}>
                    <Text style={styles.lockedText}>🔒 Complete previous modules first</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })()}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF6' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#FFFDF6', alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontWeight: '700', color: '#000', textTransform: 'uppercase', fontSize: 12 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontWeight: '900', fontSize: 20, textTransform: 'uppercase', color: '#000' },
  emptySubtitle: { fontWeight: '600', fontSize: 13, color: '#000', opacity: 0.6, textAlign: 'center', marginTop: 8, lineHeight: 20 },

  headerCard: { marginBottom: 16 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#000', opacity: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', color: '#000', lineHeight: 24 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: '#000', opacity: 0.7, marginTop: 4, lineHeight: 18 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 6 },
  progressLabel: { fontWeight: '800', fontSize: 11, color: '#000' },
  progressPct: { fontWeight: '900', fontSize: 11, color: '#000' },
  progressBarBg: { height: 10, backgroundColor: '#00000020', borderRadius: 6, borderWidth: 1.5, borderColor: '#000', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#000', borderRadius: 4 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1 },
  statContent: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  statNum: { fontWeight: '900', fontSize: 22, color: '#000' },
  statLabel: { fontWeight: '900', fontSize: 8, color: '#000', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },

  sectionTitle: { fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: '#000', marginBottom: 16 },

  timeline: { position: 'relative', paddingLeft: 44 },
  rail: { position: 'absolute', left: 16, top: 0, bottom: 0, width: 3, backgroundColor: '#000', borderRadius: 2 },
  nodeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  nodeCircle: {
    position: 'absolute',
    left: -44,
    top: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  nodeCircleText: { fontWeight: '900', fontSize: 12, color: '#000' },
  nodeCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 2.5,
    borderColor: '#000',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  nodeCardDone: { backgroundColor: '#F0FDF4' },
  nodeCardActive: { backgroundColor: '#FEFCE8' },
  nodeCardInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nodeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1.5, borderColor: '#000', marginBottom: 6 },
  nodeBadgeText: { fontSize: 8, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 },
  nodeLabel: { fontWeight: '800', fontSize: 14, color: '#000', textTransform: 'uppercase', lineHeight: 18 },
  nodeChevron: { fontSize: 22, fontWeight: '900', color: '#000', lineHeight: 22 },

  // Modal
  modal: { flex: 1, backgroundColor: '#FFFDF6' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#000', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 20, borderBottomWidth: 2, borderColor: '#00000015' },
  modalHeaderLeft: { flex: 1 },
  modalBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 2, borderColor: '#000', marginBottom: 8 },
  modalBadgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, color: '#000' },
  modalTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', color: '#000', lineHeight: 26, paddingRight: 16 },
  closeBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 2, borderColor: '#000', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2 },
  closeBtnText: { fontWeight: '900', fontSize: 14, color: '#000' },
  modalBody: { flex: 1, padding: 20 },
  modalInfoCard: { marginBottom: 20 },
  modalInfoText: { fontWeight: '700', fontSize: 13, color: '#000', lineHeight: 20 },
  toolsSection: { marginTop: 4 },
  toolsTitle: { fontWeight: '900', fontSize: 13, textTransform: 'uppercase', color: '#000', marginBottom: 12 },
  toolCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', borderRadius: 12, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2 },
  toolEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  toolLabel: { fontWeight: '800', fontSize: 13, color: '#000', textTransform: 'uppercase' },
  toolDesc: { fontWeight: '600', fontSize: 11, color: '#000', opacity: 0.6, marginTop: 1 },
  modalFooter: { padding: 20, borderTopWidth: 2, borderColor: '#00000015' },
  completedBanner: { backgroundColor: '#D1FAE5', borderWidth: 2, borderColor: '#22C55E', borderRadius: 12, padding: 14, alignItems: 'center' },
  completedText: { fontWeight: '900', fontSize: 14, color: '#000', textTransform: 'uppercase' },
  lockedBanner: { backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#000', borderRadius: 12, padding: 14, alignItems: 'center' },
  lockedText: { fontWeight: '700', fontSize: 13, color: '#000' },
  completeBtn: { width: '100%' },
});
