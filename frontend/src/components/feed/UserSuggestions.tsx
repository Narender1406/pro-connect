import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { userService } from '../../services'
import Avatar from '../ui/Avatar'
import { useAppSelector } from '../../store/hooks'
import type { User } from '../../types'

export default function UserSuggestions() {
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['user-suggestions'],
    queryFn: () => userService.getSuggestions().then(r => r.data.suggestions as User[]),
    staleTime: 5 * 60 * 1000,
  })

  const followMutation = useMutation({
    mutationFn: (id: string) => userService.followUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-suggestions'] }),
  })

  if (!data?.length) return null

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-surface-900 dark:text-white text-sm mb-3">People you may know</h3>
      <div className="space-y-3">
        {data.map(person => (
          <div key={person.id} className="flex items-center gap-3">
            <Avatar user={person} size="sm" onClick={() => navigate(`/profile/${person.username}`)} />
            <div className="flex-1 min-w-0">
              <button className="text-sm font-medium text-surface-900 dark:text-white hover:underline truncate block" onClick={() => navigate(`/profile/${person.username}`)}>
                {person.full_name}
              </button>
              {person.headline && <p className="text-xs text-surface-500 truncate">{person.headline}</p>}
            </div>
            <button
              onClick={() => followMutation.mutate(person.id)}
              className="btn-secondary btn-sm flex-shrink-0"
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
