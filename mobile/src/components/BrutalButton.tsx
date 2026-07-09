import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View, Animated, ViewStyle } from 'react-native';

interface BrutalButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  bg?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function BrutalButton({ children, onPress, bg = '#FFE600', disabled, style }: BrutalButtonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 140,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: true,
      tension: 140,
      friction: 8,
    }).start();
  };

  // Maps pressing state to 3D translate offset
  const translateContentX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });
  const translateContentY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        disabled && styles.disabled,
        style,
      ]}
    >
      {/* Shadow layer */}
      <View style={styles.shadow} />
      {/* Content layer */}
      <Animated.View
        style={[
          styles.content,
          {
            backgroundColor: bg,
            transform: [
              { translateX: translateContentX },
              { translateY: translateContentY },
            ],
          },
        ]}
      >
        {typeof children === 'string' ? (
          <Text style={styles.text}>{children}</Text>
        ) : (
          children
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginRight: 4,
    marginBottom: 4,
  },
  disabled: {
    opacity: 0.5,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
