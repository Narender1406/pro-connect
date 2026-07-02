import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceService, projectService } from '../../services'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Avatar from '../../components/ui/Avatar'
import WorkspaceAnalytics from '../../components/workspace/WorkspaceAnalytics'
import { Plus, Briefcase, Users, FolderKanban, Settings, Loader2, BarChart3 } from 'lucide-react'
import type { Workspace, Project } from '../../types'

export default function WorkspacePage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createWsOpen, setCreateWsOpen] = useState(false)
  const [createProjOpen, setCreateProjOpen] = useState(false)
  const [wsName, setWsName] = useState('')
  const [wsSlug, setWsSlug] = useState('')
  const [wsDesc, setWsDesc] = useState('')
  const [projName, setProjName] = useState('')
  const [activeTab, setActiveTab] = useState<'projects' | 'members' | 'analytics'>('projects')

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceService.getWorkspaces().then(r => r.data.workspaces as Workspace[]),
  })

  const activeWorkspace = workspaces?.find(w => w.id === workspaceId) || workspaces?.[0]

  const { data: projects } = useQuery({
    queryKey: ['projects', activeWorkspace?.id],
    queryFn: () => projectService.getProjects(activeWorkspace!.id).then(r => r.data.projects as Project[]),
    enabled: !!activeWorkspace?.id,
  })

  const { data: members } = useQuery({
    queryKey: ['workspace-members', activeWorkspace?.id],
    queryFn: () => workspaceService.getMembers(activeWorkspace!.id).then(r => r.data.members),
    enabled: !!activeWorkspace?.id,
  })

  const createWsMutation = useMutation({
    mutationFn: () => workspaceService.createWorkspace({ name: wsName, slug: wsSlug, description: wsDesc }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setCreateWsOpen(false); setWsName(''); setWsSlug(''); setWsDesc('')
      navigate(`/workspaces/${r.data.workspace.id}`)
    },
  })

  const createProjMutation = useMutation({
    mutationFn: () => projectService.createProject(activeWorkspace!.id, { name: projName }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspace?.id] })
      setCreateProjOpen(false); setProjName('')
      navigate(`/workspaces/${activeWorkspace!.id}/projects/${r.data.project.id}`)
    },
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-500" /></div>

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Workspace list */}
      <div className="w-64 border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex flex-col">
        <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-surface-900 dark:text-white">Workspaces</h2>
          <button onClick={() => setCreateWsOpen(true)} className="btn-ghost p-1.5 rounded-lg"><Plus size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {workspaces?.map(ws => (
            <button key={ws.id} onClick={() => navigate(`/workspaces/${ws.id}`)}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-colors ${activeWorkspace?.id === ws.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'}`}>
              <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-xs flex-shrink-0">
                {ws.name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium truncate">{ws.name}</span>
            </button>
          ))}
          {!workspaces?.length && (
            <div className="p-4 text-center">
              <p className="text-xs text-surface-400 mb-2">No workspaces</p>
              <button onClick={() => setCreateWsOpen(true)} className="text-xs link">Create one</button>
            </div>
          )}
        </div>
      </div>

      {/* Workspace content */}
      <div className="flex-1 overflow-y-auto">
        {activeWorkspace ? (
          <div className="p-6 space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{activeWorkspace.name}</h1>
                {activeWorkspace.description && <p className="text-surface-500 mt-1 text-sm">{activeWorkspace.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-sm text-surface-500">
                  {activeWorkspace.industry && <span>{activeWorkspace.industry}</span>}
                  <span className="flex items-center gap-1"><Users size={14} />{activeWorkspace.members_count} members</span>
                </div>
              </div>
              <Button variant="secondary" size="sm" icon={<Settings size={14} />}>Settings</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Members', value: activeWorkspace.members_count, icon: Users },
                { label: 'Projects', value: projects?.length || 0, icon: FolderKanban },
                { label: 'Your Role', value: activeWorkspace.role, icon: Briefcase },
              ].map(s => (
                <div key={s.label} className="card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <s.icon size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-surface-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-surface-200 dark:border-surface-800">
              <div className="flex gap-2">
                {[
                  { id: 'projects', label: 'Projects', icon: FolderKanban },
                  { id: 'members', label: 'Members', icon: Users },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                      activeTab === t.id
                        ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-surface-500 hover:text-surface-900 dark:hover:text-white'
                    }`}
                  >
                    <t.icon size={16} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="pt-2">
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-surface-900 dark:text-white">Workspace Projects</h2>
                    <Button size="sm" onClick={() => setCreateProjOpen(true)} icon={<Plus size={14} />}>New Project</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects?.map(proj => (
                      <button key={proj.id}
                        onClick={() => navigate(`/workspaces/${activeWorkspace.id}/projects/${proj.id}`)}
                        className="card-hover p-5 text-left bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-surface-900 dark:text-white text-sm">{proj.name}</h3>
                            {proj.description && <p className="text-xs text-surface-500 mt-1 line-clamp-2 leading-relaxed">{proj.description}</p>}
                          </div>
                          <span className={`badge text-[10px] uppercase font-extrabold ${proj.status === 'active' ? 'badge-success' : proj.status === 'completed' ? 'badge-primary' : 'badge-gray'}`}>
                            {proj.status}
                          </span>
                        </div>
                        {proj.due_date && (
                          <p className="text-[11px] font-medium text-surface-400 mt-3">Due: {new Date(proj.due_date).toLocaleDateString()}</p>
                        )}
                      </button>
                    ))}
                    {!projects?.length && (
                      <div className="col-span-2 card p-8 text-center bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                        <FolderKanban size={36} className="text-surface-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">No projects yet</p>
                        <p className="text-xs text-surface-500 mt-0.5">Start collaborating by creating a new Kanban project board.</p>
                        <button onClick={() => setCreateProjOpen(true)} className="link text-sm mt-3 font-semibold">Create your first project</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'members' && members && (
                <div className="space-y-4">
                  <h2 className="font-bold text-surface-900 dark:text-white">Workspace Members</h2>
                  <div className="card bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-2 divide-y divide-surface-100 dark:divide-surface-800">
                    {(members as any[]).map((m: any) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors first:rounded-t-lg last:rounded-b-lg">
                        <Avatar user={m} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">{m.full_name}</p>
                          <p className="text-xs text-surface-500 truncate">@{m.username}</p>
                        </div>
                        <span className="badge bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-xs py-1 px-2.5 font-bold uppercase tracking-wider">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <h2 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">Workspace Performance</h2>
                  <WorkspaceAnalytics workspaceId={activeWorkspace.id} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 p-8">
            <Briefcase size={40} className="text-surface-300" />
            <div className="text-center">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-1">No workspace selected</h3>
              <p className="text-sm text-surface-500 mb-4">Create or select a workspace to get started</p>
              <Button onClick={() => setCreateWsOpen(true)}>Create Workspace</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <Modal open={createWsOpen} onClose={() => setCreateWsOpen(false)} title="Create Workspace" size="sm">
        <div className="p-4 space-y-4">
          <Input label="Workspace Name" placeholder="Acme Corp" value={wsName} onChange={e => { setWsName(e.target.value); setWsSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) }} required />
          <Input label="Slug" placeholder="acme-corp" value={wsSlug} onChange={e => setWsSlug(e.target.value)} hint="Used in URLs" required />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="What does your workspace do?" value={wsDesc} onChange={e => setWsDesc(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setCreateWsOpen(false)}>Cancel</Button>
            <Button fullWidth loading={createWsMutation.isPending} disabled={!wsName.trim() || !wsSlug.trim()} onClick={() => createWsMutation.mutate()}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Create Project Modal */}
      <Modal open={createProjOpen} onClose={() => setCreateProjOpen(false)} title="New Project" size="sm">
        <div className="p-4 space-y-4">
          <Input label="Project Name" placeholder="e.g. Website Redesign" value={projName} onChange={e => setProjName(e.target.value)} required autoFocus />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setCreateProjOpen(false)}>Cancel</Button>
            <Button fullWidth loading={createProjMutation.isPending} disabled={!projName.trim()} onClick={() => createProjMutation.mutate()}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
