import { motion } from 'framer-motion'

export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' } : {}}
      transition={{ duration: 0.2 }}
      className={`bg-card border border-border rounded-lg p-4 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
