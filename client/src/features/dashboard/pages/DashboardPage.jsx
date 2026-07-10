import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Briefcase, ChevronRight, Compass, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
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

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate();

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'recent'],
    queryFn: () => api.get('/courses?limit=4').then(r => r.data.data),
  })

  const chosenPath = user?.profile?.chosenCareerPath;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-6xl mx-auto space-y-8 text-black"
    >
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-[3px] border-black bg-white p-6 rounded-2xl shadow-brutal">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-[#4ADE80] border-2 border-black px-2.5 py-0.5 text-[10px] font-black uppercase rounded shadow-[1.5px_1.5px_0px_0px_#000]">
            <ShieldCheck size={12} /> Active Account
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-black uppercase tracking-wider leading-tight">
            Welcome back, <span className="bg-brutal-yellow px-2 py-0.5 border border-black rounded-lg">{user?.name?.split(' ')[0] ?? 'Learner'}</span> 👋
          </h1>
          <p className="text-xs md:text-sm text-black/75 font-bold">
            Discover the best learning resources, follow your personalized roadmap, and master new skills with expert-curated guidance.
          </p>
        </div>

        {chosenPath ? (
          <Button 
            onClick={() => navigate('/roadmaps')} 
            bg="#FFE600" 
            className="flex items-center gap-2"
          >
            Continue {chosenPath} Roadmap <ChevronRight className="w-4.5 h-4.5" />
          </Button>
        ) : (
          <Button 
            onClick={() => navigate('/career/assessment')} 
            bg="#4ADE80" 
            className="flex items-center gap-2"
          >
            Start Career Discovery <Compass className="w-4.5 h-4.5" />
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase text-black">Recommended Learning Resources</h2>
            <Button size="sm" variant="secondary" onClick={() => navigate('/courses')}>
              View all →
            </Button>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonLoader className="h-32" count={4} />
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coursesData?.courses?.map(course => (
                <motion.div key={course._id} variants={item}>
                  <Card 
                    hover 
                    className="cursor-pointer h-full flex flex-col justify-between"
                    onClick={() => window.open(course.buyUrl || 'https://www.udemy.com', '_blank', 'noopener,noreferrer')}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="bg-black text-white px-2 py-0.5 text-[9px] font-mono font-black rounded uppercase">
                          {course.platform}
                        </span>
                        <Badge variant="primary" className="text-[10px]">{course.difficulty}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-black text-black leading-snug line-clamp-1 uppercase">{course.title}</p>
                        <p className="text-xs text-black/80 mt-1 line-clamp-2 leading-relaxed">{course.description}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-black/15">
                      <span className="text-[10px] font-mono font-black text-black/60">
                        {course.instructor}
                      </span>
                      <span className="text-xs font-black text-black">
                        ₹{course.price?.toLocaleString('en-IN')}
                      </span>
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

        {/* Fellow Learners */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black uppercase text-black font-mono">Fellow Learners</h2>
          </div>

          <Card className="space-y-4 bg-white p-5 border-3 border-black">
            {lbLoading ? (
              <SkeletonLoader className="h-10" count={5} />
            ) : (
              leaderboardData?.map((u, i) => (
                <div key={u._id} className="flex items-center gap-3.5 pb-3 border-b border-black/10 last:border-0 last:pb-0">
                  <span className="text-xs font-black w-5 text-center text-black/70 font-mono">
                    #{i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-brutal-purple border-2 border-black flex items-center justify-center text-black text-xs font-black shrink-0 shadow-[1px_1px_0px_0px_#000]">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-black truncate uppercase">{u.name}</p>
                    <p className="text-[9px] font-mono font-black text-black/55 uppercase">{u.role || 'Member'}</p>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

      </div>
    </motion.div>
  )
}
