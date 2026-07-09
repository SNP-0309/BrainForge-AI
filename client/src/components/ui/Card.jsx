import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = false, bg = 'bg-white', ...props }) {
  return (
    <motion.div
      whileHover={hover ? { x: -3, y: -3, boxShadow: '7px 7px 0px 0px #000000' } : {}}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`${bg} border-[3px] border-black rounded-xl p-5 shadow-brutal text-black ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
