import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface-50 dark:bg-surface-900">
      <div className="text-center">
        <h1 className="text-8xl font-black text-primary-200 dark:text-primary-900 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Page not found</h2>
        <p className="text-surface-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/feed" className="btn-primary btn">Go to Feed</Link>
      </div>
    </div>
  )
}
