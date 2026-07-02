import { useNavigate } from 'react-router-dom'
import { Calendar, Flag, User2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Task } from '../../types'
import Avatar from '../ui/Avatar'

interface Props { task: Task; onUpdate?: () => void }

const priorityColors = {
  low: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  medium: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  high: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  critical: 'text-red-500 bg-red-50 dark:bg-red-900/20',
}

const priorityIcons = {
  low: '▼', medium: '●', high: '▲', critical: '⚡'
}

export default function TaskCard({ task, onUpdate }: Props) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.board_column !== 'done'

  return (
    <div className="card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group">
      <div className="space-y-2">
        {/* Priority + Labels */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`badge text-[10px] px-1.5 py-0.5 ${priorityColors[task.priority]}`}>
            {priorityIcons[task.priority]} {task.priority}
          </span>
          {task.labels.slice(0, 2).map(label => (
            <span key={label} className="badge-gray text-[10px] px-1.5 py-0.5">{label}</span>
          ))}
          {task.labels.length > 2 && <span className="text-[10px] text-surface-400">+{task.labels.length - 2}</span>}
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-surface-900 dark:text-white leading-snug line-clamp-2">
          {task.title}
        </p>

        {task.description && (
          <p className="text-xs text-surface-500 line-clamp-2">{task.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {task.due_date && (
              <span className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-surface-400'}`}>
                <Calendar size={10} />
                {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
          </div>
          {task.assignee && (
            <Avatar user={task.assignee} size="xs" className="flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  )
}
