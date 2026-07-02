import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, FileText, Loader2 } from 'lucide-react'
import { userService, postService } from '../../services'
import Avatar from '../../components/ui/Avatar'
import PostCard from '../../components/feed/PostCard'
import type { User, Post } from '../../types'

type Tab = 'all' | 'people' | 'posts'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('all')
  const q = searchParams.get('q') || ''
  const [input, setInput] = useState(q)

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['search-users', q],
    queryFn: () => userService.searchUsers({ q, limit: 6 }).then(r => r.data.data?.users as User[]),
    enabled: q.length > 0,
  })

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['search-posts', q],
    queryFn: () => postService.getFeed(1, 20).then(r =>
      (r.data.posts as Post[]).filter(p => p.content.toLowerCase().includes(q.toLowerCase()))
    ),
    enabled: q.length > 0,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) setSearchParams({ q: input.trim() })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input className="input pl-11 py-3 text-sm" placeholder="Search people, posts, skills..."
            value={input} onChange={e => setInput(e.target.value)} autoFocus />
        </div>
      </form>

      {q && (
        <>
          <div className="flex gap-0 border-b border-surface-200 dark:border-surface-800">
            {(['all', 'people', 'posts'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-900 dark:hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>

          {(tab === 'all' || tab === 'people') && (
            <div>
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users size={13} /> People
              </h3>
              {usersLoading
                ? <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-surface-400" /></div>
                : !users?.length
                  ? <p className="text-sm text-surface-400 py-2">No people found for "{q}"</p>
                  : <div className="space-y-2">
                      {users.map(u => (
                        <div key={u.id} className="card-hover p-3 flex items-center gap-3">
                          <Avatar user={u} size="sm" onClick={() => navigate(`/profile/${u.username}`)} />
                          <div className="flex-1 min-w-0">
                            <button className="font-medium text-sm text-surface-900 dark:text-white hover:underline"
                              onClick={() => navigate(`/profile/${u.username}`)}>
                              {u.full_name}
                            </button>
                            {u.headline && <p className="text-xs text-surface-500 truncate">{u.headline}</p>}
                          </div>
                          <button onClick={() => userService.followUser(u.id)} className="btn-secondary btn-sm flex-shrink-0">Follow</button>
                        </div>
                      ))}
                    </div>
              }
            </div>
          )}

          {(tab === 'all' || tab === 'posts') && (
            <div>
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={13} /> Posts
              </h3>
              {postsLoading
                ? <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-surface-400" /></div>
                : !posts?.length
                  ? <p className="text-sm text-surface-400 py-2">No posts found for "{q}"</p>
                  : <div className="space-y-3">{posts.map(p => <PostCard key={p.id} post={p} />)}</div>
              }
            </div>
          )}
        </>
      )}

      {!q && (
        <div className="text-center py-16">
          <Search size={40} className="text-surface-200 dark:text-surface-700 mx-auto mb-3" />
          <p className="text-surface-500">Search for people, posts, and more</p>
        </div>
      )}
    </div>
  )
}
