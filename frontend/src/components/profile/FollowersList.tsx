import { useQuery } from '@tanstack/react-query'
import { userService } from '../../services'
import Avatar from '../ui/Avatar'
import Skeleton from '../ui/Skeleton'
import type { UserProfile } from '../../types'

interface FollowersListProps {
  userId: string
  type: 'followers' | 'following'
}

export default function FollowersList({ userId, type }: FollowersListProps) {
  const { data, isLoading } = useQuery({
    queryKey: [type, userId],
    queryFn: () => (type === 'followers' ? userService.getFollowers : userService.getFollowing)(userId).then(r => r.data.data.users),
  })

  if (isLoading) return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
        </div>
      ))}
    </div>
  )

  if (!data?.length) return (
    <div className="text-center py-8 text-surface-500 text-sm">
      No {type} yet.
    </div>
  )

  return (
    <div className="space-y-3">
      {data.map((u: any) => (
        <a key={u.id} href={`/profile/${u.username}`}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
          <Avatar src={u.avatar_url} name={u.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-surface-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">
              {u.full_name}
            </p>
            {u.headline && (
              <p className="text-xs text-surface-500 truncate">{u.headline}</p>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}
