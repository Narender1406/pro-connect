import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authService } from '../../services/authService'

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    authService.verifyEmail(token!)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="text-center">
      {status === 'loading' && (
        <>
          <Loader2 size={40} className="animate-spin text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Verifying your email...</h2>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Email verified!</h2>
          <p className="text-surface-500 mb-6">Your account is ready. Sign in to get started.</p>
          <Link to="/login" className="btn-primary btn">Sign In</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Verification failed</h2>
          <p className="text-surface-500 mb-6">The link is invalid or expired. Please request a new verification email.</p>
          <Link to="/login" className="btn-secondary btn">Back to login</Link>
        </>
      )}
    </div>
  )
}
