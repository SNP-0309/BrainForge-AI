const variants = {
  default: 'bg-white border-2 border-black text-black',
  primary: 'bg-brutal-yellow border-2 border-black text-black',
  success: 'bg-brutal-green border-2 border-black text-black',
  warning: 'bg-brutal-yellow border-2 border-black text-black',
  danger: 'bg-brutal-pink border-2 border-black text-black',
  accent: 'bg-brutal-purple border-2 border-black text-black',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
