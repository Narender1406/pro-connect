import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Search, X, Loader2 } from 'lucide-react'
import { chatService, userService } from '../../services'
import Modal from '../ui/Modal'
import Avatar from '../ui/Avatar'
import type { User } from '../../types'
import { useAppDispatch } from '../../store/hooks'
import { addConversation } from '../../store/slices/chatSlice'

interface Props { open: boolean; onClose: () => void; onCreated: (id: string) => void }

export default function NewConversationModal({ open, onClose, onCreated }: Props) {
  const dispatch = useAppDispatch()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<User[]>([])

  const { data: users, isLoading } = useQuery({
    queryKey: ['user-search', search],
    queryFn: () => userService.searchUsers({ q: search, limit: 10 }).then(r => r.data.data.users as User[]),
    enabled: search.length >= 1,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => chatService.createConversation({
      member_ids: selected.map(u => u.id),
      is_group: selected.length > 1,
      name: selected.length > 1 ? selected.map(u => u.full_name.split(' ')[0]).join(', ') : undefined,
    }),
    onSuccess: (r) => {
      const conv = r.data.conversation
      dispatch(addConversation(conv))
      onCreated(conv.id)
      onClose()
      setSelected([])
      setSearch('')
    },
  })

  const toggle = (u: User) => {
    setSelected(s => s.find(x => x.id === u.id) ? s.filter(x => x.id !== u.id) : [...s, u])
  }

  return (
    <Modal open={open} onClose={onClose} title="New Message" size="sm">
      <div className="p-4 space-y-3">
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map(u => (
              <span key={u.id} className="badge-primary flex items-center gap-1">
                {u.full_name}
                <button onClick={() => toggle(u)}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input className="input pl-9" placeholder="Search people..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {isLoading && <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-surface-400" /></div>}
          {users?.map(u => {
            const isSelected = selected.some(x => x.id === u.id)
            return (
              <button key={u.id} onClick={() => toggle(u)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-surface-100 dark:hover:bg-surface-800'}`}>
                <Avatar user={u} size="sm" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{u.full_name}</p>
                  <p className="text-xs text-surface-500 truncate">@{u.username}</p>
                </div>
                {isSelected && <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0"><span className="text-white text-xs">✓</span></div>}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => mutate()}
          disabled={selected.length === 0 || isPending}
          className="btn-primary w-full"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : `Start Chat${selected.length > 1 ? ` (${selected.length})` : ''}`}
        </button>
      </div>
    </Modal>
  )
}
