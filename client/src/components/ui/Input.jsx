import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className = '', icon: Icon, ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-muted">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-card border rounded-lg px-3 py-2.5 text-sm text-foreground
            placeholder:text-muted/50 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60
            ${error ? 'border-red-500/50 focus:ring-red-500/30' : 'border-border'}
            ${Icon ? 'pl-9' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
