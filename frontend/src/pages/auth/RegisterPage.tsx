import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, AtSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  full_name: z.string().min(2, 'At least 2 characters'),
  username: z.string().min(3, 'At least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await authService.register(data)
      toast.success('Account created! Please check your email to verify.')
      navigate('/login')
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Create account</h1>
        <p className="text-surface-500">Join the tech professional community</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Jane Doe"
          leftIcon={<User size={16} />}
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <Input
          label="Username"
          placeholder="janedoe"
          leftIcon={<AtSign size={16} />}
          error={errors.username?.message}
          hint="Used in your profile URL"
          {...register('username')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min 8 chars, uppercase, number"
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" fullWidth loading={loading} size="lg">
          Create Account
        </Button>
      </form>

      <p className="mt-4 text-xs text-surface-400 text-center">
        By signing up, you agree to our{' '}
        <span className="link">Terms of Service</span> and{' '}
        <span className="link">Privacy Policy</span>
      </p>

      <p className="mt-4 text-center text-sm text-surface-500">
        Already have an account?{' '}
        <Link to="/login" className="link font-medium">Sign in</Link>
      </p>
    </div>
  )
}
