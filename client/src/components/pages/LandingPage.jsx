import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { Zap, Compass, PlayCircle, BookOpen, Bot, Trophy, ShieldCheck, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-brutal-cream text-black flex flex-col justify-between">
      
      {/* Header */}
      <header className="px-6 py-4 border-b-4 border-black bg-white flex items-center justify-between z-10 sticky top-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <Compass size={18} className="text-black" />
          </div>
          <span className="font-mono text-base font-black tracking-wider uppercase">
            AI CAREER GUIDANCE
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button bg="#4ADE80" className="text-xs font-black uppercase py-2">
                Dashboard <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="secondary" className="text-xs font-black uppercase py-2">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button bg="#FFE600" className="text-xs font-black uppercase py-2">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 md:py-20 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Hero Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#FFE600] border-2 border-black px-3.5 py-1 text-xs font-black uppercase rounded shadow-[2.5px_2.5px_0px_0px_#000]">
              <ShieldCheck size={14} /> AI-Powered Learning Guide
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">
              Find Your <br />
              <span className="bg-brutal-pink px-2.5 py-1 border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] inline-block mt-2">
                Learning Path
              </span>
            </h1>

            <p className="text-sm md:text-base font-bold text-black/75 max-w-lg leading-relaxed">
              AI Career Guidance is your personal learning compass. We guide you to the best free YouTube channels, curated study roadmaps, and proven learning strategies — so you always know what to learn, where to learn it, and how to learn effectively.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to={user ? "/dashboard" : "/register"}>
                <Button bg="#4ADE80" className="text-sm font-black uppercase px-6 py-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  Start Your Journey <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </Link>
              <Link to="/courses">
                <Button variant="secondary" className="text-sm font-black uppercase px-6 py-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white hover:bg-brutal-cream">
                  Explore Learning Resources
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Decorative Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-black rounded-2xl translate-x-3 translate-y-3" />
            <div className="border-[3px] border-black bg-white p-6 md:p-8 rounded-2xl relative z-10 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brutal-purple border-2 border-black flex items-center justify-center font-black">
                  🧭
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase leading-tight">Your Learning Compass</h3>
                  <span className="text-[10px] font-mono font-bold text-black/55">GUIDED LEARNING MODULES</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="border-2 border-black p-2.5 rounded-lg flex items-center justify-between bg-brutal-cream/25">
                  <span className="text-xs font-black uppercase">1. AI Career Discovery</span>
                  <span className="text-[9px] font-mono font-black text-green-700 bg-green-100 border border-green-400 px-1.5 py-0.5 rounded">ONLINE</span>
                </div>
                <div className="border-2 border-black p-2.5 rounded-lg flex items-center justify-between bg-brutal-cream/25">
                  <span className="text-xs font-black uppercase">2. Curated Study Roadmaps</span>
                  <span className="text-[9px] font-mono font-black text-green-700 bg-green-100 border border-green-400 px-1.5 py-0.5 rounded">STEP-BY-STEP</span>
                </div>
                <div className="border-2 border-black p-2.5 rounded-lg flex items-center justify-between bg-brutal-cream/25">
                  <span className="text-xs font-black uppercase">3. Best Channels & Resources</span>
                  <span className="text-[9px] font-mono font-black text-green-700 bg-green-100 border border-green-400 px-1.5 py-0.5 rounded">160+ VIDEOS</span>
                </div>
                <div className="border-2 border-black p-2.5 rounded-lg flex items-center justify-between bg-brutal-cream/25">
                  <span className="text-xs font-black uppercase">4. AI Doubt Solver</span>
                  <span className="text-[9px] font-mono font-black text-green-700 bg-green-100 border border-green-400 px-1.5 py-0.5 rounded">24/7 HELP</span>
                </div>
                <div className="border-2 border-black p-2.5 rounded-lg flex items-center justify-between bg-brutal-cream/25">
                  <span className="text-xs font-black uppercase">5. Practice & Brain Games</span>
                  <span className="text-[9px] font-mono font-black text-green-700 bg-green-100 border border-green-400 px-1.5 py-0.5 rounded">QUIZ & MATCH</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Feature Cards Grid */}
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-center">
            How We Guide Your Learning
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Card hover bg="#FFFFFF" className="p-6 border-3 border-black space-y-4">
              <div className="w-11 h-11 rounded-xl border-2 border-black bg-brutal-yellow flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                <Compass size={20} className="text-black" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wide">AI Career Discovery</h3>
              <p className="text-xs text-black/75 font-semibold leading-relaxed">
                Take an interactive assessment that maps your natural strengths and interests to 3 personalized career paths in tech.
              </p>
            </Card>

            <Card hover bg="#FFFFFF" className="p-6 border-3 border-black space-y-4">
              <div className="w-11 h-11 rounded-xl border-2 border-black bg-brutal-pink flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                <PlayCircle size={20} className="text-black" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wide">Best Channels & Roadmaps</h3>
              <p className="text-xs text-black/75 font-semibold leading-relaxed">
                We curate the best free YouTube channels, playlists, and learning roadmaps so you always know exactly what to watch and study next.
              </p>
            </Card>

            <Card hover bg="#FFFFFF" className="p-6 border-3 border-black space-y-4">
              <div className="w-11 h-11 rounded-xl border-2 border-black bg-brutal-purple flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                <Bot size={20} className="text-black" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wide">AI Doubt Solver</h3>
              <p className="text-xs text-black/75 font-semibold leading-relaxed">
                Stuck while studying? Ask our AI tutor anything — get clear explanations, code examples, and guidance in real time.
              </p>
            </Card>

            <Card hover bg="#FFFFFF" className="p-6 border-3 border-black space-y-4">
              <div className="w-11 h-11 rounded-xl border-2 border-black bg-brutal-green flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                <Trophy size={20} className="text-black" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wide">Practice & Brain Games</h3>
              <p className="text-xs text-black/75 font-semibold leading-relaxed">
                Reinforce what you learn with AI-generated quizzes, memory matching games, and flashcards built around your study topics.
              </p>
            </Card>

            <Card hover bg="#FFFFFF" className="p-6 border-3 border-black space-y-4 md:col-span-2 lg:col-span-1">
              <div className="w-11 h-11 rounded-xl border-2 border-black bg-brutal-blue flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                <BookOpen size={20} className="text-black" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wide">Recommended Courses</h3>
              <p className="text-xs text-black/75 font-semibold leading-relaxed">
                Explore our hand-picked selection of the best paid courses, bootcamps, and certifications when you're ready to level up.
              </p>
            </Card>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t-4 border-black px-6 py-6 text-center z-10 shrink-0">
        <p className="text-xs font-mono font-black uppercase text-black/60">
          © {new Date().getFullYear()} AI Career Guidance. All rights reserved.
        </p>
      </footer>

    </div>
  )
}
