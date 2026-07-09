import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { registerWithEmail, loginWithGoogle } from '../../../config/firebase'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { Mail, Lock, User, Zap } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function RegisterPage() {
  const [authError, setAuthError] = useState('')
  const [oauthLoading, setOauthLoading] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ name, email, password }) => {
    setAuthError('')
    try {
      await registerWithEmail(name, email, password)
    } catch (err) {
      setAuthError(err.code === 'auth/email-already-in-use' ? 'This email is already registered' : err.message)
    }
  }

  const handleOAuth = async (name) => {
    setOauthLoading(name)
    try {
      if (name === 'google') {
        await loginWithGoogle()
      }
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setOauthLoading('')
    }
  }

  return (
    <div className="min-h-screen bg-brutal-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brutal-yellow border-[3px] border-black shadow-brutal mb-4">
            <Zap size={22} className="text-black fill-black" />
          </div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wider">Create your account</h1>
          <p className="text-sm text-black/70 font-bold mt-1">Start learning for free today</p>
        </div>

        <div className="bg-white border-[3px] border-black rounded-2xl p-8 space-y-5 shadow-brutal-lg">
          <Button variant="secondary" className="w-full font-black" loading={oauthLoading === 'google'} onClick={() => handleOAuth('google')}>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24"><path fill="#000000" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#000000" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#000000" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#000000" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-[2.5px] bg-black" />
            <span className="text-xs text-black font-black uppercase tracking-wider">or</span>
            <div className="flex-1 h-[2.5px] bg-black" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" icon={User} placeholder="Your name" error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" icon={Mail} placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" icon={Lock} placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm Password" type="password" icon={Lock} placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            {authError && <p className="text-xs text-red-600 font-bold bg-red-100 border-2 border-red-500 rounded-xl px-4 py-2.5">{authError}</p>}
            <Button type="submit" className="w-full py-3.5" loading={isSubmitting}>Create Account</Button>
          </form>

          <p className="text-center text-xs text-black font-bold">
            Already have an account?{' '}
            <Link to="/login" className="text-black font-black underline hover:text-gray-700">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
