import { useAuth } from './hooks/useAuth'
import AppRoutes from './routes/AppRoutes'
import ToastContainer from './components/ui/Toast'
import LoadingScreen from './components/ui/LoadingScreen'
import { useAuthStore } from './store/authStore'

export default function App() {
  useAuth() // Initialise Firebase listener and sync with backend
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <>
      <AppRoutes />
      <ToastContainer />
    </>
  )
}

