import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { projectService } from '../../services'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  workspaceId: string
  projectId: string
  defaultColumn?: string
  onCreated?: () => void
}

export default function CreateTaskModal({ open, onClose, workspaceId, projectId, defaultColumn = 'todo', onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => projectService.createTask(workspaceId, projectId, { title, description, board_column: defaultColumn, priority, due_date: dueDate || undefined }),
    onSuccess: () => { onCreated?.(); setTitle(''); setDescription(''); setDueDate('') },
  })

  return (
    <Modal open={open} onClose={onClose} title="Create Task" size="sm">
      <div className="p-4 space-y-4">
        <Input label="Task Title" placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="Optional details..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Priority</label>
            <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth loading={isPending} disabled={!title.trim()} onClick={() => mutate()}>Create Task</Button>
        </div>
      </div>
    </Modal>
  )
}
