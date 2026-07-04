import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Search, Filter } from 'lucide-react'
import api from '../../../config/api'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Badge from '../../../components/ui/Badge'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import EmptyState from '../../../components/ui/EmptyState'

const difficultyVariant = { beginner: 'success', intermediate: 'warning', advanced: 'danger' }

export default function CourseCatalogPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, difficulty],
    queryFn: () => api.get('/courses', { params: { search, difficulty, limit: 20 } }).then(r => r.data.data),
    placeholderData: d => d,
  })

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Course Catalog</h1>
        <p className="text-sm text-muted mt-1">Discover and enroll in expert-crafted courses</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input icon={Search} placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonLoader className="h-40" count={6} />
        </div>
      ) : !data?.courses?.length ? (
        <EmptyState icon={BookOpen} title="No courses found" description="Try adjusting your search or filters" />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.courses.map(course => (
            <motion.div key={course._id} variants={item}>
              <Card hover className="cursor-pointer h-full flex flex-col gap-3" onClick={() => navigate(`/courses/${course._id}`)}>
                <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <BookOpen size={32} className="text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{course.title}</h3>
                    <Badge variant={difficultyVariant[course.difficulty] ?? 'default'} className="shrink-0">
                      {course.difficulty}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted line-clamp-2">{course.description}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {course.tags?.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="default" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
