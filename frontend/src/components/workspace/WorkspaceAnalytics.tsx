import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../../services'
import { useState } from 'react'
import { BarChart3, FolderKanban, CheckCircle2, Users, Loader2, Calendar } from 'lucide-react'

interface WorkspaceAnalyticsProps {
  workspaceId: string
}

const PERIODS = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
]

export default function WorkspaceAnalytics({ workspaceId }: WorkspaceAnalyticsProps) {
  const [period, setPeriod] = useState('30d')

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['workspace-analytics', workspaceId, period],
    queryFn: () => analyticsService.getWorkspaceAnalytics(workspaceId, period).then(r => r.data.analytics),
    enabled: !!workspaceId,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-surface-500">
        No analytics data available for this workspace.
      </div>
    )
  }

  const cards = [
    { label: 'Total Members', value: analytics.total_members, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Projects', value: analytics.total_projects, icon: FolderKanban, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Total Tasks Created', value: analytics.total_tasks, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Completed Tasks', value: analytics.completed_tasks, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  ]

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center bg-surface-50 dark:bg-surface-800/50 p-3 rounded-xl border border-surface-200 dark:border-surface-800">
        <span className="text-sm font-medium text-surface-600 dark:text-surface-400 flex items-center gap-1.5">
          <Calendar size={16} /> Filter by Period
        </span>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                period === p.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-150 dark:hover:bg-surface-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="card p-5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
              <c.icon size={20} className={c.color} />
            </div>
            <p className="text-2xl font-black text-surface-900 dark:text-white">{c.value.toLocaleString()}</p>
            <p className="text-xs text-surface-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Task Completion Rate Card */}
      <div className="card p-6 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
            Task Completion Performance
          </h3>
          <p className="text-sm text-surface-500 leading-relaxed">
            Your team completed <span className="font-semibold text-surface-900 dark:text-white">{analytics.completed_tasks}</span> out of{' '}
            <span className="font-semibold text-surface-900 dark:text-white">{analytics.total_tasks}</span> total tasks created during the selected period.
          </p>
        </div>

        {/* Progress Bar / Circle */}
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                className="stroke-surface-100 dark:stroke-surface-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                className="stroke-primary-600 dark:stroke-primary-500 transition-all duration-500"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="301.6"
                strokeDashoffset={301.6 - (301.6 * analytics.completion_rate) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-surface-900 dark:text-white">
                {analytics.completion_rate}%
              </span>
              <span className="text-[10px] uppercase font-bold text-surface-400">Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
