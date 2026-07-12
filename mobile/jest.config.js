module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-navigation/.*|@react-native-async-storage|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-vector-icons|lottie-react-native)/)',
  ],
};
