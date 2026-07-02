import { useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services'
import { Users, FileText, BarChart2, Shield, AlertTriangle, Activity, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminService.getAnalytics().then(r => r.data.analytics),
  })
  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminService.systemHealth().then(r => r.data.health),
    refetchInterval: 30000,
  })

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-500" /></div>

  const stats = [
    { label: 'Total Users', value: data?.total_users || 0, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Active Users', value: data?.active_users || 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Total Posts', value: data?.total_posts || 0, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'New Today', value: data?.new_users_today || 0, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Messages', value: data?.total_messages || 0, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
    { label: 'Organizations', value: data?.total_organizations || 0, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
            <div className="text-sm text-surface-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {health && (
        <div className="card p-4">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2"><Activity size={16} />System Health</h3>
          <div className="flex gap-4">
            {[['Database', health.database], ['Redis', health.redis], ['Status', health.status]].map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${v === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-surface-600 dark:text-surface-400">{k}: <span className="font-medium">{v}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AdminUsers() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminService.listUsers({ q: search }).then(r => r.data.data),
  })

  return (
    <div className="space-y-4">
      <input className="input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
            <tr>
              {['User', 'Role', 'Status', 'Posts', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8"><Loader2 size={20} className="animate-spin text-surface-400 mx-auto" /></td></tr>
            ) : data?.users?.map((u: any) => (
              <tr key={u.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white">{u.full_name}</p>
                    <p className="text-xs text-surface-500">@{u.username} · {u.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="badge-gray capitalize">{u.role}</span></td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.status === 'active' ? 'badge-success' : u.status === 'suspended' ? 'badge-danger' : 'badge-warning'} capitalize`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{u.posts_count}</td>
                <td className="px-4 py-3 text-surface-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => adminService.suspendUser(u.id, 'Admin action')} className="text-xs text-red-600 hover:underline">Suspend</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminAuditLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => adminService.getAuditLogs().then(r => r.data.logs),
  })

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
          <tr>
            {['Actor', 'Action', 'Entity', 'Time'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
          {isLoading ? (
            <tr><td colSpan={4} className="text-center py-8"><Loader2 size={20} className="animate-spin text-surface-400 mx-auto" /></td></tr>
          ) : data?.map((log: any) => (
            <tr key={log.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
              <td className="px-4 py-3 text-surface-700 dark:text-surface-300">{log.actor?.username || 'System'}</td>
              <td className="px-4 py-3"><span className="badge-gray text-xs">{log.action}</span></td>
              <td className="px-4 py-3 text-surface-500 text-xs">{log.entity_type}</td>
              <td className="px-4 py-3 text-surface-400 text-xs">{new Date(log.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const adminNav = [
  { to: '/admin', label: 'Overview', icon: BarChart2, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/audit', label: 'Audit Logs', icon: Shield },
]

export default function AdminPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="w-52 border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 flex flex-col p-3">
        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-3 mb-2">Admin Panel</p>
        <nav className="space-y-1">
          {adminNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item'}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 overflow-y-auto p-6">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="audit" element={<AdminAuditLogs />} />
        </Routes>
      </div>
    </div>
  )
}
