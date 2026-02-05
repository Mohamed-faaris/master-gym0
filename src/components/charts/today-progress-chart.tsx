'use client'

import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'
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
    label: 'Calories Eaten',
    color: 'var(--chart-1)',
  },
  duration: {
    label: 'Duration',
    color: 'var(--chart-2)',
  },
  progress: {
    label: 'Progress',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

const TARGETS = {
  caloriesConsumed: 2000, // kcal
  workoutTime: 60, // minutes
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

  const getTodayWorkoutStats = () => {
    if (!recentSessions) {
      return {
        durationMinutes: 0,
        completedSets: 0,
        totalSets: 0,
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    const todayWorkouts = recentSessions.filter(
      (w) => w.startTime >= todayTimestamp,
    )

    let durationMinutes = 0
    let completedSets = 0
    let totalSets = 0

    todayWorkouts.forEach((session) => {
      durationMinutes += Math.round((session.totalTime || 0) / 60)

      session.exercises?.forEach((exercise) => {
        const sets = exercise.sets ?? []
        const totalForExercise =
          sets.length > 0 ? sets.length : exercise.noOfSets || 0
        totalSets += totalForExercise
        completedSets += sets.filter((set) => set.completed).length
      })
    })

    return { durationMinutes, completedSets, totalSets }
  }

  const todayWorkoutStats = getTodayWorkoutStats()
  const caloriesConsumed = todayCalories?.totalCalories ?? 0
  const progressPercent =
    todayWorkoutStats.totalSets > 0
      ? Math.round(
          (todayWorkoutStats.completedSets / todayWorkoutStats.totalSets) * 100,
        )
      : 0
  const caloriesPercent = Math.min(
    100,
    Math.round((caloriesConsumed / TARGETS.caloriesConsumed) * 100),
  )
  const durationPercent = Math.min(
    100,
    Math.round((todayWorkoutStats.durationMinutes / TARGETS.workoutTime) * 100),
  )

  const chartData = [
    { metric: 'progress', value: progressPercent, fill: 'var(--color-progress)' },
    { metric: 'duration', value: durationPercent, fill: 'var(--color-duration)' },
    { metric: 'calories', value: caloriesPercent, fill: 'var(--color-calories)' },
  ]

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours <= 0) return `${mins}m`
    return `${hours}h ${mins}m`
  }

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
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  tick={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="metric" />}
                />
                <RadialBar dataKey="value" background cornerRadius={8} />
              </RadialBarChart>
            </ChartContainer>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-1" />
              <div>
                <div className="text-sm font-medium">Calories Eaten</div>
                <div className="text-xs text-muted-foreground">
                  {caloriesConsumed.toLocaleString()} /{' '}
                  {TARGETS.caloriesConsumed} kcal
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-2" />
              <div>
                <div className="text-sm font-medium">Duration</div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(todayWorkoutStats.durationMinutes)} /{' '}
                  {TARGETS.workoutTime} min
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-4" />
              <div>
                <div className="text-sm font-medium">Progress</div>
                <div className="text-xs text-muted-foreground">
                  {todayWorkoutStats.completedSets}/
                  {todayWorkoutStats.totalSets} sets
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
