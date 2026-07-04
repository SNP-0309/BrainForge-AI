import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

export default function EmptyState({ icon: Icon = BookOpen, title = 'Nothing here yet', description = '', action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
        <Icon size={28} className="text-muted" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}
