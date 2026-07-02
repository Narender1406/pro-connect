import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, Hash, TrendingUp } from 'lucide-react'
import { userService, postService } from '../services'
import Avatar from '../components/ui/Avatar'
import PostCard from '../components/feed/PostCard'
import type { User, Post } from '../types'
import { Loader2 } from 'lucide-react'

type TabType = 'people' | 'posts' | 'trending'

export default function ExplorePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(params.get('q') || '')
  const [hashtag] = useState(params.get('hashtag') || '')
  const [tab, setTab] = useState<TabType>(hashtag ? 'posts' : 'people')

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['explore-users', query],
    queryFn: () => userService.searchUsers({ q: query }).then(r => r.data.data.users as User[]),
    enabled: tab === 'people',
  })

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['explore-posts', query, hashtag],
    queryFn: () => hashtag
      ? postService.getByHashtag(hashtag).then(r => r.data.posts as Post[])
      : postService.getTrending().then(r => r.data.posts as Post[]),
    enabled: tab === 'posts',
  })

  const { data: trending } = useQuery({
    queryKey: ['trending-users'],
    queryFn: () => userService.getTrendingUsers().then(r => r.data.users as User[]),
    enabled: tab === 'trending',
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        <input className="input pl-11 py-3 text-sm" placeholder="Search people, posts, skills, hashtags..." value={query}
          onChange={e => setQuery(e.target.value)} />
      </div>

      {hashtag && (
        <div className="flex items-center gap-2">
          <Hash size={18} className="text-primary-500" />
          <h2 className="font-semibold text-surface-900 dark:text-white text-lg">#{hashtag}</h2>
        </div>
      )}

      <div className="flex gap-0 border-b border-surface-200 dark:border-surface-800">
        {(['people', 'posts', 'trending'] as TabType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'people' && (
        <div className="space-y-3">
          {usersLoading ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-primary-500" /></div> :
            users?.length === 0 ? <p className="text-center text-surface-400 py-8">No people found</p> :
            users?.map(user => (
              <div key={user.id} className="card-hover p-4 flex items-center gap-3">
                <Avatar user={user} size="md" onClick={() => navigate(`/profile/${user.username}`)} />
                <div className="flex-1 min-w-0">
                  <button className="font-semibold text-surface-900 dark:text-white text-sm hover:underline" onClick={() => navigate(`/profile/${user.username}`)}>
                    {user.full_name}
                  </button>
                  <p className="text-xs text-surface-500 truncate">{user.headline}</p>
                  <p className="text-xs text-surface-400">{user.followers_count} followers</p>
                </div>
                <button onClick={() => userService.followUser(user.id)} className="btn-secondary btn-sm">Follow</button>
              </div>
            ))}
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-4">
          {postsLoading ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-primary-500" /></div> :
            posts?.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {tab === 'trending' && (
        <div className="space-y-3">
          {trending?.map((user, i) => (
            <div key={user.id} className="card-hover p-4 flex items-center gap-3">
              <span className="text-lg font-bold text-surface-300 w-6 text-center">{i + 1}</span>
              <Avatar user={user} size="md" onClick={() => navigate(`/profile/${user.username}`)} />
              <div className="flex-1 min-w-0">
                <button className="font-semibold text-surface-900 dark:text-white text-sm hover:underline" onClick={() => navigate(`/profile/${user.username}`)}>
                  {user.full_name}
                </button>
                {user.headline && <p className="text-xs text-surface-500 truncate">{user.headline}</p>}
                <p className="text-xs text-surface-400 flex items-center gap-1"><TrendingUp size={10} /> {user.followers_count} followers</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
