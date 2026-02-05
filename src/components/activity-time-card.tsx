import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'

type TabType = 'duration' | 'calories'
type TimeRange = 'thisWeek' | 'lastWeek'

export function ActivityTimeCard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('duration')
  const [timeRange, setTimeRange] = useState<TimeRange>('thisWeek')

  // Fetch workout sessions
  const sessions = useQuery(
    api.workoutSessions.getSessionHistory,
    user ? { userId: user._id, limit: 100 } : 'skip',
  )

  // Debug: inspect Convex data at runtime
  if (import.meta.env.DEV) {
    console.log('[ActivityTimeCard] user:', user)
    console.log('[ActivityTimeCard] sessions:', sessions)
  }

  // Calculate chart data based on time range
  const chartData = useMemo(() => {
    if (!sessions) return []

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = today.getDay()

    // Calculate week boundaries
    const thisWeekStart = new Date(today)
    thisWeekStart.setDate(today.getDate() - dayOfWeek) // Sunday of this week
    thisWeekStart.setHours(0, 0, 0, 0)

    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(thisWeekStart.getDate() - 7)

    const weekStart = timeRange === 'thisWeek' ? thisWeekStart : lastWeekStart
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    // Group sessions by day
    const dayData: Record<number, { duration: number; calories: number }> = {
      0: { duration: 0, calories: 0 },
      1: { duration: 0, calories: 0 },
      2: { duration: 0, calories: 0 },
      3: { duration: 0, calories: 0 },
      4: { duration: 0, calories: 0 },
      5: { duration: 0, calories: 0 },
      6: { duration: 0, calories: 0 },
    }

    sessions.forEach((session) => {
      if (session.startTime) {
        const sessionDate = new Date(session.startTime)
        if (sessionDate >= weekStart && sessionDate < weekEnd) {
          const day = sessionDate.getDay()
          const endTime = session.endTime ?? session.updatedAt ?? Date.now()
          const durationSeconds = Math.max(0, (endTime - session.startTime) / 1000)
          if (import.meta.env.DEV) {
            console.log('[ActivityTimeCard] session duration seconds:', {
              sessionId: session._id,
              startTime: session.startTime,
              endTime,
              durationSeconds,
            })
          }
          dayData[day].duration += durationSeconds
          dayData[day].calories += session.totalCaloriesBurned || 0
        }
      }
    })

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    return weekDays.map((day, index) => ({
      day,
      duration: Math.ceil(dayData[index].duration / 60), // seconds -> minutes
      calories: dayData[index].calories,
    }))
  }, [sessions, timeRange])

  const totalDuration = chartData.reduce((sum, item) => sum + item.duration, 0)
  const hours = Math.floor(totalDuration / 60)
  const minutes = totalDuration % 60

  const displayValue =
    activeTab === 'duration'
      ? `${hours}h ${minutes}m`
      : `${chartData.reduce((sum, item) => sum + item.calories, 0)} cal`

  const dataKey = activeTab === 'duration' ? 'duration' : 'calories'

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Activity Time
          </p>
          <p className="mt-2 text-4xl font-bold text-white">{displayValue}</p>
        </div>

        {/* Time Range Dropdown */}
        <Select
          value={timeRange}
          onValueChange={(value: any) => setTimeRange(value)}
        >
          <SelectTrigger className="w-auto border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 text-white border border-slate-700">
            <SelectItem value="thisWeek">This Week</SelectItem>
            <SelectItem value="lastWeek">Last Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chart Area */}
      <div className="mb-6 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="transparent"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="#94a3b8"
              style={{ fontSize: '12px', fontWeight: 500 }}
              axisLine={{ stroke: 'transparent' }}
              tickLine={false}
            />
            <YAxis hide={true} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value) =>
                activeTab === 'duration'
                  ? [`${value} min`, '']
                  : [`${value} cal`, '']
              }
            />
            <Bar
              dataKey={dataKey}
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Navigation Tabs */}
      <div className="flex items-center justify-center gap-8 border-t border-slate-700 pt-4">
        <button
          onClick={() => setActiveTab('duration')}
          className={`pb-2 transition-all ${
            activeTab === 'duration'
              ? 'border-b-2 border-blue-500 text-white'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-400'
          }`}
        >
          <span className="text-sm font-medium">Duration</span>
        </button>
        <button
          onClick={() => setActiveTab('calories')}
          className={`pb-2 transition-all ${
            activeTab === 'calories'
              ? 'border-b-2 border-blue-500 text-white'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-400'
          }`}
        >
          <span className="text-sm font-medium">Calories</span>
        </button>
      </div>
    </div>
  )
}
