import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Activity,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'

import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@convex/_generated/api'

const privilegedRoles = new Set(['trainer', 'admin'])

export const Route = createFileRoute('/app/management/clients/$clientId')({
  component: ClientDetailRoute,
})

function ClientDetailRoute() {
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  // Fetch client data
  const client = useQuery(
    api.users.getUserById,
    clientId ? { userId: clientId } : 'skip',
  )

  const workoutLogs = useQuery(
    api.workoutLogs.getWorkoutLogsByUser,
    clientId ? { userId: clientId } : 'skip',
  )

  const dietLogs = useQuery(
    api.dietLogs.getDietLogsByUser,
    clientId ? { userId: clientId, limit: 100 } : 'skip',
  )

  const weightLogs = useQuery(
    api.weightLogs.getWeightLogsByUser,
    clientId ? { userId: clientId } : 'skip',
  )

  // Fetch training plans and diet plans
  const trainingPlans = useQuery(api.trainingPlans.getAllTrainingPlans)
  const dietPlans = useQuery(
    api.dietPlans.getDietPlansByUser,
    user ? { userId: user._id } : 'skip',
  )

  // Mutations for assigning
  const assignTrainingPlan = useMutation(
    api.trainingPlans.assignTrainingPlanToUser,
  )

  // State for dropdowns
  const [selectedTrainingPlan, setSelectedTrainingPlan] = useState<string>('')

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
          <p className="text-muted-foreground">
            {client.goal?.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </p>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {workoutLogs?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Workouts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-chart-2">
                {dietLogs?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Diet Logs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">
                {weightLogs?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Weight Logs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assign Workout & Diet Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="w-4 h-4" />
              Assign Workout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <select
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
              value={selectedTrainingPlan}
              onChange={(e) => setSelectedTrainingPlan(e.target.value)}
            >
              <option value="">Select a workout plan...</option>
              {trainingPlans?.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <Button
              className="w-full"
              onClick={async () => {
                if (!selectedTrainingPlan) return
                try {
                  await assignTrainingPlan({
                    userId: clientId,
                    trainingPlanId: selectedTrainingPlan,
                  })
                  setSelectedTrainingPlan('')
                } catch (error) {
                  console.error('Failed to assign workout plan:', error)
                }
              }}
            >
              Assign
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="w-4 h-4" />
              Available Diet Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {dietPlans && dietPlans.length > 0 ? (
                dietPlans.map((plan) => (
                  <div
                    key={plan._id}
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    <p className="font-medium text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No diet plans available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
          View Workout Logs
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

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Workout Progress</p>
            <p className="text-2xl font-bold text-primary">
              {workoutLogs?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total workouts logged
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Diet Progress</p>
            <p className="text-2xl font-bold text-chart-2">
              {dietLogs?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Diet logs recorded
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Weight Tracking</p>
            <p className="text-2xl font-bold text-emerald-600">
              {weightLogs?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Weight logs recorded
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
