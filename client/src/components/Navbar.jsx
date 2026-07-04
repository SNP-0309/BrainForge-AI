import { Bot, Bell, Flame } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Navbar({ onAiToggle }) {
  const { user } = useAuthStore()

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur-md shrink-0">
      {/* Streak counter */}
      <div className="flex items-center gap-2 text-sm">
        <Flame size={16} className="text-orange-400" />
        <span className="font-semibold text-foreground">{user?.profile?.dailyStreak ?? 0}</span>
        <span className="text-muted">day streak</span>
      </div>

      <div className="flex items-center gap-3">
        {/* XP Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-xs font-bold text-primary">
            Lv.{user?.profile?.level ?? 1}
          </span>
          <span className="text-xs text-muted">
            {user?.profile?.xp ?? 0} XP
          </span>
        </div>

        {/* AI Tutor Toggle */}
        <button
          onClick={onAiToggle}
          className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
          title="Open AI Tutor"
        >
          <Bot size={18} />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-card-hover text-muted hover:text-foreground transition-all relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          {user?.name?.[0]?.toUpperCase() ?? 'B'}
        </div>
      </div>
    </header>
  )
}
