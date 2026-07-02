import { clsx } from 'clsx'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'purple'

interface Props {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  gray: 'badge-gray',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 badge',
}

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  gray: 'bg-surface-400',
  purple: 'bg-purple-500',
}

export default function Badge({ children, variant = 'gray', size = 'md', dot, className }: Props) {
  return (
    <span className={clsx(variants[variant], size === 'sm' && 'text-[10px] py-0', className)}>
      {dot && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`} />}
      {children}
    </span>
  )
}
