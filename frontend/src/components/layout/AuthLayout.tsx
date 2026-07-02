import { Outlet, Navigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAppSelector(s => s.auth)
  if (loading) return null
  if (isAuthenticated) return <Navigate to="/feed" replace />

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-900">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/5"
              style={{ width: `${120 + i * 80}px`, height: `${120 + i * 80}px`, top: `${10 + i * 12}%`, left: `${-20 + i * 8}%` }} />
          ))}
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl font-black">C</span>
            </div>
            <span className="text-2xl font-bold">CareerTrack</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-6">
            Connect. Collaborate.<br />Grow Your Career.
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed mb-10">
            The professional platform for tech talent — network with peers, collaborate on projects, and land your next opportunity.
          </p>
          <div className="space-y-4">
            {[
              { icon: '🌐', text: 'Professional networking for tech' },
              { icon: '💬', text: 'Real-time team collaboration' },
              { icon: '📋', text: 'Kanban project management' },
              { icon: '🚀', text: 'Job opportunities & portfolio' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-primary-100">
                <span className="text-xl">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-white">CareerTrack</span>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}
