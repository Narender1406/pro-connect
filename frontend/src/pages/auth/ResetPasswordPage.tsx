import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return toast.error('Password must be at least 8 characters')
    if (password !== confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await authService.resetPassword(token!, password)
      toast.success('Password reset successfully')
      navigate('/login')
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Reset failed. Link may have expired.')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Reset password</h1>
        <p className="text-surface-500">Enter your new password below</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="New Password" type="password" placeholder="Min 8 characters" leftIcon={<Lock size={16} />} value={password} onChange={e => setPassword(e.target.value)} required hint="Min 8 chars, include uppercase and number" />
        <Input label="Confirm Password" type="password" placeholder="Confirm password" leftIcon={<Lock size={16} />} value={confirm} onChange={e => setConfirm(e.target.value)} required error={confirm && password !== confirm ? "Passwords don't match" : undefined} />
        <Button type="submit" fullWidth loading={loading} size="lg">Reset Password</Button>
      </form>
    </div>
  )
}
