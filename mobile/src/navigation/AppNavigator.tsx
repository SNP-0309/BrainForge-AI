
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';

// Import Screens
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import AssessmentScreen from '../features/auth/screens/AssessmentScreen';
import RecommendationsScreen from '../features/auth/screens/RecommendationsScreen';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import CoursesCatalogScreen from '../features/courses/screens/CoursesCatalogScreen';
import GamesHubScreen from '../features/games/screens/GamesHubScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFDF6' },
        headerTintColor: '#000000',
        headerTitleStyle: { fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
        tabBarStyle: {
          backgroundColor: '#FFFDF6',
          borderTopColor: '#000000',
          borderTopWidth: 2,
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontWeight: '900', fontSize: 10, textTransform: 'uppercase' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Courses" component={CoursesCatalogScreen} />
      <Tab.Screen name="Games" component={GamesHubScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // Main Application with Bottom Tabs + Career Flow screens
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
            }}
          />
        </>
      ) : (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
