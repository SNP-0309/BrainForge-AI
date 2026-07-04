import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Map, Trophy, Flame, Star, Zap, Coins } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import api from '../../../config/api'
import Card from '../../../components/ui/Card'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import Badge from '../../../components/ui/Badge'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
}
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

function StatCard({ icon: Icon, label, value, subtext, color = 'primary' }) {
  const colors = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    accent: 'text-accent bg-accent/10 border-accent/20',
    yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  }
  return (
    <motion.div variants={item}>
      <Card hover className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
          {subtext && <p className="text-xs text-muted truncate">{subtext}</p>}
        </div>
      </Card>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: leaderboardData, isLoading: lbLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/leaderboard?limit=5').then(r => r.data.data),
  })

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'recent'],
    queryFn: () => api.get('/courses?limit=4').then(r => r.data.data),
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, <span className="text-primary">{user?.name?.split(' ')[0] ?? 'Learner'}</span> 👋
        </h1>
        <p className="text-sm text-muted mt-1">You're on a {user?.profile?.dailyStreak ?? 0}-day streak. Keep it up!</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="XP Points" value={user?.profile?.xp ?? 0} subtext={`Level ${user?.profile?.level ?? 1}`} color="primary" />
        <StatCard icon={Flame} label="Daily Streak" value={`${user?.profile?.dailyStreak ?? 0} days`} subtext="Keep going!" color="orange" />
        <StatCard icon={Star} label="Coins" value={user?.profile?.coins ?? 0} subtext="Earn by completing" color="yellow" />
        <StatCard icon={Trophy} label="Level" value={user?.profile?.level ?? 1} subtext="Next: more XP" color="accent" />
      </motion.div>

      {/* XP Progress Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Level {user?.profile?.level ?? 1} Progress</span>
            <span className="text-xs text-muted">{user?.profile?.xp ?? 0} / {(user?.profile?.level ?? 1) * 100} XP</span>
          </div>
          <div className="h-2 bg-card-hover rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((user?.profile?.xp ?? 0) / ((user?.profile?.level ?? 1) * 100)) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            />
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Explore Courses</h2>
            <a href="/courses" className="text-xs text-primary hover:underline">View all →</a>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SkeletonLoader className="h-28" count={4} />
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coursesData?.courses?.map(course => (
                <motion.div key={course._id} variants={item}>
                  <Card hover className="cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen size={18} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">{course.description}</p>
                        <Badge variant="primary" className="mt-2">{course.difficulty}</Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )) ?? (
                <Card className="col-span-2 text-center py-8">
                  <BookOpen size={28} className="text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted">No courses available yet</p>
                </Card>
              )}
            </motion.div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Top Learners</h2>
            <a href="/leaderboard" className="text-xs text-primary hover:underline">Full board →</a>
          </div>

          <Card className="space-y-3">
            {lbLoading ? (
              <SkeletonLoader className="h-10" count={5} />
            ) : (
              leaderboardData?.map((u, i) => (
                <div key={u._id} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-5 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-muted'}`}>
                    {i + 1}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{u.name}</p>
                    <p className="text-xs text-muted">Lv.{u.profile?.level}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{u.profile?.xp} XP</span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
