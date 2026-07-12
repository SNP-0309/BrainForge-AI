import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import api from '../../../services/api';
import { BrutalCard } from '../../../components/BrutalCard';
import { BrutalButton } from '../../../components/BrutalButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const questions = [
  {
    key: 'interests',
    question: 'What are your core technical interests?',
    options: [
      { value: 'ai_ml', label: 'AI & Machine Learning' },
      { value: 'web_dev', label: 'Web & App Development' },
      { value: 'data_science', label: 'Data & Analytics' },
      { value: 'security', label: 'Systems & Security' },
    ],
  },
  {
    key: 'personality',
    question: 'Describe your working style:',
    options: [
      { value: 'analytical', label: 'Logical & Analytical' },
      { value: 'creative', label: 'Creative & Visual' },
      { value: 'user_centric', label: 'User & Product Focused' },
      { value: 'defensive', label: 'Detail & Rules Oriented' },
    ],
  },
  {
    key: 'problem_solving',
    question: 'What problems do you enjoy solving?',
    options: [
      { value: 'puzzles', label: 'Math & Puzzles' },
      { value: 'architecture', label: 'System Architecture' },
      { value: 'interfaces', label: 'Interactive UI Design' },
      { value: 'audit', label: 'Performance & Security Audit' },
    ],
  },
  {
    key: 'background',
    question: 'Your current coding background?',
    options: [
      { value: 'beginner', label: 'Absolute Beginner' },
      { value: 'intermediate', label: 'Familiar with Basics' },
      { value: 'advanced', label: 'Experienced Coder' },
    ],
  },
  {
    key: 'daily_time',
    question: 'Daily learning time commitment?',
    options: [
      { value: 'quick', label: '30 Minutes / day' },
      { value: 'regular', label: '1 - 2 Hours / day' },
      { value: 'heavy', label: '3+ Hours / day' },
    ],
  },
];

export default function AssessmentScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation<any>();

  const activeQuestion = questions[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);
  const selectedValue = answers[activeQuestion.key];

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [activeQuestion.key]: value });
  };

  const handleNext = async () => {
    if (!selectedValue) return;

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await submitAssessment();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      await api.post('/career/assessment', { responses: answers });
      navigation.replace('Recommendations');
    } catch (err) {
      console.error('Assessment submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Progress Header */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.progressHeader}>
        <Text style={styles.stepLabel}>STEP {currentStep + 1} OF {questions.length}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
        </View>
        <Text style={styles.progressPercent}>{progressPercent}% Analyzed</Text>
      </Animated.View>

      {/* Question */}
      <Animated.View entering={FadeInDown.delay(100).springify()} key={`q-${currentStep}`}>
        <BrutalCard bg="#FFFFFF" style={styles.questionCard}>
          <Text style={styles.questionText}>{activeQuestion.question}</Text>

          <View style={styles.optionsContainer}>
            {activeQuestion.options.map((opt) => {
              const isSelected = selectedValue === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => handleSelect(opt.value)}
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionBullet, isSelected && styles.optionBulletSelected]}>
                    {isSelected && <Text style={styles.optionBulletText}>✓</Text>}
                  </View>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BrutalCard>
      </Animated.View>

      {/* Navigation Buttons */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.navRow}>
        <BrutalButton
          onPress={handleBack}
          bg="#FFFFFF"
          disabled={currentStep === 0}
          style={styles.backButton}
        >
          ← Back
        </BrutalButton>

        <BrutalButton
          onPress={handleNext}
          bg={currentStep === questions.length - 1 ? '#4ADE80' : '#FFE600'}
          disabled={!selectedValue || submitting}
          style={styles.nextButton}
        >
          {submitting ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : currentStep === questions.length - 1 ? (
            'Analyze Path ✦'
          ) : (
            'Next →'
          )}
        </BrutalButton>
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
    paddingBottom: 48,
  },
  progressHeader: {
    marginBottom: 24,
    marginTop: 8,
  },
  stepLabel: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '100%',
    height: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRightWidth: 2,
    borderRightColor: '#000000',
  },
  progressPercent: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  questionCard: {
    marginBottom: 20,
  },
  questionText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF6',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  optionItemSelected: {
    backgroundColor: '#FFE600',
  },
  optionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBulletSelected: {
    backgroundColor: '#000000',
  },
  optionBulletText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  optionLabel: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
    textTransform: 'uppercase',
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
