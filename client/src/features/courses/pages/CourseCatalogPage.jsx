import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Search, Sparkles, ExternalLink, IndianRupee, Tag, ShieldCheck } from 'lucide-react'
import api from '../../../config/api'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Badge from '../../../components/ui/Badge'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import EmptyState from '../../../components/ui/EmptyState'
import Button from '../../../components/ui/Button'

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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-6xl mx-auto space-y-8 text-black"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-[3px] border-black bg-white p-6 md:p-8 rounded-2xl shadow-brutal">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-brutal-pink border-2 border-black px-3.5 py-1 text-xs font-black uppercase rounded-lg shadow-[2.5px_2.5px_0px_0px_#000] mb-4">
            <ShieldCheck size={14} /> Expert-Curated Resources
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wide leading-none">
            Curated Course Recommendations
          </h1>
          <p className="text-sm md:text-base font-bold text-black/75 mt-3 max-w-2xl">
            Discover the best courses, bootcamps, and learning resources hand-picked by experts to guide your tech career forward.
          </p>
        </div>

        <div className="bg-brutal-yellow border-2 border-black px-4 py-3 rounded-xl shadow-[3px_3px_0px_0px_#000] text-center min-w-[120px] shrink-0">
          <span className="text-xs font-mono font-bold block opacity-70">LEARNING PLATFORMS</span>
          <span className="text-sm font-black block uppercase">Udemy & More</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input icon={Search} placeholder="Search recommended courses by title, instructor, or technology..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
          className="bg-white border-[3px] border-black rounded-xl px-4 py-3 text-sm text-black font-semibold shadow-[2px_2px_0px_0px_#000000] focus:shadow-[4px_4px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] outline-none transition-all cursor-pointer"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonLoader className="h-56" count={6} />
        </div>
      ) : !data?.courses?.length ? (
        <EmptyState icon={BookOpen} title="No courses found" description="Try adjusting your search query or level filters" />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.courses.map(course => {
            const colors = ['bg-[#FFE600]', 'bg-[#4ADE80]', 'bg-[#FFAED7]', 'bg-[#E9D5FF]'];
            const randomColor = colors[course.title.charCodeAt(0) % colors.length];
            return (
              <motion.div key={course._id} variants={item} className="h-full">
                <Card 
                  hover 
                  className="cursor-pointer h-full flex flex-col justify-between overflow-hidden p-0 bg-white"
                  onClick={() => window.open(course.buyUrl || 'https://www.udemy.com', '_blank', 'noopener,noreferrer')}
                >
                  <div>
                    {/* Header Banner */}
                    <div className="w-full h-36 border-b-[3px] border-black relative overflow-hidden flex flex-col justify-between p-4 bg-black">
                      {course.thumbnail ? (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-300 z-0"
                        />
                      ) : (
                        <div className={`absolute inset-0 w-full h-full z-0 ${randomColor}`} />
                      )}
                      
                      <div className="flex items-center justify-between z-10 relative">
                        <span className="bg-black text-white border border-black px-2 py-0.5 text-[9px] font-black rounded uppercase font-mono shadow-[1px_1px_0px_0px_#000]">
                          {course.platform || 'Premium'}
                        </span>
                        <Badge variant={difficultyVariant[course.difficulty] ?? 'default'} className="border border-black">
                          {course.difficulty}
                        </Badge>
                      </div>
                      
                      {/* Price Tag */}
                      <div className="bg-white border-2 border-black px-2.5 py-1 text-xs font-black rounded-lg shadow-[2px_2px_0px_0px_#000] self-start flex items-center gap-0.5 z-10 relative">
                        <IndianRupee size={12} className="stroke-[3px]" />
                        {course.price?.toLocaleString('en-IN') || 'Paid'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <span className="text-[10px] font-black uppercase text-black/60 tracking-wider">
                        {course.instructor || 'Industry Expert'}
                      </span>
                      <h3 className="text-base font-black text-black uppercase leading-tight line-clamp-2 hover:underline">
                        {course.title}
                      </h3>
                      <p className="text-xs text-black/75 line-clamp-3 font-semibold leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-5 pt-0 space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {course.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-brutal-cream border border-black px-2.5 py-0.5 text-[10px] font-bold text-black rounded-md flex items-center gap-1 font-mono">
                          <Tag size={10} /> {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses/${course._id}`);
                        }}
                        variant="secondary"
                        className="flex-1 text-xs py-2.5"
                      >
                        Details
                      </Button>
                      <a 
                        href={course.buyUrl || 'https://www.udemy.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1"
                      >
                        <Button 
                          className="w-full text-xs font-black py-2.5 flex items-center justify-center gap-1"
                          bg="#4ADE80"
                        >
                          Start Learning <ExternalLink size={12} />
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
