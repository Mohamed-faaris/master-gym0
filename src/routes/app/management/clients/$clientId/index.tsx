import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Activity,
  Dumbbell,
  UtensilsCrossed,
  BarChart3,
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
import {
  DateContextSelector,
  type DateScope,
} from '@/components/date-context-selector'
import { ActivityWeekCard } from '@/components/activity-week-card'
import {
  filterByDateScope,
  getDaysOfWeek,
  getDateRange,
  formatDateShort,
  getComparisonLabel,
} from '@/lib/date-helpers'
import { api } from '@convex/_generated/api'

const privilegedRoles = new Set(['trainer', 'admin'])

export const Route = createFileRoute('/app/management/clients/$clientId/')({
  component: ClientDetailRoute,
})

function ClientDetailRoute() {
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  // State for date scope and data type toggle
  const [dateScope, setDateScope] = useState<DateScope>('today')
  const [dataType, setDataType] = useState<'workout' | 'diet'>('workout')

  // Fetch client data
  const client = useQuery(
    api.users.getUserById,
    clientId ? { userId: clientId as any } : 'skip',
  )

  const workoutSessions = useQuery(
    api.workoutSessions.getSessionHistory,
    clientId ? { userId: clientId as any, limit: 100 } : 'skip',
  )

  const dietLogs = useQuery(
    api.dietLogs.getDietLogsByUser,
    clientId ? { userId: clientId as any, limit: 100 } : 'skip',
  )

  const weightLogs = useQuery(
    api.weightLogs.getWeightLogsByUser,
    clientId ? { userId: clientId as any } : 'skip',
  )

  const trainingPlan = useQuery(
    api.trainingPlans.getTrainingPlanById,
    client?.trainingPlanId ? { trainingPlanId: client.trainingPlanId } : 'skip',
  )

  // Fetch training plans and diet plans (kept for potential future use)
  useQuery(api.trainingPlans.getAllTrainingPlans)
  useQuery(
    api.dietPlans.getDietPlansByUser,
    user ? { userId: user._id } : 'skip',
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

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  // Calculate filtered data
  const filteredWorkouts = workoutSessions
    ? filterByDateScope(workoutSessions, dateScope)
    : []
  const filteredDiets = dietLogs ? filterByDateScope(dietLogs, dateScope) : []

  const { start: scopeStart, end: scopeEnd } = getDateRange(dateScope)
  const scopeDays = getDaysOfWeek(dateScope)

  const workoutsInScope = (workoutSessions || []).filter((session) => {
    const time = session.startTime || session._creationTime
    return time >= scopeStart.getTime() && time <= scopeEnd.getTime()
  })

  const dietLogsInScope = (dietLogs || []).filter((log) => {
    return log.createdAt >= scopeStart.getTime() && log.createdAt <= scopeEnd.getTime()
  })

  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

  const plannedWorkoutDays = scopeDays.filter((day) => {
    const dayKey = dayKeys[day.getDay()]
    const plannedDay = trainingPlan?.days.find((d) => d.day === dayKey)
    return (plannedDay?.exercises?.length || 0) > 0
  })

  const completedWorkoutsCount = workoutsInScope.filter(
    (session) => session.status === 'completed',
  ).length

  const plannedWorkoutsCount = plannedWorkoutDays.length
  const workoutProgressPercent =
    plannedWorkoutsCount > 0
      ? Math.min(
          100,
          Math.round((completedWorkoutsCount / plannedWorkoutsCount) * 100),
        )
      : 0

  const dietTargetPerDay = 3
  const dietTargetTotal = dietTargetPerDay * scopeDays.length
  const dietProgressPercent =
    dietTargetTotal > 0
      ? Math.min(100, Math.round((dietLogsInScope.length / dietTargetTotal) * 100))
      : 0

  const latestWorkout = workoutsInScope
    .slice()
    .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))[0]

  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.round(seconds / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const activeDurationLabel = latestWorkout
    ? formatDuration(latestWorkout.totalTime || 0)
    : '0m'

  const weightLogsInScope = (weightLogs || []).filter((log) => {
    return (
      log.createdAt >= scopeStart.getTime() &&
      log.createdAt <= scopeEnd.getTime()
    )
  })

  const averageWeight =
    weightLogsInScope.length > 0
      ? weightLogsInScope.reduce((sum, log) => sum + log.weight, 0) /
        weightLogsInScope.length
      : null

  const scopeLabel =
    dateScope === 'this-week'
      ? 'This Week'
      : dateScope === 'last-week'
        ? 'Last Week'
        : 'Today'

  // Build days data for activity card
  const daysOfWeek = getDaysOfWeek(dateScope)
  const daysData = daysOfWeek.map((day) => {
    const dayStart = new Date(day)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)

    const dayWorkouts = (workoutSessions || []).filter((s) => {
      const time = s._creationTime
      return time >= dayStart.getTime() && time <= dayEnd.getTime()
    })

    const dayDiets = (dietLogs || []).filter((d) => {
      const time = d._creationTime
      return time >= dayStart.getTime() && time <= dayEnd.getTime()
    })

    const workoutMinutes = Math.round(
      dayWorkouts.reduce((sum, session) => sum + (session.totalTime || 0), 0) /
        60,
    )

    const dietCalories = dayDiets.reduce(
      (sum, log) => sum + (log.calories || 0),
      0,
    )

    return {
      day: day.toLocaleDateString('en-US', { weekday: 'short' }),
      date: formatDateShort(day),
      workouts: dayWorkouts.length,
      diets: dayDiets.length,
      workoutMinutes,
      dietCalories,
      isActive: dayWorkouts.length > 0 || dayDiets.length > 0,
    }
  })

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 pb-20">
      {/* Header */}
      <header className="space-y-3">
        <Link
          to="/app/management/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="min-w-0 text-3xl font-semibold break-words">
            {client.name}
          </h1>
          <Button
            onClick={() =>
              navigate({
                to: `/app/management/clients/${clientId}/pattern`,
              })
            }
            variant="outline"
            className="w-full shrink-0 sm:w-auto"
          >
            Pattern
          </Button>
        </div>
      </header>

      {/* Date Context Selector */}
      <div className="flex w-full items-center justify-between">
        <DateContextSelector value={dateScope} onChange={setDateScope} />
      </div>

      {/* Conditional Layout Based on Date Scope */}
      {dateScope === 'today' ? (
        <>
          {/* TODAY MODE: Action-First Layout */}

          {/* Client Info */}

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-3 text-center min-[430px]:grid-cols-3">
                <div className="min-w-0 rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">
                    Workout Progress
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {workoutProgressPercent}%
                  </p>
                </div>
                <div className="min-w-0 rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Diet Progress</p>
                  <p className="text-2xl font-bold text-chart-2">
                    {dietProgressPercent}%
                  </p>
                </div>
                <div className="min-w-0 rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">
                    Active Duration
                  </p>
                  <p className="text-2xl font-bold">{activeDurationLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() =>
                navigate({
                  to: `/app/management/clients/${clientId}/workout-session`,
                })
              }
              className="w-full h-12"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              Log Workout Session
            </Button>

            <Button
              onClick={() =>
                navigate({
                  to: `/app/management/clients/${clientId}/view-work`,
                })
              }
              variant="outline"
              className="h-12 w-full"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              View Workout Sessions
            </Button>

            <Button
              onClick={() =>
                navigate({
                  to: `/app/management/clients/${clientId}/logs/diet`,
                })
              }
              variant="outline"
              className="h-12 w-full"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              View Diet Entry
            </Button>

            <Button
              onClick={() =>
                navigate({
                  to: `/app/management/clients/${clientId}/logs/weight`,
                })
              }
              variant="outline"
              className="h-12 w-full"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Weight
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* WEEKLY MODE: Review & Analysis Layout */}

          {/* Activity Card */}
          <ActivityWeekCard
            scope={dateScope}
            days={daysData}
            dataType={dataType}
          />

          {/* Workout/Diet Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={dataType === 'workout' ? 'default' : 'outline'}
                  onClick={() => setDataType('workout')}
                  className="flex-1"
                >
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Duration
                </Button>
                <Button
                  variant={dataType === 'diet' ? 'default' : 'outline'}
                  onClick={() => setDataType('diet')}
                  className="flex-1"
                >
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                  Calories
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Average Weight ({scopeLabel})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {averageWeight !== null ? averageWeight.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">lbs</p>
            </CardContent>
          </Card>

          {/* Weekly Summary Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workout Summary</CardTitle>
              <CardDescription>{getComparisonLabel(dateScope)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold text-primary">
                  {filteredWorkouts.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Completed</p>
                <p className="text-2xl font-bold">
                  {daysData.filter((d) => d.workouts > 0).length}/
                  {daysData.length}
                </p>
              </div>
              <div className="pt-4 border-t">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  {/* stylelint-disable */}
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={
                      {
                        width: `${(daysData.filter((d) => d.workouts > 0).length / daysData.length) * 100}%`,
                      } as React.CSSProperties
                    }
                  />
                  {/* stylelint-enable */}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Consistency:{' '}
                  {Math.round(
                    (daysData.filter((d) => d.workouts > 0).length /
                      daysData.length) *
                      100,
                  )}
                  %
                </p>
              </div>
            </CardContent>
          </Card>

          {/* <Button
            onClick={() =>
              navigate({
                to: `/app/management/clients/${clientId}/logs/workout`,
              })
            }
            variant="outline"
            className="w-full h-12"
          >
            View All Workout Sessions
          </Button> */}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Diet Summary</CardTitle>
              <CardDescription>{getComparisonLabel(dateScope)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-3xl font-bold text-chart-2">
                  {filteredDiets.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Logged</p>
                <p className="text-2xl font-bold">
                  {daysData.filter((d) => d.diets > 0).length}/{daysData.length}
                </p>
              </div>
              <div className="pt-4 border-t">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  {/* stylelint-disable */}
                  <div
                    className="bg-chart-2 h-2 rounded-full transition-all"
                    style={
                      {
                        width: `${(daysData.filter((d) => d.diets > 0).length / daysData.length) * 100}%`,
                      } as React.CSSProperties
                    }
                  />
                  {/* stylelint-enable */}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Consistency:{' '}
                  {Math.round(
                    (daysData.filter((d) => d.diets > 0).length /
                      daysData.length) *
                      100,
                  )}
                  %
                </p>
              </div>
            </CardContent>
          </Card>

          {/* <Button
            onClick={() =>
              navigate({
                to: `/app/management/clients/${clientId}/logs/diet`,
              })
            }
            variant="outline"
            className="w-full h-12"
          >
            View All Diet Logs
          </Button> */}

          {/* View Assigned Plans */}
          {/* <Button
            onClick={() =>
              navigate({
                to: `/app/management/clients/${clientId}/pattern`,
              })
            }
            variant="outline"
            className="w-full h-12"
          >
            <Dumbbell className="w-4 h-4 mr-2" />
            View Assigned Plans
          </Button> */}
        </>
      )}
    </div>
  )
}
