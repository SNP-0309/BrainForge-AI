
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { View, Text, StyleSheet } from 'react-native';

// Import Screens
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import AssessmentScreen from '../features/auth/screens/AssessmentScreen';
import RecommendationsScreen from '../features/auth/screens/RecommendationsScreen';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import CoursesCatalogScreen from '../features/courses/screens/CoursesCatalogScreen';
import GamesHubScreen from '../features/games/screens/GamesHubScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import RoadmapScreen from '../features/roadmap/screens/RoadmapScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ── Minimal icon components (no native icon lib needed) ───────────────────────
const Icon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <View style={[iconStyles.wrapper, focused && iconStyles.wrapperActive]}>
    <Text style={iconStyles.emoji}>{emoji}</Text>
  </View>
);

const iconStyles = StyleSheet.create({
  wrapper: {
    width: 36,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  wrapperActive: {
    backgroundColor: '#FFE600',
    borderWidth: 2,
    borderColor: '#000',
  },
  emoji: { fontSize: 16 },
});

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFDF6' },
        headerTintColor: '#000000',
        headerTitleStyle: { fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: '#FFFDF6',
          borderTopColor: '#000000',
          borderTopWidth: 2,
          height: 62,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.3 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} />,
          title: 'BrainForge',
          headerTitle: 'BrainForge AI',
        }}
      />
      <Tab.Screen
        name="Roadmap"
        component={RoadmapScreen}
        options={{
          tabBarIcon: ({ focused }) => <Icon emoji="🗺️" focused={focused} />,
          title: 'Roadmap',
          headerTitle: 'My Learning Path',
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesCatalogScreen}
        options={{
          tabBarIcon: ({ focused }) => <Icon emoji="📚" focused={focused} />,
          title: 'Courses',
          headerTitle: 'Course Catalog',
        }}
      />
      <Tab.Screen
        name="Games"
        component={GamesHubScreen}
        options={{
          tabBarIcon: ({ focused }) => <Icon emoji="🎮" focused={focused} />,
          title: 'Games',
          headerTitle: 'Games Hub',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} />,
          title: 'Profile',
          headerTitle: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="Assessment"
            component={AssessmentScreen}
            options={{
              headerShown: true,
              title: 'Career Discovery',
              headerStyle: { backgroundColor: '#FFFDF6' },
              headerTintColor: '#000000',
              headerTitleStyle: { fontWeight: '900', textTransform: 'uppercase' },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="Recommendations"
            component={RecommendationsScreen}
            options={{
              headerShown: true,
              title: 'AI Recommendations',
              headerStyle: { backgroundColor: '#FFFDF6' },
              headerTintColor: '#000000',
              headerTitleStyle: { fontWeight: '900', textTransform: 'uppercase' },
              headerShadowVisible: false,
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
