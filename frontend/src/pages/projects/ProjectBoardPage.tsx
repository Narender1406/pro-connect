import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { projectService } from '../../services'
import type { KanbanBoard, Task } from '../../types'
import TaskCard from '../../components/projects/TaskCard'
import CreateTaskModal from '../../components/projects/CreateTaskModal'
import { Plus, Loader2 } from 'lucide-react'

const COLUMNS: { id: Task['board_column']; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-surface-400' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'in_review', label: 'In Review', color: 'bg-amber-500' },
  { id: 'done', label: 'Done', color: 'bg-green-500' },
]

export default function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const queryClient = useQueryClient()
  const [createColumn, setCreateColumn] = useState<string | null>(null)

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', projectId],
    queryFn: () => projectService.getBoard(workspaceId!, projectId!).then(r => r.data.board as KanbanBoard),
  })

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(workspaceId!, projectId!).then(r => r.data.project),
  })

  const moveMutation = useMutation({
    mutationFn: ({ taskId, column, position }: { taskId: string; column: string; position: number }) =>
      projectService.moveTask(workspaceId!, projectId!, taskId, column, position),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', projectId] }),
  })

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !board) return
    const { draggableId, source, destination } = result
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const destColumn = board[destination.droppableId as keyof KanbanBoard]
    const destPosition = destination.index === 0
      ? (destColumn[0]?.position || 1) - 0.5
      : destination.index >= destColumn.length
        ? (destColumn[destColumn.length - 1]?.position || 0) + 1
        : (destColumn[destination.index - 1].position + destColumn[destination.index].position) / 2

    moveMutation.mutate({ taskId: draggableId, column: destination.droppableId, position: destPosition })
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-500" /></div>

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex-shrink-0">
        <h1 className="text-lg font-bold text-surface-900 dark:text-white">{project?.name}</h1>
        {project?.description && <p className="text-sm text-surface-500 mt-0.5">{project.description}</p>}
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-6 h-full min-w-max">
            {COLUMNS.map(col => {
              const tasks = board?.[col.id] || []
              return (
                <div key={col.id} className="w-72 flex flex-col flex-shrink-0">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="font-semibold text-sm text-surface-900 dark:text-white">{col.label}</h3>
                    <span className="badge-gray ml-auto">{tasks.length}</span>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto space-y-2 rounded-xl p-2 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-surface-100 dark:bg-surface-800/50'}`}
                      >
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                className={snapshot.isDragging ? 'opacity-80 rotate-1' : ''}>
                                <TaskCard
                                  task={task}
                                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['board', projectId] })}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        <button
                          onClick={() => setCreateColumn(col.id)}
                          className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                        >
                          <Plus size={14} /> Add task
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </div>
      </DragDropContext>

      {createColumn && (
        <CreateTaskModal
          open={!!createColumn}
          onClose={() => setCreateColumn(null)}
          workspaceId={workspaceId!}
          projectId={projectId!}
          defaultColumn={createColumn}
          onCreated={() => { queryClient.invalidateQueries({ queryKey: ['board', projectId] }); setCreateColumn(null) }}
        />
      )}
    </div>
  )
}
