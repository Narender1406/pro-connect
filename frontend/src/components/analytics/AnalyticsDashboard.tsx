import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../../services'
import { TrendingUp, Users, FileText, Eye, Heart, Loader2 } from 'lucide-react'
import { useState } from 'react'

const PERIODS = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
]

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30d')

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['my-analytics', period],
    queryFn: () => analyticsService.getMyAnalytics(period).then(r => r.data.analytics),
  })

  const { data: engagement } = useQuery({
    queryKey: ['engagement'],
    queryFn: () => analyticsService.getEngagement().then(r => r.data.engagement),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-500" /></div>

  const stats = [
    { label: 'Profile Views', value: analytics?.profile_views ?? 0, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Post Likes', value: analytics?.post_likes ?? 0, icon: Heart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'New Followers', value: analytics?.new_followers ?? 0, icon: Users, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Posts Published', value: analytics?.posts_published ?? 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p.value ? 'bg-primary-600 text-white' : 'btn-secondary'}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{s.value.toLocaleString()}</p>
            <p className="text-xs text-surface-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {engagement && (
        <div className="card p-5">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-500" /> Overall Engagement
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Total Posts', value: engagement.total_posts },
              { label: 'Total Followers', value: engagement.total_followers },
              { label: 'Following', value: engagement.total_following },
              { label: 'Likes Received', value: engagement.total_likes_received },
            ].map(item => (
              <div key={item.label} className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                <p className="text-xl font-bold text-surface-900 dark:text-white">{(item.value ?? 0).toLocaleString()}</p>
                <p className="text-xs text-surface-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
