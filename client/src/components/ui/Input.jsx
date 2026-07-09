import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className = '', icon: Icon, ...props }, ref) => {
  return (
    <div className="space-y-1.5 text-black">
      {label && (
        <label className="block text-sm font-black uppercase tracking-wider">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black z-10">
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-white border-[3px] rounded-xl px-4 py-3 text-sm text-black
            placeholder:text-gray-500/80 transition-all duration-100 font-semibold
            focus:outline-none focus:translate-x-[-1px] focus:translate-y-[-1px]
            ${error 
              ? 'border-red-500 text-red-600 shadow-[2px_2px_0px_0px_#EF4444] focus:shadow-[4px_4px_0px_0px_#EF4444]' 
              : 'border-black shadow-[2px_2px_0px_0px_#000000] focus:shadow-[4px_4px_0px_0px_#000000]'
            }
            ${Icon ? 'pl-10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600 font-bold mt-1">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
