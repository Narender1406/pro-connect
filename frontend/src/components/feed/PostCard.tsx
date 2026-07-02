import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Trash2, Edit, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { postService } from '../../services'
import { useAppSelector } from '../../store/hooks'
import Avatar from '../ui/Avatar'
import type { Post } from '../../types'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import CommentSection from './CommentSection'

interface Props {
  post: Post
  onUpdate?: () => void
}

export default function PostCard({ post: initialPost, onUpdate }: Props) {
  const navigate = useNavigate()
  const { user } = useAppSelector(s => s.auth)
  const [post, setPost] = useState(initialPost)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const queryClient = useQueryClient()
  const isOwner = user?.id === post.author.id

  const likeMutation = useMutation({
    mutationFn: () => post.liked ? postService.unlikePost(post.id) : postService.likePost(post.id),
    onMutate: () => {
      setPost(p => ({ ...p, liked: !p.liked, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1 }))
    },
    onError: () => setPost(initialPost),
  })

  const saveMutation = useMutation({
    mutationFn: () => post.saved ? postService.unsavePost(post.id) : postService.savePost(post.id),
    onMutate: () => setPost(p => ({ ...p, saved: !p.saved })),
    onError: () => setPost(initialPost),
  })

  const deleteMutation = useMutation({
    mutationFn: () => postService.deletePost(post.id),
    onSuccess: () => { toast.success('Post deleted'); onUpdate?.() },
  })

  const editMutation = useMutation({
    mutationFn: () => postService.updatePost(post.id, { content: editContent }),
    onSuccess: (r) => { setPost(r.data.post); setEditing(false); toast.success('Post updated') },
  })

  const renderContent = (text: string) => {
    return text.split(/(\s+)/).map((word, i) => {
      if (word.startsWith('#')) return <span key={i} className="text-primary-600 dark:text-primary-400 cursor-pointer hover:underline" onClick={() => navigate(`/explore?hashtag=${word.slice(1)}`)}>{word}</span>
      if (word.startsWith('@')) return <span key={i} className="text-primary-600 dark:text-primary-400 cursor-pointer hover:underline">{word}</span>
      return word
    })
  }

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar user={post.author} size="md" onClick={() => navigate(`/profile/${post.author.username}`)} />
          <div>
            <button className="font-semibold text-surface-900 dark:text-white hover:underline text-sm" onClick={() => navigate(`/profile/${post.author.username}`)}>
              {post.author.full_name}
            </button>
            {post.author.headline && <p className="text-xs text-surface-500 line-clamp-1">{post.author.headline}</p>}
            <p className="text-xs text-surface-400">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
          </div>
        </div>

        {isOwner && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="btn-ghost p-1.5 rounded-lg">
              <MoreHorizontal size={16} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-8 card shadow-lg py-1 z-20 w-36"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button onClick={() => { setEditing(true); setShowMenu(false) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface-100 dark:hover:bg-surface-700">
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => deleteMutation.mutate()} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={14} /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <textarea className="input resize-none min-h-[80px] text-sm" value={editContent} onChange={e => setEditContent(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={() => editMutation.mutate()} disabled={editMutation.isPending} className="btn-primary btn-sm">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-surface-800 dark:text-surface-200 leading-relaxed whitespace-pre-wrap">
          {renderContent(post.content)}
        </p>
      )}

      {/* Media */}
      {post.media_urls.length > 0 && (
        <div className={`grid gap-1 rounded-xl overflow-hidden ${post.media_urls.length > 1 ? 'grid-cols-2' : ''}`}>
          {post.media_urls.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" className="w-full object-cover max-h-72" />
          ))}
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.map(tag => (
            <button key={tag} onClick={() => navigate(`/explore?hashtag=${tag}`)}
              className="text-xs badge-primary">
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-surface-400 pt-1 border-t border-surface-100 dark:border-surface-700">
        <span>{post.likes_count > 0 && `${post.likes_count} like${post.likes_count !== 1 ? 's' : ''}`}</span>
        <button onClick={() => setShowComments(!showComments)} className="hover:underline">
          {post.comments_count > 0 && `${post.comments_count} comment${post.comments_count !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1">
        <button
          onClick={() => likeMutation.mutate()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${post.liked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'btn-ghost'}`}
        >
          <Heart size={16} className={post.liked ? 'fill-current' : ''} />
          <span>Like</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm">
          <MessageCircle size={16} /> Comment
        </button>
        <button onClick={() => postService.sharePost(post.id).then(() => toast.success('Shared!'))} className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm">
          <Share2 size={16} /> Share
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${post.saved ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'btn-ghost'}`}
        >
          <Bookmark size={16} className={post.saved ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <CommentSection postId={post.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
