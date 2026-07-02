import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { loginUser } from '../../store/slices/authSlice'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
  totp_code: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector(s => s.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [needs2FA, setNeeds2FA] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const result = await dispatch(loginUser(data))
    if (loginUser.fulfilled.match(result)) {
      navigate('/feed')
    } else if ((result.payload as string)?.includes('2FA')) {
      setNeeds2FA(true)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Welcome back</h1>
        <p className="text-surface-500">Sign in to your CareerTrack account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Your password"
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          error={errors.password?.message}
          autoComplete="current-password"
          {...register('password')}
        />

        {needs2FA && (
          <Input
            label="Two-Factor Code"
            placeholder="6-digit code"
            maxLength={6}
            error={errors.totp_code?.message}
            {...register('totp_code')}
          />
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="link">Forgot password?</Link>
        </div>

        <Button type="submit" fullWidth loading={loading} size="lg">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Don't have an account?{' '}
        <Link to="/register" className="link font-medium">Create one free</Link>
      </p>
    </div>
  )
}
