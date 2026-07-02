import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { postService } from '../../services'
import { useAppSelector } from '../../store/hooks'
import Avatar from '../ui/Avatar'
import type { Comment } from '../../types'

interface Props { postId: string }

export default function CommentSection({ postId }: Props) {
  const { user } = useAppSelector(s => s.auth)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postService.getComments(postId).then(r => r.data.comments as Comment[]),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => postService.addComment(postId, newComment, replyTo ?? undefined),
    onSuccess: () => {
      setNewComment('')
      setReplyTo(null)
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  return (
    <div className="border-t border-surface-100 dark:border-surface-700 pt-3 space-y-3">
      {/* Input */}
      <div className="flex gap-2">
        <Avatar user={user} size="sm" />
        <div className="flex-1 flex gap-2">
          <input
            className="input flex-1 text-sm py-1.5"
            placeholder="Write a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) { e.preventDefault(); mutate() } }}
          />
          <button
            onClick={() => newComment.trim() && mutate()}
            disabled={!newComment.trim() || isPending}
            className="btn-primary p-2"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 size={16} className="animate-spin text-surface-400" /></div>
      ) : (
        <div className="space-y-3">
          {data?.map(comment => (
            <div key={comment.id} className="flex gap-2">
              <Avatar user={comment.author} size="sm" />
              <div className="flex-1">
                <div className="bg-surface-100 dark:bg-surface-700 rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold text-surface-900 dark:text-white">{comment.author.full_name}</p>
                  <p className="text-sm text-surface-700 dark:text-surface-300 mt-0.5">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <span className="text-xs text-surface-400">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                  <button className="text-xs text-surface-500 hover:text-primary-600 font-medium" onClick={() => setReplyTo(comment.id)}>Reply</button>
                  {comment.likes_count > 0 && <span className="text-xs text-surface-400">❤ {comment.likes_count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
