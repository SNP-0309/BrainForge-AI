import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, BookOpen, Zap } from 'lucide-react'
import api from '../../../config/api'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'

function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function LessonPlayerPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => api.get(`/lessons/${id}`).then(r => r.data.data),
  })

  const { mutate: completeLesson, isPending, data: reward } = useMutation({
    mutationFn: () => api.post(`/lessons/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', id] })
      queryClient.invalidateQueries({ queryKey: ['authUser'] })
    },
  })

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <SkeletonLoader className="h-12" /><SkeletonLoader className="h-96" />
    </div>
  )

  const youtubeId = getYouTubeId(lesson?.videoUrl)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-sm text-muted mb-2">
          <BookOpen size={14} />
          <span>{lesson?.course?.title}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{lesson?.title}</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5 text-muted text-xs">
            <Clock size={13} /> {lesson?.estimatedTime} min
          </div>
          {lesson?.isAiGenerated && <span className="text-xs text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">✦ AI Generated</span>}
        </div>
      </motion.div>

      {/* Video Player */}
      {youtubeId && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full border-[3px] border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-black"
        >
          <iframe
            className="w-full aspect-video"
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
            title={lesson?.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </motion.div>
      )}

      {/* Lesson Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card>
          <div
            className="prose prose-invert prose-sm max-w-none text-foreground leading-relaxed"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {lesson?.content}
          </div>
        </Card>
      </motion.div>

      {/* Resources */}
      {lesson?.resources?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-foreground mb-2">Resources</h3>
          <ul className="space-y-1">
            {lesson.resources.map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">{r.name}</a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Reward Banner */}
      {reward && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
          <Zap size={20} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Lesson Complete! 🎉</p>
            <p className="text-xs text-muted">Keep going and continue your roadmap progression.</p>
          </div>
        </motion.div>
      )}

      {/* Complete Button */}
      <Button onClick={() => completeLesson()} loading={isPending} className="w-full" size="lg">
        <CheckCircle size={16} /> Mark as Complete
      </Button>
    </div>
  )
}
