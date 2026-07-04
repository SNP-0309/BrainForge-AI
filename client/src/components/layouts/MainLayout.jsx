import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar'
import Navbar from '../Navbar'
import AiTutorDrawer from '../../features/ai-tutor/components/AiTutorDrawer'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onAiToggle={() => setAiDrawerOpen(!aiDrawerOpen)} />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Tutor Drawer */}
      <AiTutorDrawer open={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
    </div>
  )
}
