'use client'

import { RadialBar, RadialBarChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useAuth } from '@/components/auth/useAuth'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

const chartConfig = {
  calories: {
    label: 'Calories',
    color: 'var(--chart-1)',
  },
  workout: {
    label: 'Workout',
    color: 'var(--chart-2)',
  },
  protein: {
    label: 'Protein',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

// Default targets - these could come from user settings
const TARGETS = {
  caloriesConsumed: 2000, // kcal
  workoutTime: 60, // minutes
  caloriesBurned: 500, // kcal
}

export function TodayProgressChart() {
  const { user } = useAuth()

  // Get today's diet logs for calories consumed
  const todayCalories = useQuery(
    api.dietLogs.getTodayCalories,
    user ? { userId: user._id } : 'skip',
  )

  // Get today's workout logs
  const recentSessions = useQuery(
    api.workoutSessions.getSessionHistory,
    user ? { userId: user._id, limit: 10 } : 'skip',
  )

  // Calculate today's workout stats
  const getTodayWorkoutStats = () => {
    if (!recentSessions) return { duration: 0, caloriesBurned: 0 }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    const todayWorkouts = recentSessions.filter(
      (w) => w.startTime >= todayTimestamp && w.status === 'completed',
    )

    const duration = todayWorkouts.reduce(
      (sum, w) => sum + Math.round((w.totalTime || 0) / 60),
      0,
    )
    const caloriesBurned = todayWorkouts.reduce(
      (sum, w) => sum + (w.totalCaloriesBurned || 0),
      0,
    )

    return { duration, caloriesBurned }
  }

  const todayWorkoutStats = getTodayWorkoutStats()
  const caloriesConsumed = todayCalories?.totalCalories ?? 0

  const caloriesPercent = Math.min(
    100,
    Math.round((caloriesConsumed / TARGETS.caloriesConsumed) * 100),
  )
  const workoutPercent = Math.min(
    100,
    Math.round((todayWorkoutStats.duration / TARGETS.workoutTime) * 100),
  )
  const burnedPercent = Math.min(
    100,
    Math.round(
      (todayWorkoutStats.caloriesBurned / TARGETS.caloriesBurned) * 100,
    ),
  )

  const chartData = [
    { metric: 'protein', value: burnedPercent, fill: 'var(--color-protein)' },
    { metric: 'workout', value: workoutPercent, fill: 'var(--color-workout)' },
    {
      metric: 'calories',
      value: caloriesPercent,
      fill: 'var(--color-calories)',
    },
  ]

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Sign in to see progress
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          {/* Radial Chart */}
          <div className="relative overflow-visible">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square w-60 h-60 overflow-visible"
            >
              <RadialBarChart
                data={chartData}
                startAngle={-90}
                endAngle={270}
                innerRadius={23}
                outerRadius={83}
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="metric" />}
                />
                <RadialBar dataKey="value" background cornerRadius={8} />
              </RadialBarChart>
            </ChartContainer>
          </div>

          {/* Legends */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-1" />
              <div>
                <div className="text-sm font-medium">Calories Eaten</div>
                <div className="text-xs text-muted-foreground">
                  {caloriesConsumed} / {TARGETS.caloriesConsumed} kcal
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-2" />
              <div>
                <div className="text-sm font-medium">Workout Time</div>
                <div className="text-xs text-muted-foreground">
                  {todayWorkoutStats.duration} / {TARGETS.workoutTime} min
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-4" />
              <div>
                <div className="text-sm font-medium">Calories Burned</div>
                <div className="text-xs text-muted-foreground">
                  {todayWorkoutStats.caloriesBurned} / {TARGETS.caloriesBurned}{' '}
                  kcal
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
