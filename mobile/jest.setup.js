import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence warning animations
jest.mock('react-native/Libraries/Animated/Paragraph', () => 'Paragraph');
jest.mock('react-native/Libraries/Animated/useNativeDriver', () => true);

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Mock react-native-screens
jest.mock('react-native-screens', () => {
  return {
    enableScreens: jest.fn(),
    ScreenContainer: ({ children }) => children,
    Screen: ({ children }) => children,
    NativeScreen: ({ children }) => children,
    NativeScreenContainer: ({ children }) => children,
    ScreenStack: ({ children }) => children,
    ScreenStackHeaderConfig: () => null,
    ScreenStackHeaderSubviews: () => null,
    SearchBar: () => null,
  };
});

// Mock lottie-react-native
jest.mock('lottie-react-native', () => 'LottieView');
