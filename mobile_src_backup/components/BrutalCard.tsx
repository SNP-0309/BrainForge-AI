import React from 'react';
import { View, StyleSheet } from 'react-native';

interface BrutalCardProps {
  children: React.ReactNode;
  bg?: string;
  style?: any;
  contentStyle?: any;
}

export function BrutalCard({ children, bg = '#FFFFFF', style, contentStyle }: BrutalCardProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Shadow layer */}
      <View style={styles.shadow} />
      {/* Content layer */}
      <View style={[styles.content, { backgroundColor: bg }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginRight: 4,
    marginBottom: 4,
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  content: {
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 12,
    padding: 16,
  },
});
