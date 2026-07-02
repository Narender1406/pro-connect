import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '../../store/hooks'
import { userService } from '../../services'
import Avatar from '../ui/Avatar'
import { MapPin, Link2, Github, Briefcase, GraduationCap, Star, UserPlus, UserCheck, Loader2 } from 'lucide-react'
import type { UserProfile } from '../../types'

interface ProfileCardProps {
  userId: string
}

export default function ProfileCard({ userId }: ProfileCardProps) {
  const currentUser = useAppSelector(s => s.auth.user)
  const qc = useQueryClient()
  const isOwn = currentUser?.id === userId

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => userService.getProfile(userId).then(r => r.data.profile as UserProfile),
  })

  const followMutation = useMutation({
    mutationFn: () => profile?.is_following ? userService.unfollowUser(userId) : userService.followUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', userId] }),
  })

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <Loader2 size={24} className="animate-spin text-primary-500" />
    </div>
  )

  if (!profile) return null

  return (
    <div className="space-y-4">
      {/* Cover + Avatar */}
      <div className="relative">
        <div className="h-28 bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl overflow-hidden">
          {profile.cover_url && (
            <img src={profile.cover_url} alt="cover" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="absolute -bottom-5 left-4">
          <Avatar src={profile.avatar_url} name={profile.full_name} size="lg"
            className="ring-4 ring-white dark:ring-surface-900 w-16 h-16" />
        </div>
      </div>

      <div className="pt-6 px-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">{profile.full_name}</h2>
            <p className="text-sm text-surface-500">@{profile.username}</p>
          </div>
          {!isOwn && (
            <button onClick={() => followMutation.mutate()} disabled={followMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                profile.is_following ? 'btn-secondary' : 'btn-primary'
              }`}>
              {profile.is_following ? <UserCheck size={14} /> : <UserPlus size={14} />}
              {profile.is_following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {profile.headline && (
          <p className="text-sm text-surface-700 dark:text-surface-300 mt-1">{profile.headline}</p>
        )}

        <div className="flex gap-4 mt-3 text-sm text-surface-500">
          <span><span className="font-semibold text-surface-900 dark:text-white">{profile.followers_count}</span> followers</span>
          <span><span className="font-semibold text-surface-900 dark:text-white">{profile.following_count}</span> following</span>
        </div>

        {/* Meta info */}
        <div className="mt-3 space-y-1.5 text-xs text-surface-500">
          {profile.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-1.5">
              <Link2 size={12} />
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="text-primary-600 hover:underline truncate">{profile.website}</a>
            </div>
          )}
          {profile.github_username && (
            <div className="flex items-center gap-1.5">
              <Github size={12} />
              <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noopener noreferrer"
                className="text-primary-600 hover:underline">@{profile.github_username}</a>
            </div>
          )}
        </div>

        {/* Open to work badge */}
        {profile.open_to_work && (
          <div className="mt-3 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-lg inline-flex items-center gap-1.5">
            <Star size={12} />
            Open to Work
          </div>
        )}

        {/* Skills preview */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase mb-2 flex items-center gap-1.5">
              <Star size={12} /> Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 6).map(s => (
                <span key={s.name} className="px-2 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded text-xs">
                  {s.name}
                </span>
              ))}
              {profile.skills.length > 6 && (
                <span className="px-2 py-0.5 text-surface-500 text-xs">+{profile.skills.length - 6} more</span>
              )}
            </div>
          </div>
        )}

        {/* Latest experience */}
        {profile.experience && profile.experience.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase mb-2 flex items-center gap-1.5">
              <Briefcase size={12} /> Experience
            </p>
            <div className="text-sm">
              <p className="font-medium text-surface-900 dark:text-white">{profile.experience[0].title}</p>
              <p className="text-surface-500">{profile.experience[0].company}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
