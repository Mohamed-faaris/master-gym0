import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Activity,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Flame,
  Clock,
} from 'lucide-react'
import { useQuery } from 'convex/react'

import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@convex/_generated/api'

const privilegedRoles = new Set(['trainer', 'admin'])

type TimeScope = 'today' | 'thisWeek' | 'lastWeek'

type DataScope = 'workout' | 'diet'

const DAY_MS = 24 * 60 * 60 * 1000

const TIME_SCOPE_LABELS: Record<TimeScope, string> = {
  today: 'Today',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const getStartOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const getEndOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

const getStartOfWeekMonday = (date: Date) => {
  const next = new Date(date)
  const day = next.getDay()
  const diff = (day + 6) % 7
  next.setDate(next.getDate() - diff)
  next.setHours(0, 0, 0, 0)
  return next
}

const getEndOfWeekSunday = (date: Date) => {
  const start = getStartOfWeekMonday(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

const getRanges = (scope: TimeScope, now: Date) => {
  if (scope === 'today') {
    const rangeStart = getStartOfDay(now).getTime()
    const rangeEnd = getEndOfDay(now).getTime()
    const previousStart = getStartOfDay(new Date(now.getTime() - DAY_MS)).getTime()
    const previousEnd = getEndOfDay(new Date(now.getTime() - DAY_MS)).getTime()
    return { rangeStart, rangeEnd, previousStart, previousEnd, daysInScope: 1 }
  }

  if (scope === 'thisWeek') {
    const weekStart = getStartOfWeekMonday(now)
    const rangeStart = weekStart.getTime()
    const rangeEnd = getEndOfDay(now).getTime()
    const daysInScope =
      Math.floor((getStartOfDay(now).getTime() - weekStart.getTime()) / DAY_MS) + 1

    const previousStartDate = new Date(weekStart)
    previousStartDate.setDate(previousStartDate.getDate() - 7)
    const previousStart = previousStartDate.getTime()
    const previousEndDate = new Date(previousStartDate)
    previousEndDate.setDate(previousEndDate.getDate() + (daysInScope - 1))
    const previousEnd = getEndOfDay(previousEndDate).getTime()

    return { rangeStart, rangeEnd, previousStart, previousEnd, daysInScope }
  }

  const lastWeekStart = getStartOfWeekMonday(new Date(now.getTime() - 7 * DAY_MS))
  const lastWeekEnd = getEndOfWeekSunday(lastWeekStart)
  const previousStartDate = new Date(lastWeekStart)
  previousStartDate.setDate(previousStartDate.getDate() - 7)
  const previousEndDate = new Date(lastWeekEnd)
  previousEndDate.setDate(previousEndDate.getDate() - 7)

  return {
    rangeStart: lastWeekStart.getTime(),
    rangeEnd: lastWeekEnd.getTime(),
    previousStart: getStartOfDay(previousStartDate).getTime(),
    previousEnd: getEndOfDay(previousEndDate).getTime(),
    daysInScope: 7,
  }
}

const formatDuration = (seconds: number) => {
  const minutes = Math.round(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const formatDelta = (current: number, previous: number, formatter?: (value: number) => string) => {
  const diff = current - previous
  if (diff === 0) return 'No change'
  const sign = diff > 0 ? '+' : '-'
  const value = formatter ? formatter(Math.abs(diff)) : Math.abs(diff).toLocaleString()
  return `${sign}${value} vs prev`
}

export const Route = createFileRoute('/app/management/clients/$clientId')({
  component: ClientDetailRoute,
})

function ClientDetailRoute() {
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  const [timeScope, setTimeScope] = useState<TimeScope>('today')
  const [dataScope, setDataScope] = useState<DataScope>('workout')

  const now = useMemo(() => new Date(), [])
  const ranges = useMemo(() => getRanges(timeScope, now), [timeScope, now])

  // Fetch client data
  const client = useQuery(
    api.users.getUserById,
    clientId ? { userId: clientId } : 'skip',
  )

  const rangeData = useQuery(
    api.clientInsights.getClientRangeData,
    clientId
      ? {
          userId: clientId,
          rangeStart: ranges.rangeStart,
          rangeEnd: ranges.rangeEnd,
          previousStart: ranges.previousStart,
          previousEnd: ranges.previousEnd,
        }
      : 'skip',
  )

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      navigate({ to: '/' })
      return
    }
    if (!privilegedRoles.has(user.role)) {
      navigate({ to: '/app' })
    }
  }, [user, isLoading, navigate])

  // Early returns AFTER all hooks
  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!user || !privilegedRoles.has(user.role)) {
    return null
  }

  if (!client) {
    return <div className="p-4">Loading client...</div>
  }

  const currentWorkouts = rangeData?.current.workouts ?? []
  const previousWorkouts = rangeData?.previous.workouts ?? []
  const currentDietLogs = rangeData?.current.dietLogs ?? []
  const previousDietLogs = rangeData?.previous.dietLogs ?? []
  const currentWeightLogs = rangeData?.current.weightLogs ?? []
  const previousWeightLogs = rangeData?.previous.weightLogs ?? []

  const todayWorkoutCalories = currentWorkouts.reduce(
    (sum, workout) => sum + (workout.totalCaloriesBurned || 0),
    0,
  )
  const todayWorkoutTime = currentWorkouts.reduce(
    (sum, workout) => sum + (workout.totalTime || 0),
    0,
  )
  const todayDietCalories = currentDietLogs.reduce(
    (sum, log) => sum + (log.calories || 0),
    0,
  )

  const workoutTotals = {
    sessions: currentWorkouts.length,
    calories: currentWorkouts.reduce(
      (sum, workout) => sum + (workout.totalCaloriesBurned || 0),
      0,
    ),
    time: currentWorkouts.reduce(
      (sum, workout) => sum + (workout.totalTime || 0),
      0,
    ),
  }

  const workoutPreviousTotals = {
    sessions: previousWorkouts.length,
    calories: previousWorkouts.reduce(
      (sum, workout) => sum + (workout.totalCaloriesBurned || 0),
      0,
    ),
    time: previousWorkouts.reduce(
      (sum, workout) => sum + (workout.totalTime || 0),
      0,
    ),
  }

  const dietTotals = {
    logs: currentDietLogs.length,
    calories: currentDietLogs.reduce(
      (sum, log) => sum + (log.calories || 0),
      0,
    ),
  }

  const dietPreviousTotals = {
    logs: previousDietLogs.length,
    calories: previousDietLogs.reduce(
      (sum, log) => sum + (log.calories || 0),
      0,
    ),
  }

  const weightTotals = {
    logs: currentWeightLogs.length,
  }

  const weightPreviousTotals = {
    logs: previousWeightLogs.length,
  }

  const weekDays = useMemo(() => {
    if (timeScope === 'today') return []

    const baseStart =
      timeScope === 'lastWeek'
        ? getStartOfWeekMonday(new Date(now.getTime() - 7 * DAY_MS))
        : getStartOfWeekMonday(now)

    return WEEKDAY_LABELS.map((label, index) => {
      const dayDate = new Date(baseStart)
      dayDate.setDate(baseStart.getDate() + index)

      const dayStart = getStartOfDay(dayDate).getTime()
      const dayEnd = getEndOfDay(dayDate).getTime()
      const isFuture = timeScope === 'thisWeek' && dayStart > getEndOfDay(now).getTime()
      const isInScope = dayStart <= ranges.rangeEnd

      const source = dataScope === 'workout' ? currentWorkouts : currentDietLogs
      const value = source.filter((item) => {
        const ts = dataScope === 'workout' ? item.startTime : item.createdAt
        return ts >= dayStart && ts <= dayEnd
      }).length

      return {
        label,
        dayDate,
        value,
        isFuture,
        isInScope,
      }
    })
  }, [timeScope, dataScope, currentWorkouts, currentDietLogs, now, ranges.rangeEnd])

  const maxDayValue = Math.max(1, ...weekDays.map((day) => day.value))
  const daysWithActivity = weekDays.filter(
    (day) => day.isInScope && day.value > 0,
  ).length
  const weeklyProgressValue =
    ranges.daysInScope > 0
      ? Math.round((daysWithActivity / ranges.daysInScope) * 100)
      : 0

  return (
    <div className="space-y-6 p-4 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/app/management/clients"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to clients
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to={`/app/management/clients/${clientId}/pattern`}>
              Pattern
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              Manage today’s execution or review weekly patterns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={timeScope}
              onValueChange={(value) => setTimeScope(value as TimeScope)}
            >
              <SelectTrigger className="min-w-[160px]" size="sm">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="lastWeek">Last Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{client.email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{client.phoneNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium capitalize">
              {client.role === 'trainerManagedCustomer'
                ? 'Trainer Managed'
                : 'Self Managed'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Review Layout */}
      {timeScope !== 'today' ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Activity Overview
                </CardTitle>
                <CardDescription>{TIME_SCOPE_LABELS[timeScope]}</CardDescription>
              </div>
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {dataScope === 'workout' ? 'Workout' : 'Diet'} Focus
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2">
                {weekDays.map((day) => {
                  const height = (day.value / maxDayValue) * 100
                  return (
                    <div
                      key={day.label}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div
                        className={`w-full rounded-md bg-muted/70 relative h-20 overflow-hidden ${
                          day.isFuture ? 'opacity-40' : ''
                        }`}
                      >
                        <div
                          className={`absolute inset-x-0 bottom-0 rounded-md ${
                            dataScope === 'workout'
                              ? 'bg-primary'
                              : 'bg-chart-2'
                          }`}
                          style={{
                            height: `${Math.max(6, height)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {day.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Tabs
            value={dataScope}
            onValueChange={(value) => setDataScope(value as DataScope)}
            defaultValue="workout"
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="workout">
                <Dumbbell className="h-4 w-4" />
                Workout
              </TabsTrigger>
              <TabsTrigger value="diet">
                <UtensilsCrossed className="h-4 w-4" />
                Diet
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {dataScope === 'workout' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Sessions
                    </span>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-semibold">
                    {workoutTotals.sessions}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDelta(
                      workoutTotals.sessions,
                      workoutPreviousTotals.sessions,
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Time
                    </span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-semibold">
                    {formatDuration(workoutTotals.time)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDelta(
                      workoutTotals.time,
                      workoutPreviousTotals.time,
                      (value) => formatDuration(value),
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Calories Burned
                    </span>
                    <Flame className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-semibold text-primary">
                    {workoutTotals.calories.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDelta(
                      workoutTotals.calories,
                      workoutPreviousTotals.calories,
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Logs</span>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-semibold">
                    {dietTotals.logs}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDelta(dietTotals.logs, dietPreviousTotals.logs)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Calories
                    </span>
                    <Flame className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-semibold text-chart-2">
                    {dietTotals.calories.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDelta(
                      dietTotals.calories,
                      dietPreviousTotals.calories,
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Avg Calories
                    </span>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-semibold">
                    {dietTotals.logs > 0
                      ? Math.round(dietTotals.calories / dietTotals.logs)
                      : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDelta(
                      dietTotals.logs > 0
                        ? dietTotals.calories / dietTotals.logs
                        : 0,
                      dietPreviousTotals.logs > 0
                        ? dietPreviousTotals.calories / dietPreviousTotals.logs
                        : 0,
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Progress</CardTitle>
              <CardDescription>
                {dataScope === 'workout'
                  ? 'Days with completed workouts'
                  : 'Days with logged meals'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {daysWithActivity} of {ranges.daysInScope} days active
                </span>
                <span className="font-medium">{weeklyProgressValue}%</span>
              </div>
              <Progress value={weeklyProgressValue} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today - Action First */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Workouts Today
                  </span>
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-semibold text-primary">
                  {workoutTotals.sessions}
                </p>
                <p className="text-xs text-muted-foreground">
                  {todayWorkoutCalories.toLocaleString()} kcal ·{' '}
                  {formatDuration(todayWorkoutTime)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Meals Logged
                  </span>
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-semibold text-chart-2">
                  {dietTotals.logs}
                </p>
                <p className="text-xs text-muted-foreground">
                  {todayDietCalories.toLocaleString()} kcal consumed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Weight Logs
                  </span>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-semibold text-emerald-600">
                  {weightTotals.logs}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDelta(weightTotals.logs, weightPreviousTotals.logs)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Daily Completion
                  </span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-semibold">
                  {workoutTotals.sessions > 0 && dietTotals.logs > 0
                    ? 'On track'
                    : 'Needs input'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Track all three logs to keep streaks alive.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Progress</CardTitle>
              <CardDescription>
                Mark off the essentials for today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Workout logged</span>
                  <span className="font-medium">
                    {workoutTotals.sessions > 0 ? 'Done' : 'Pending'}
                  </span>
                </div>
                <Progress value={workoutTotals.sessions > 0 ? 100 : 0} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meals logged</span>
                  <span className="font-medium">
                    {dietTotals.logs > 0 ? 'Done' : 'Pending'}
                  </span>
                </div>
                <Progress value={dietTotals.logs > 0 ? 100 : 0} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weight logged</span>
                  <span className="font-medium">
                    {weightTotals.logs > 0 ? 'Done' : 'Pending'}
                  </span>
                </div>
                <Progress value={weightTotals.logs > 0 ? 100 : 0} />
              </div>
            </CardContent>
          </Card>

          {/* Log Actions - Simple Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() =>
                navigate({ to: `/app/management/clients/${clientId}/logs/workout` })
              }
              variant="outline"
              className="h-12 w-full"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              View Workout Sessions
            </Button>

            <Button
              onClick={() =>
                navigate({ to: `/app/management/clients/${clientId}/logs/diet` })
              }
              variant="outline"
              className="h-12 w-full"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              View Diet Logs
            </Button>

            <Button
              onClick={() =>
                navigate({ to: `/app/management/clients/${clientId}/logs/weight` })
              }
              variant="outline"
              className="h-12 w-full"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Weight Logs
            </Button>
          </div>

          {/* Log Workout Button */}
          <Card>
            <CardHeader>
              <CardTitle>Log Workout Session</CardTitle>
              <CardDescription>
                Record a new workout for {client.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate({ to: 'workout-session' })}
                className="w-full h-10"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Start Workout Session
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
