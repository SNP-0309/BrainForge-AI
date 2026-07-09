import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, Map, Bot, Gamepad2,
  Trophy, User, ChevronLeft, Zap, Shield, Settings, Youtube
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const baseNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/courses/recommended', icon: Youtube, label: 'Free Courses' },
  { to: '/roadmaps', icon: Map, label: 'Roadmaps' },
  { to: '/ai-tutor', icon: Bot, label: 'AI Tutor' },
  { to: '/games', icon: Gamepad2, label: 'Games' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar({ open, onToggle }) {
  const { user } = useAuthStore()

  const navItems = [...baseNavItems]
  if (user?.role === 'teacher') {
    navItems.push({ to: '/teacher/dashboard', icon: Settings, label: 'Teacher Portal' })
  } else if (user?.role === 'admin') {
    navItems.push({ to: '/teacher/dashboard', icon: Settings, label: 'Teacher Portal' })
    navItems.push({ to: '/admin/dashboard', icon: Shield, label: 'Admin Panel' })
  }

  return (
    <motion.aside
      animate={{ width: open ? 240 : 72 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full bg-white border-r-[3px] border-black overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b-[3px] border-black bg-brutal-cream">
        <div className="w-8 h-8 rounded-lg bg-brutal-yellow border-2 border-black flex items-center justify-center shrink-0">
          <Zap size={16} className="text-black fill-black" />
        </div>
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-black text-black text-sm uppercase tracking-wider whitespace-nowrap"
            >
              BrainForge AI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-2 px-2 bg-white">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-100 group
              ${isActive
                ? 'bg-brutal-yellow text-black border-2 border-black shadow-[2px_2px_0px_0px_#000000] font-black'
                : 'text-black font-bold hover:bg-black/10'
              }`
            }
          >
            <Icon size={18} className="shrink-0 text-black" />
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-brutal-yellow border-2 border-black flex items-center justify-center text-black hover:bg-brutal-pink transition-all z-10"
      >
        <motion.div animate={{ rotate: open ? 0 : 180 }} transition={{ duration: 0.3 }}>
          <ChevronLeft size={12} />
        </motion.div>
      </button>
    </motion.aside>
  )
}
