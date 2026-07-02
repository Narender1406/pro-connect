import { clsx } from 'clsx'

interface Props {
  className?: string
}

// Default export for simple usage: <Skeleton className="w-32 h-4" />
export default function Skeleton({ className = '' }: Props) {
  return <div className={clsx('animate-pulse bg-surface-200 dark:bg-surface-700 rounded', className)} />
}

export function SkeletonLine({ className = '' }: Props) {
  return <div className={clsx('skeleton h-4 rounded', className)} />
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }
  return <div className={clsx('skeleton rounded-full', sizes[size])} />
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-32" />
          <SkeletonLine className="w-24 h-3" />
        </div>
      </div>
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-3/4" />
      <SkeletonLine className="w-1/2" />
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={i === lines - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  )
}
