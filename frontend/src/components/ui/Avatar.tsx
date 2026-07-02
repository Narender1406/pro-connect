import type { User } from '../../types'

interface Props {
  user?: Partial<User> | null
  // Legacy props for compatibility
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const colors = [
  'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
]

export default function Avatar({ user, src, name, size = 'md', className = '', onClick }: Props) {
  // Support both user object and legacy src/name props
  const avatarUrl = src ?? user?.avatar_url ?? null
  const displayName = name ?? user?.full_name ?? null

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const colorIdx = displayName ? displayName.charCodeAt(0) % colors.length : 0

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || 'Avatar'}
        onClick={onClick}
        className={`rounded-full object-cover flex-shrink-0 ${sizes[size]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      />
    )
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${sizes[size]} ${colors[colorIdx]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {initials}
    </div>
  )
}
