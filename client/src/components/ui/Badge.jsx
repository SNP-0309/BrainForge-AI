const variants = {
  default: 'bg-card border border-border text-muted',
  primary: 'bg-primary/10 border border-primary/30 text-primary',
  success: 'bg-green-500/10 border border-green-500/30 text-green-400',
  warning: 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400',
  danger: 'bg-red-500/10 border border-red-500/30 text-red-400',
  accent: 'bg-accent/10 border border-accent/30 text-accent',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
