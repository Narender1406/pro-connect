import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail size={24} className="text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-surface-900 dark:text-white">Check your email</h2>
        <p className="text-surface-500 mb-6">If an account exists for <strong>{email}</strong>, we sent a password reset link.</p>
        <Link to="/login" className="btn-secondary">Back to sign in</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-2">Forgot password?</h1>
        <p className="text-surface-500">Enter your email and we'll send a reset link</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" leftIcon={<Mail size={16} />} value={email} onChange={e => setEmail(e.target.value)} required />
        <Button type="submit" fullWidth loading={loading} size="lg">Send Reset Link</Button>
      </form>
      <p className="mt-6 text-center text-sm text-surface-500">
        <Link to="/login" className="link">Back to sign in</Link>
      </p>
    </div>
  )
}
