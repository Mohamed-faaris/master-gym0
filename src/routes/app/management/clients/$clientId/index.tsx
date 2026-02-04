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

    return {
      day: day.toLocaleDateString('en-US', { weekday: 'short' }),
      date: formatDateShort(day),
      workouts: dayWorkouts.length,
      diets: dayDiets.length,
      isActive: dayWorkouts.length > 0 || dayDiets.length > 0,
    }
  })

  return (
    <div className="space-y-6 p-4 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <header className="space-y-3">
        <Link
          to="/app/management/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">{client.name}</h1>
        </div>
      </header>

      {/* Date Context Selector */}
      <div className="flex items-center justify-between">
        <DateContextSelector value={dateScope} onChange={setDateScope} />
      </div>

      {/* Conditional Layout Based on Date Scope */}
      {dateScope === 'today' ? (
        <>
          {/* TODAY MODE: Action-First Layout */}

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

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {filteredWorkouts.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Workouts Today
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-chart-2">
                    {filteredDiets.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Diet Logs Today
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">
                    {weightLogs?.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Weight Logs
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  to: `/app/management/clients/${clientId}/logs/diet`,
                })
              }
              variant="outline"
              className="h-12 w-full"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Log Diet Entry
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
              Log Weight
            </Button>
          </div>

          {/* Assign Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Dumbbell className="w-4 h-4" />
                  Assign Workout Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() =>
                    navigate({
                      to: `/app/management/clients/${clientId}/pattern`,
                    })
                  }
                  variant="outline"
                  className="w-full"
                >
                  Manage Plans
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UtensilsCrossed className="w-4 h-4" />
                  View Diet Plans
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() =>
                    navigate({
                      to: `/app/management/clients/${clientId}/pattern`,
                    })
                  }
                  variant="outline"
                  className="w-full"
                >
                  Manage Plans
                </Button>
              </CardContent>
            </Card>
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
                  Workouts
                </Button>
                <Button
                  variant={dataType === 'diet' ? 'default' : 'outline'}
                  onClick={() => setDataType('diet')}
                  className="flex-1"
                >
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                  Diet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Summary Cards */}
          {dataType === 'workout' ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Workout Summary</CardTitle>
                  <CardDescription>
                    {getComparisonLabel(dateScope)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Sessions
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {filteredWorkouts.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Days Completed
                    </p>
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

              <Button
                onClick={() =>
                  navigate({
                    to: `/app/management/clients/${clientId}/logs/workout`,
                  })
                }
                variant="outline"
                className="w-full h-12"
              >
                View All Workout Sessions
              </Button>
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Diet Summary</CardTitle>
                  <CardDescription>
                    {getComparisonLabel(dateScope)}
                  </CardDescription>
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
                      {daysData.filter((d) => d.diets > 0).length}/
                      {daysData.length}
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

              <Button
                onClick={() =>
                  navigate({
                    to: `/app/management/clients/${clientId}/logs/diet`,
                  })
                }
                variant="outline"
                className="w-full h-12"
              >
                View All Diet Logs
              </Button>
            </>
          )}

          {/* View Assigned Plans */}
          <Button
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
          </Button>
        </>
      )}
    </div>
  )
}
