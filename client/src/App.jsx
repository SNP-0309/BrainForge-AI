import { useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  useAuth() // Initialise Firebase listener and sync with backend
  return <AppRoutes />
}
