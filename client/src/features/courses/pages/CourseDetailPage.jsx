import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, IndianRupee, ExternalLink, ShieldCheck, Check, Clock, User, Award, ArrowLeft } from 'lucide-react'
import api from '../../../config/api'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'

const learningOutlines = {
  default: [
    'Master core principles from basic configuration to production architecture.',
    'Build 5+ high-fidelity modern portfolio projects to showcase skills.',
    'Understand underlying concepts through real-world system analogies.',
    'Optimize performance, security parameters, and deploy to cloud engines.',
    'Prepare for job interviews with tailored placement QA banks.'
  ],
  dsa: [
    'Master Time & Space complexity analysis using Big-O notation.',
    'Implement linear data structures: Arrays, Linked Lists, Stacks, and Queues.',
    'Build and traverse non-linear structures: Trees, Heaps, and Graphs.',
    'Master key paradigms: recursion, sorting, searching, and dynamic programming.',
    'Solve 150+ interview-tier coding problems for top tech companies.'
  ],
  mern: [
    'Understand NoSQL database modeling using MongoDB and Mongoose.',
    'Build secure REST APIs using Node.js, Express, and JSON Web Tokens.',
    'Develop dynamic, interactive user interfaces using React Hooks & state.',
    'Implement real-time features using WebSockets and context listeners.',
    'Configure environment variables and deploy full-stack apps to production.'
  ]
};

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then(r => r.data.data),
  })

  const { data: lessons, isLoading: isLoadingLessons } = useQuery({
    queryKey: ['courseLessons', id],
    queryFn: () => api.get(`/courses/${id}/lessons`).then(r => r.data.data),
    enabled: !!course,
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <SkeletonLoader className="h-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonLoader className="h-60 md:col-span-2" />
          <SkeletonLoader className="h-60" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Card bg="#FFFDF6">
          <h2 className="text-xl font-black uppercase">Course Not Found</h2>
          <Button onClick={() => navigate('/courses')} className="mt-4">Back to Catalog</Button>
        </Card>
      </div>
    );
  }

  // Pick outline based on tags
  const isDsa = course.tags?.some(t => ['dsa', 'algorithms', 'java', 'c++'].includes(t.toLowerCase()));
  const isMern = course.tags?.some(t => ['mern', 'react', 'node.js', 'web development'].includes(t.toLowerCase()));
  const outline = isDsa ? learningOutlines.dsa : isMern ? learningOutlines.mern : learningOutlines.default;

  const originalPrice = Math.round(course.price * 1.8);

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-black py-4">
      {/* Back Button */}
      <Button 
        onClick={() => navigate('/courses')} 
        variant="secondary" 
        size="sm"
        className="flex items-center gap-1.5"
      >
        <ArrowLeft size={14} /> Back to Catalog
      </Button>

      {/* Course Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-[#FFE600] border-3 border-black shadow-brutal p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-black text-white border-2 border-black px-3 py-0.5 text-xs font-black rounded uppercase font-mono shadow-[2px_2px_0px_0px_#000]">
                  {course.platform}
                </span>
                <span className="bg-white border-2 border-black px-3 py-0.5 text-xs font-black rounded uppercase font-mono shadow-[2px_2px_0px_0px_#000]">
                  {course.difficulty}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black uppercase text-black leading-tight">
                {course.title}
              </h1>
              <p className="text-sm font-bold text-black/85 max-w-3xl leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center shrink-0">
                  <User size={14} className="text-black" />
                </div>
                <span className="text-xs font-mono font-black text-black">
                  INSTRUCTOR: <strong className="uppercase">{course.instructor}</strong>
                </span>
              </div>
            </div>

            {/* Price Segment */}
            <div className="bg-white border-[3px] border-black p-5 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full md:w-60 shrink-0 text-center space-y-4">
              {course.isPaid ? (
                <>
                  <div>
                    <span className="text-[10px] font-mono font-black text-black/50 block">SPECIAL OFFER</span>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-black/55 line-through font-mono">
                        ₹{originalPrice.toLocaleString('en-IN')}
                      </span>
                      <div className="text-2xl font-black text-black flex items-center font-mono">
                        ₹{course.price?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 border border-green-500 px-2 py-0.5 rounded mt-1.5 inline-block">
                      SAVE 45% OFF Today
                    </span>
                  </div>

                  <a 
                    href={course.buyUrl || 'https://www.udemy.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button 
                      className="w-full py-3 flex items-center justify-center gap-1.5 text-xs font-black uppercase"
                      bg="#4ADE80"
                    >
                      Buy Course <ExternalLink size={14} />
                    </Button>
                  </a>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[10px] font-mono font-black text-black/50 block">ACCESS</span>
                    <div className="text-2xl font-black text-black flex items-center justify-center font-mono mt-1">
                      FREE
                    </div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 border border-green-500 px-2 py-0.5 rounded mt-1.5 inline-block font-mono">
                      YOUTUBE COURSE
                    </span>
                  </div>

                  {lessons && lessons.length > 0 ? (
                    <Button 
                      onClick={() => navigate(`/lessons/${lessons[0]._id}`)}
                      className="w-full py-3 flex items-center justify-center gap-1.5 text-xs font-black uppercase"
                      bg="#4ADE80"
                    >
                      Start Learning
                    </Button>
                  ) : (
                    <Button 
                      loading={isLoadingLessons}
                      className="w-full py-3 flex items-center justify-center gap-1.5 text-xs font-black uppercase"
                      bg="#4ADE80"
                      onClick={() => {
                        if (course.buyUrl) {
                          window.open(course.buyUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      Watch Tutorial <ExternalLink size={14} />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Detail Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Outline / Syllabus */}
        <div className="md:col-span-2 space-y-6">
          <Card bg="#FFFFFF" className="p-6">
            <h2 className="text-lg font-black uppercase text-black mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-brutal-green" /> What You'll Learn in This Course
            </h2>

            <div className="space-y-3.5">
              {outline.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-brutal-green border-2 border-black flex items-center justify-center text-black shrink-0 mt-0.5">
                    <Check size={10} className="stroke-[3px]" />
                  </div>
                  <p className="text-xs font-bold text-black/85 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Seeded Curriculum Outline */}
          <Card bg="#FFFFFF" className="p-6">
            <h2 className="text-lg font-black uppercase text-black mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-brutal-purple" /> Course Curriculum Outline
            </h2>
            
            {course.isPaid ? (
              <div className="space-y-3">
                <div className="border-2 border-black p-3.5 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_0px_#000] bg-brutal-cream/20">
                  <span className="text-xs font-black uppercase text-black">Section 1: Course Setup & Fundamentals</span>
                  <span className="text-[10px] font-mono font-bold text-black/60">3 lectures • 45m</span>
                </div>
                <div className="border-2 border-black p-3.5 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_0px_#000] bg-brutal-cream/20">
                  <span className="text-xs font-black uppercase text-black">Section 2: Hands-on Concepts & Code Walkthroughs</span>
                  <span className="text-[10px] font-mono font-bold text-black/60">12 lectures • 2.5h</span>
                </div>
                <div className="border-2 border-black p-3.5 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_0px_#000] bg-brutal-cream/20">
                  <span className="text-xs font-black uppercase text-black">Section 3: Core Capstone Project Milestone</span>
                  <span className="text-[10px] font-mono font-bold text-black/60">2 lectures • 1.5h</span>
                </div>
                <div className="border-2 border-black p-3.5 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_0px_#000] bg-brutal-cream/20">
                  <span className="text-xs font-black uppercase text-black">Section 4: Performance Optimizations & Deployment</span>
                  <span className="text-[10px] font-mono font-bold text-black/60">4 lectures • 1h</span>
                </div>
              </div>
            ) : isLoadingLessons ? (
              <div className="space-y-3">
                <SkeletonLoader className="h-12" count={3} />
              </div>
            ) : lessons && lessons.length > 0 ? (
              <div className="space-y-3">
                {lessons.map((lesson, idx) => (
                  <div 
                    key={lesson._id} 
                    onClick={() => navigate(`/lessons/${lesson._id}`)}
                    className="border-2 border-black p-3.5 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_0px_#000] bg-white hover:bg-brutal-cream/20 cursor-pointer transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_#000]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-brutal-purple border border-black w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-black uppercase text-black line-clamp-1">{lesson.title}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-black/60 shrink-0 ml-4">{lesson.estimatedTime}m</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs font-bold text-black/50 py-4 text-center">
                No lessons found for this course.
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Info Cards */}
        <div className="space-y-6">
          <Card bg="#E9D5FF" className="p-5 border-3 border-black space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Award size={18} /> Features Included
            </h3>
            
            <ul className="text-xs font-bold space-y-2.5 list-disc list-inside leading-relaxed text-black/85">
              <li>Full lifetime access to course</li>
              <li>Completion Certificate included</li>
              <li>Premium downloadable cheat sheets</li>
              <li>Cohort community doubt support</li>
              <li>15+ exercises and interview questions</li>
            </ul>
          </Card>

          <Card bg="#FFFDF6" className="p-5 space-y-4 border-2 border-black">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} /> Course Duration
            </h3>
            <p className="text-xs font-bold text-black/75 leading-relaxed">
              This course covers approximately <strong>{course.duration} hours</strong> of video instructions, coding labs, and self-evaluation challenges.
            </p>
          </Card>
        </div>

      </div>
    </div>
  );
}

