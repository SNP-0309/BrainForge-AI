import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-brutal-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-white border-[3px] border-black rounded-2xl p-8 text-center shadow-brutal-lg space-y-6"
      >
        {/* Animated Icon Container */}
        <div className="flex justify-center">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 2.5, ease: "linear" },
              scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
            }}
            className="w-16 h-16 rounded-2xl bg-brutal-yellow border-[3px] border-black flex items-center justify-center shadow-brutal"
          >
            <Compass size={32} className="text-black" />
          </motion.div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-wider text-black">
            BrainForge AI
          </h1>
          <p className="text-xs font-bold text-black/65 uppercase tracking-wide">
            Forging your learning path...
          </p>
        </div>

        {/* Custom Retro Loading Bar */}
        <div className="relative w-full h-5 border-[3px] border-black bg-white rounded-md overflow-hidden p-0.5">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
            className="h-full bg-brutal-green rounded-sm border-r-2 border-black"
          />
        </div>
      </motion.div>
    </div>
  )
}
