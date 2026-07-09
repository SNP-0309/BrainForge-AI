import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-brutal-yellow text-black border-[3px] border-black shadow-brutal font-extrabold',
  secondary: 'bg-white text-black border-[3px] border-black shadow-brutal font-extrabold',
  ghost: 'text-black hover:bg-black/10 font-bold',
  danger: 'bg-brutal-pink text-black border-[3px] border-black shadow-brutal font-extrabold',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <motion.button
      whileHover={disabled || loading ? {} : { x: -3, y: -3, boxShadow: '7px 7px 0px 0px #000000' }}
      whileTap={disabled || loading ? {} : { x: 3, y: 3, boxShadow: '0px 0px 0px 0px #000000' }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl
        transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </motion.button>
  )
}
