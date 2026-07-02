import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../../services'
import { TrendingUp, Users, FileText, Eye, Heart, Loader2 } from 'lucide-react'
import { useState } from 'react'
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-6 flex items-center gap-2">
        <TrendingUp size={22} className="text-primary-500" /> Analytics
      </h1>
      <AnalyticsDashboard />
    </div>
  )
}
