import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  onClose?: () => void
}

const icons = {
  success: <CheckCircle size={18} className="text-green-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  warning: <AlertCircle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-blue-500" />,
}

const colors = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={`card shadow-lg px-4 py-3 flex items-center gap-3 border-l-4 ${colors[type]} min-w-[280px] max-w-sm`}
    >
      {icons[type]}
      <p className="flex-1 text-sm text-surface-800 dark:text-surface-200">{message}</p>
      {onClose && (
        <button onClick={onClose} className="btn-ghost p-0.5"><X size={14} /></button>
      )}
    </motion.div>
  )
}
