import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services'
import { useState } from 'react'
import { Users, FileText, BarChart3, Shield, Activity, Loader2, Search, Ban, CheckCircle, Trash2, Eye } from 'lucide-react'
import { formatRelative } from '../../utils'

type Tab = 'overview' | 'users' | 'posts' | 'logs'

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminService.getAnalytics().then(r => r.data.analytics),
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminService.listUsers({ q: search, limit: 50 }).then(r => r.data.data),
    enabled: tab === 'users',
  })

  const { data: postsData } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => adminService.listPosts({ limit: 50 }).then(r => r.data.posts),
    enabled: tab === 'posts',
  })

  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => adminService.getAuditLogs().then(r => r.data.logs),
    enabled: tab === 'logs',
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminService.suspendUser(id, 'Policy violation'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminService.activateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const removePostMutation = useMutation({
    mutationFn: (id: string) => adminService.removePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-posts'] }),
  })

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'logs', label: 'Audit Logs', icon: Activity },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white dark:bg-surface-700 text-primary-600 shadow-sm' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
            }`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Users', value: analytics.total_users, icon: Users, color: 'text-blue-600' },
            { label: 'Active Users', value: analytics.active_users, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Total Posts', value: analytics.total_posts, icon: FileText, color: 'text-purple-600' },
            { label: 'Messages Sent', value: analytics.total_messages, icon: Activity, color: 'text-orange-600' },
            { label: 'New Today', value: analytics.new_users_today, icon: Users, color: 'text-indigo-600' },
            { label: 'Organizations', value: analytics.total_organizations, icon: Shield, color: 'text-pink-600' },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <s.icon size={20} className={`${s.color} mb-2`} />
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{(s.value ?? 0).toLocaleString()}</p>
              <p className="text-sm text-surface-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..." className="input pl-9 w-full max-w-sm" />
          </div>
          {usersLoading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-500" /></div> : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 dark:bg-surface-800 text-surface-500 text-xs uppercase">
                  <tr>
                    {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {usersData?.users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-surface-900 dark:text-white">{u.full_name}</p>
                          <p className="text-surface-500 text-xs">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-primary text-xs">{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${u.status === 'active' ? 'badge-success' : u.status === 'suspended' ? 'badge-error' : 'badge-warning'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-surface-500">{formatRelative(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.status === 'active' ? (
                            <button onClick={() => suspendMutation.mutate(u.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Suspend">
                              <Ban size={14} />
                            </button>
                          ) : (
                            <button onClick={() => activateMutation.mutate(u.id)}
                              className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Activate">
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'posts' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 dark:bg-surface-800 text-surface-500 text-xs uppercase">
              <tr>
                {['Content', 'Author', 'Likes', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {postsData?.posts?.map((p: any) => (
                <tr key={p.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-surface-700 dark:text-surface-300">{p.content}</p>
                  </td>
                  <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{p.author?.full_name}</td>
                  <td className="px-4 py-3 text-surface-600">{p.likes_count}</td>
                  <td className="px-4 py-3 text-surface-500">{formatRelative(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => removePostMutation.mutate(p.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'logs' && (
        <div className="space-y-2">
          {logs?.map((log: any) => (
            <div key={log.id} className="card p-4 flex items-start gap-3">
              <Activity size={16} className="text-surface-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-surface-900 dark:text-white">
                  <span className="font-medium">{log.actor?.full_name || 'System'}</span>{' '}
                  {log.action.replace(/_/g, ' ')}{' '}
                  {log.entity_type && <span className="text-surface-500">{log.entity_type}</span>}
                </p>
                <p className="text-xs text-surface-500">{formatRelative(log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
