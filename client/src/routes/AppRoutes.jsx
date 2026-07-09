import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../components/layouts/MainLayout'

// Pages
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import CareerAssessmentPage from '../features/auth/pages/CareerAssessmentPage'
import CareerRecommendationsPage from '../features/auth/pages/CareerRecommendationsPage'
import DashboardPage from '../features/dashboard/pages/DashboardPage'
import CourseCatalogPage from '../features/courses/pages/CourseCatalogPage'
import CourseDetailPage from '../features/courses/pages/CourseDetailPage'
import RecommendedCoursesPage from '../features/courses/pages/RecommendedCoursesPage'
import LessonPlayerPage from '../features/courses/pages/LessonPlayerPage'
import RoadmapPage from '../features/roadmaps/pages/RoadmapPage'
import AiTutorPage from '../features/ai-tutor/pages/AiTutorPage'
import QuizPage from '../features/games/pages/QuizPage'
import GamesHubPage from '../features/games/pages/GamesHubPage'
import MemoryMatchPage from '../features/games/pages/MemoryMatchPage'
import ProfilePage from '../features/profile/pages/ProfilePage'
import LeaderboardPage from '../features/profile/pages/LeaderboardPage'
import TeacherDashboardPage from '../features/teacher/pages/TeacherDashboardPage'
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage'
import NotFoundPage from '../components/pages/NotFoundPage'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="flex items-center justify-center h-screen bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuthStore()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="flex items-center justify-center h-screen bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  return allowedRoles.includes(user.role) ? children : <Navigate to="/dashboard" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected App Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CourseCatalogPage />} />
        <Route path="/courses/recommended" element={<RecommendedCoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/lessons/:id" element={<LessonPlayerPage />} />
        <Route path="/roadmaps" element={<RoadmapPage />} />
        <Route path="/career/assessment" element={<CareerAssessmentPage />} />
        <Route path="/career/recommendations" element={<CareerRecommendationsPage />} />
        <Route path="/ai-tutor" element={<AiTutorPage />} />
        <Route path="/games" element={<GamesHubPage />} />
        <Route path="/games/quiz/:id" element={<QuizPage />} />
        <Route path="/games/memory-match" element={<MemoryMatchPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        {/* Role Protected Portals */}
        <Route path="/teacher/dashboard" element={<RoleRoute allowedRoles={['teacher', 'admin']}><TeacherDashboardPage /></RoleRoute>} />
        <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={['admin']}><AdminDashboardPage /></RoleRoute>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
