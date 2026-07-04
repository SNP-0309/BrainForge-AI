import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Play, CheckCircle, Clock, ChevronRight } from 'lucide-react'
import api from '../../../config/api'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: course, isLoading: cLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then(r => r.data.data),
  })

  const { data: lessons, isLoading: lLoading } = useQuery({
    queryKey: ['lessons', id],
    queryFn: () => api.get(`/courses/${id}/lessons`).then(r => r.data.data),
  })

  if (cLoading) return <div className="max-w-3xl mx-auto space-y-4"><SkeletonLoader className="h-48" /><SkeletonLoader className="h-12" count={5} /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Course Hero */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <BookOpen size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground">{course?.title}</h1>
              <p className="text-sm text-muted mt-1 line-clamp-2">{course?.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="primary">{course?.difficulty}</Badge>
                {course?.tags?.map(t => <Badge key={t}>{t}</Badge>)}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Lessons List */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Lessons ({lessons?.length ?? 0})</h2>
        {lLoading ? (
          <div className="space-y-2"><SkeletonLoader className="h-16" count={4} /></div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-2">
            {lessons?.map((lesson, i) => (
              <motion.div key={lesson._id} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                <Card hover className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/lessons/${lesson._id}`)}>
                  <div className="w-8 h-8 rounded-full bg-card-hover border border-border flex items-center justify-center text-xs font-bold text-muted shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={11} className="text-muted" />
                      <span className="text-xs text-muted">{lesson.estimatedTime} min</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted shrink-0" />
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
