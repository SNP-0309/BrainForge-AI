import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Map, Trophy, Flame, Star, Zap, Coins, ChevronRight, Compass } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { useToastStore } from '../../../store/toastStore'
import api from '../../../config/api'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import Badge from '../../../components/ui/Badge'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
}
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

function StatCard({ icon: Icon, label, value, subtext, color = 'primary' }) {
  const colors = {
    primary: 'bg-brutal-purple',
    orange: 'bg-brutal-yellow',
    accent: 'bg-brutal-green',
    yellow: 'bg-brutal-pink',
  }
  return (
    <motion.div variants={item}>
      <Card hover bg={colors[color]} className="text-black">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl border-2 border-black bg-white flex items-center justify-center shrink-0">
            <Icon size={20} className="text-black" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-black text-black leading-tight">{value}</p>
            {subtext && <p className="text-xs font-bold text-black/85 truncate mt-0.5">{subtext}</p>}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user, setUser } = useAuthStore()
  const [mission, setMission] = useState(null)
  const [claiming, setClaiming] = useState(false)
  const [completingTaskId, setCompletingTaskId] = useState(null)
  const showToast = useToastStore((state) => state.showToast)
  const navigate = useNavigate();

  const fetchMission = async () => {
    try {
      const res = await api.get('/missions/today')
      setMission(res.data.data)
    } catch (err) {
      console.error('Failed to fetch today\'s mission:', err)
    }
  }

  useEffect(() => {
    fetchMission()
  }, [])

  const handleCompleteTask = async (taskId) => {
    setCompletingTaskId(taskId)
    try {
      const res = await api.put(`/missions/task/${taskId}/complete`)
      setMission(res.data.data)
      showToast('Task completed! Keep it up.', 'success')
    } catch (err) {
      console.error('Failed to complete mission task:', err)
    } finally {
      setCompletingTaskId(null)
    }
  }

  const handleClaimRewards = async () => {
    setClaiming(true)
    try {
      const res = await api.post('/missions/claim')
      showToast('Daily rewards claimed! +50 XP and +15 Coins received.', 'success')
      
      // Update global user state
      const userRes = await api.get('/users/me')
      setUser(userRes.data.data)
      
      // Refresh mission status
      await fetchMission()
    } catch (err) {
      console.error('Failed to claim rewards:', err)
    } finally {
      setClaiming(false)
    }
  }

  const { data: leaderboardData, isLoading: lbLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/leaderboard?limit=5').then(r => r.data.data),
  })

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'recent'],
    queryFn: () => api.get('/courses?limit=4').then(r => r.data.data),
  })

  const chosenPath = user?.profile?.chosenCareerPath;
  const isMissionComplete = mission?.tasks?.every(t => t.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-6xl mx-auto space-y-8 text-black"
    >
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-wider leading-tight">
            Welcome back, <span className="bg-brutal-yellow px-2 py-0.5 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000]">{user?.name?.split(' ')[0] ?? 'Learner'}</span> 👋
          </h1>
          <p className="text-sm text-black/70 font-bold mt-3">You're on a {user?.profile?.dailyStreak ?? 0}-day streak. Keep it up!</p>
        </div>

        {chosenPath ? (
          <Button 
            onClick={() => navigate('/roadmaps')} 
            bg="#FFE600" 
            className="flex items-center gap-2"
          >
            Continue {chosenPath} Roadmap <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button 
            onClick={() => navigate('/career/assessment')} 
            bg="#4ADE80" 
            className="flex items-center gap-2"
          >
            Start Career Discovery <Compass className="w-4 h-4" />
          </Button>
        )}
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="XP Points" value={user?.profile?.xp ?? 0} subtext={`Level ${user?.profile?.level ?? 1}`} color="primary" />
        <StatCard icon={Flame} label="Daily Streak" value={`${user?.profile?.dailyStreak ?? 0} days`} subtext="Keep going!" color="orange" />
        <StatCard icon={Coins} label="Coins" value={user?.profile?.coins ?? 0} subtext="Earn by completing" color="yellow" />
        <StatCard icon={Trophy} label="Level" value={user?.profile?.level ?? 1} subtext="Next: more XP" color="accent" />
      </motion.div>

      {/* Today's Learning Mission Checklist */}
      {mission && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card bg="#FFFFFF" className="p-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brutal-pink border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Star className="w-4 h-4 text-black" />
                </div>
                <h2 className="text-lg font-black uppercase text-black">Today's Daily Learning Mission</h2>
              </div>
              <span className="font-mono text-xs font-black bg-brutal-cream border-2 border-black px-2 py-0.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {mission.claimed ? 'CLAIMED' : isMissionComplete ? 'READY TO CLAIM' : 'IN PROGRESS'}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {mission.tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`border-2 border-black p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] transition-all ${
                    task.completed ? 'bg-brutal-green/10' : 'bg-brutal-cream/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={task.completed}
                      disabled={task.completed || completingTaskId === task.id}
                      onChange={() => handleCompleteTask(task.id)}
                      className="w-5 h-5 accent-black border-2 border-black rounded cursor-pointer shrink-0"
                    />
                    <span className={`text-sm font-extrabold uppercase text-black ${task.completed ? 'line-through opacity-60' : ''}`}>
                      {task.label}
                    </span>
                  </div>
                  {task.completed && (
                    <span className="text-[10px] font-mono font-black text-green-700 bg-green-100 border border-green-500 px-2 py-0.5 rounded">
                      COMPLETED
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isMissionComplete && !mission.claimed && (
              <Button 
                onClick={handleClaimRewards}
                disabled={claiming}
                bg="#4ADE80"
                className="w-full justify-center py-3 flex items-center gap-2"
              >
                Claim Daily Mission Rewards (+50 XP, +15 Coins) <Trophy className="w-4 h-4" />
              </Button>
            )}

            {mission.claimed && (
              <div className="bg-brutal-green/20 border-2 border-green-600 p-3 rounded-xl text-center text-sm font-black text-black">
                🎉 Today's rewards claimed! Check back tomorrow for new daily learning missions.
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* XP Progress Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card bg="#FFFFFF">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-black uppercase text-black">Level {user?.profile?.level ?? 1} Progress</span>
            <span className="text-xs font-black text-black">{user?.profile?.xp ?? 0} / {(user?.profile?.level ?? 1) * 100} XP</span>
          </div>
          <div className="h-4 bg-white border-2 border-black rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((user?.profile?.xp ?? 0) / ((user?.profile?.level ?? 1) * 100)) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              className="h-full bg-brutal-yellow border-r-2 border-black rounded-full"
            />
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase text-black">Explore Courses</h2>
            <a href="/courses" className="text-xs font-black uppercase text-black underline hover:text-gray-700">View all →</a>
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
                      <div className="w-10 h-10 rounded-lg bg-brutal-yellow border-2 border-black flex items-center justify-center shrink-0">
                        <BookOpen size={18} className="text-black" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-black truncate">{course.title}</p>
                        <p className="text-xs text-black/80 mt-1 line-clamp-2">{course.description}</p>
                        <Badge variant="primary" className="mt-2.5">{course.difficulty}</Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )) ?? (
                <Card className="col-span-2 text-center py-8">
                  <BookOpen size={28} className="text-black mx-auto mb-2" />
                  <p className="text-sm font-bold text-black/70">No courses available yet</p>
                </Card>
              )}
            </motion.div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase text-black">Top Learners</h2>
            <a href="/leaderboard" className="text-xs font-black uppercase text-black underline hover:text-gray-700">Full board →</a>
          </div>

          <Card className="space-y-3">
            {lbLoading ? (
              <SkeletonLoader className="h-10" count={5} />
            ) : (
              leaderboardData?.map((u, i) => (
                <div key={u._id} className="flex items-center gap-3">
                  <span className="text-sm font-black w-5 text-center text-black">
                    {i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-brutal-purple border-2 border-black flex items-center justify-center text-black text-xs font-black shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-black truncate">{u.name}</p>
                    <p className="text-xs font-bold text-black/70">Lv.{u.profile?.level}</p>
                  </div>
                  <span className="text-xs font-black text-black">{u.profile?.xp} XP</span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
