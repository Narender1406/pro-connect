import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}
const sizes = { sm: 'btn-sm', md: '', lg: 'btn-lg' }

export default function Button({ variant = 'primary', size = 'md', loading, icon, fullWidth, children, className, disabled, ...props }: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(variants[variant], sizes[size], fullWidth && 'w-full', className)}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}
