import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postService, userService } from '../../services'
import PostCard from '../../components/feed/PostCard'
import CreatePost from '../../components/feed/CreatePost'
import UserSuggestions from '../../components/feed/UserSuggestions'
import TrendingTopics from '../../components/feed/TrendingTopics'
import { useAppSelector } from '../../store/hooks'
import type { Post } from '../../types'
import { Loader2 } from 'lucide-react'

export default function FeedPage() {
  const { user } = useAppSelector(s => s.auth)
  const queryClient = useQueryClient()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) => userService.getPersonalizedFeed(pageParam).then(r => r.data.posts as Post[]),
    getNextPageParam: (lastPage, allPages) => lastPage.length === 20 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
  })

  const posts = data?.pages.flat() ?? []

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const onPostCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['feed'] })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main feed */}
        <div className="lg:col-span-7 space-y-4">
          <CreatePost onCreated={onPostCreated} />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-primary-500" />
            </div>
          ) : posts.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-surface-500 mb-2">Your feed is empty</p>
              <p className="text-sm text-surface-400">Follow people or create your first post to get started</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['feed'] })} />
            ))
          )}

          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && <Loader2 size={20} className="animate-spin text-surface-400" />}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <TrendingTopics />
          <UserSuggestions />
        </div>
      </div>
    </div>
  )
}
