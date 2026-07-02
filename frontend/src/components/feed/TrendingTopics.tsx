import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { postService } from '../../services'
import { TrendingUp } from 'lucide-react'
import type { Post } from '../../types'

export default function TrendingTopics() {
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['trending-posts'],
    queryFn: () => postService.getTrending().then(r => r.data.posts as Post[]),
    staleTime: 5 * 60 * 1000,
  })

  // Extract trending hashtags from posts
  const hashtagCounts = data?.flatMap(p => p.hashtags).reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1; return acc
  }, {} as Record<string, number>) ?? {}

  const trending = Object.entries(hashtagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  if (!trending.length) return null

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-primary-500" />
        <h3 className="font-semibold text-surface-900 dark:text-white text-sm">Trending topics</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {trending.map(([tag, count]) => (
          <button
            key={tag}
            onClick={() => navigate(`/explore?hashtag=${tag}`)}
            className="badge-primary text-xs py-1 px-2.5 hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-colors"
          >
            #{tag} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
