import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_core/firebase_core.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/courses_screen.dart';
import 'screens/roadmap_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/games_screen.dart';
import 'screens/ai_tutor_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: 'AIzaSyCcEE0FVuTCS8JgqLbFaDhXoCqsUusWpOg',
      authDomain: 'brain-forge-38ec2.firebaseapp.com',
      projectId: 'brain-forge-38ec2',
      storageBucket: 'brain-forge-38ec2.firebasestorage.app',
      messagingSenderId: '430453640129',
      appId: '1:430453640129:web:738ec7177ef7fdd3653d40',
    ),
  );
  runApp(
    const ProviderScope(
      child: AiCareerGuidanceApp(),
    ),
  );
}

class AiCareerGuidanceApp extends ConsumerWidget {
  const AiCareerGuidanceApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp(
      title: 'AI Career Guidance',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFFFFDF6),
        colorScheme: const ColorScheme.light(
          primary: Color(0xFFFFE600), // Yellow
          secondary: Color(0xFF4ADE80), // Green
          background: Color(0xFFFFFDF6),
          surface: Colors.white,
          onPrimary: Colors.black,
          onSecondary: Colors.black,
          onBackground: Colors.black,
          onSurface: Colors.black,
        ),
        textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).apply(
          bodyColor: Colors.black,
          displayColor: Colors.black,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFFFFDF6),
          foregroundColor: Colors.black,
          elevation: 0,
          titleTextStyle: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: Colors.black, width: 2.5),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFFE600),
            foregroundColor: Colors.black,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: const BorderSide(color: Colors.black, width: 2),
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.black,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
            side: const BorderSide(color: Colors.black, width: 2),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
      ),
      home: authState.isLoading
          ? const SplashScreen()
          : authState.isAuthenticated
              ? const MainNavigationShell()
              : const LoginScreen(),
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'AI CAREER GUIDANCE',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
                color: Colors.black,
              ),
            ),
            SizedBox(height: 24),
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00E5FF)),
            ),
          ],
        ),
      ),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const CoursesScreen(),
    const RoadmapScreen(),
    const AiTutorScreen(),
    const GamesScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: Colors.black, width: 2.5),
          ),
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          backgroundColor: const Color(0xFFFFFDF6),
          indicatorColor: const Color(0xFFFFE600),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.dashboard_outlined, color: Colors.black),
              selectedIcon: Icon(Icons.dashboard, color: Colors.black),
              label: 'Dashboard',
            ),
            NavigationDestination(
              icon: Icon(Icons.school_outlined, color: Colors.black),
              selectedIcon: Icon(Icons.school, color: Colors.black),
              label: 'Courses',
            ),
            NavigationDestination(
              icon: Icon(Icons.map_outlined, color: Colors.black),
              selectedIcon: Icon(Icons.map, color: Colors.black),
              label: 'Roadmap',
            ),
            NavigationDestination(
              icon: Icon(Icons.psychology_outlined, color: Colors.black),
              selectedIcon: Icon(Icons.psychology, color: Colors.black),
              label: 'AI Tutor',
            ),
            NavigationDestination(
              icon: Icon(Icons.sports_esports_outlined, color: Colors.black),
              selectedIcon: Icon(Icons.sports_esports, color: Colors.black),
              label: 'Games',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outlined, color: Colors.black),
              selectedIcon: Icon(Icons.person, color: Colors.black),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
