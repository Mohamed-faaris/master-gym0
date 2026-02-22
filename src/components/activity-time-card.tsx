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

  // Fetch workout sessions (for duration)
  const sessions = useQuery(
    api.workoutSessions.getSessionHistory,
    user ? { userId: user._id, limit: 100 } : 'skip',
  )
  // Fetch diet logs (for calories taken)
  const dietLogs = useQuery(
    api.dietLogs.getDietLogsByUser,
    user ? { userId: user._id, limit: 200 } : 'skip',
  )

  // Debug: inspect Convex data at runtime
  if (import.meta.env.DEV) {
    console.log('[ActivityTimeCard] user:', user)
    console.log('[ActivityTimeCard] sessions:', sessions)
    console.log('[ActivityTimeCard] dietLogs:', dietLogs)
  }

  // Calculate chart data based on time range
  const chartData = useMemo(() => {
    if (!sessions && !dietLogs) return []

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

    // Group duration and calories by day
    const dayData: Record<number, { duration: number; calories: number }> = {
      0: { duration: 0, calories: 0 },
      1: { duration: 0, calories: 0 },
      2: { duration: 0, calories: 0 },
      3: { duration: 0, calories: 0 },
      4: { duration: 0, calories: 0 },
      5: { duration: 0, calories: 0 },
      6: { duration: 0, calories: 0 },
    }

    sessions?.forEach((session) => {
      if (!session.startTime) return

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
      }
    })

    dietLogs?.forEach((log) => {
      const logDate = new Date(log.createdAt)
      if (logDate >= weekStart && logDate < weekEnd) {
        const day = logDate.getDay()
        dayData[day].calories += log.calories || 0
      }
    })

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    return weekDays.map((day, index) => ({
      day,
      duration: Math.ceil(dayData[index].duration / 60), // seconds -> minutes
      calories: dayData[index].calories,
    }))
  }, [sessions, dietLogs, timeRange])

  const totalDuration = chartData.reduce((sum, item) => sum + item.duration, 0)
  const hours = Math.floor(totalDuration / 60)
  const minutes = totalDuration % 60

  const displayValue =
    activeTab === 'duration'
      ? `${hours}h ${minutes}m`
      : `${chartData.reduce((sum, item) => sum + item.calories, 0)} cal`

  const dataKey = activeTab === 'duration' ? 'duration' : 'calories'

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Activity Time
          </p>
          <p className="mt-2 text-4xl font-bold text-foreground">{displayValue}</p>
        </div>

        {/* Time Range Dropdown */}
        <Select
          value={timeRange}
          onValueChange={(value: any) => setTimeRange(value)}
        >
          <SelectTrigger className="w-auto border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover text-popover-foreground">
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
            accessibilityLayer={false}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="transparent"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="var(--muted-foreground)"
              style={{ fontSize: '12px', fontWeight: 500 }}
              axisLine={{ stroke: 'transparent' }}
              tickLine={false}
            />
            <YAxis hide={true} />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--popover-foreground)',
              }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
              formatter={(value) =>
                activeTab === 'duration'
                  ? [`${value} min`, '']
                  : [`${value} cal`, '']
              }
            />
            <Bar
              dataKey={dataKey}
              fill="var(--chart-1)"
              activeBar={{ fill: 'var(--chart-2)' }}
              radius={[8, 8, 0, 0]}
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Navigation Tabs */}
      <div className="flex items-center justify-center gap-8 border-t border-border pt-4">
        <button
          onClick={() => setActiveTab('duration')}
          className={`pb-2 transition-all ${
            activeTab === 'duration'
              ? 'border-b-2 border-primary text-foreground'
              : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="text-sm font-medium">Duration</span>
        </button>
        <button
          onClick={() => setActiveTab('calories')}
          className={`pb-2 transition-all ${
            activeTab === 'calories'
              ? 'border-b-2 border-primary text-foreground'
              : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="text-sm font-medium">Calories Taken</span>
        </button>
      </div>
    </div>
  )
}
