import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function ProfileScreen() {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Your Profile</Text>
      <Text variant="bodyMedium" style={styles.text}>Your custom avatar, badges, and learning history will display here.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    color: '#94A3B8',
    textAlign: 'center',
  },
});
