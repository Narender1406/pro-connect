import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Image, Video, FileText, Smile, X, Loader2 } from 'lucide-react'
import { postService } from '../../services'
import { useAppSelector } from '../../store/hooks'
import Avatar from '../ui/Avatar'
import toast from 'react-hot-toast'

interface Props { onCreated?: () => void }

export default function CreatePost({ onCreated }: Props) {
  const { user } = useAppSelector(s => s.auth)
  const [content, setContent] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const hashtags = (content.match(/#\w+/g) || []).map(h => h.slice(1))
      const mentions = (content.match(/@\w+/g) || []).map(m => m.slice(1))
      return postService.createPost({ content, hashtags, media_urls: mediaUrls })
    },
    onSuccess: () => {
      setContent('')
      setMediaUrls([])
      setExpanded(false)
      toast.success('Post published!')
      onCreated?.()
    },
  })

  const canPost = content.trim().length > 0 || mediaUrls.length > 0

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar user={user} size="md" />
        <div className="flex-1">
          {!expanded ? (
            <button
              className="w-full text-left px-4 py-2.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-400 text-sm hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
              onClick={() => setExpanded(true)}
            >
              What's on your mind, {user?.full_name?.split(' ')[0]}?
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                autoFocus
                className="w-full resize-none bg-transparent text-surface-900 dark:text-white placeholder-surface-400 text-sm focus:outline-none min-h-[100px]"
                placeholder="Share your thoughts, projects, or opportunities... Use #hashtags and @mentions"
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={3000}
              />
              <div className="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-700">
                <div className="flex items-center gap-1">
                  <button className="btn-ghost p-2 text-surface-400 hover:text-primary-500" title="Add image">
                    <Image size={18} />
                  </button>
                  <button className="btn-ghost p-2 text-surface-400 hover:text-primary-500" title="Add video">
                    <Video size={18} />
                  </button>
                  <button className="btn-ghost p-2 text-surface-400 hover:text-primary-500" title="Article">
                    <FileText size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-400">{content.length}/3000</span>
                  <button onClick={() => { setExpanded(false); setContent('') }} className="btn-secondary btn-sm">Cancel</button>
                  <button
                    onClick={() => mutate()}
                    disabled={!canPost || isPending}
                    className="btn-primary btn-sm"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
