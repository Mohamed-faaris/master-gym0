import { useEffect, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  Dumbbell,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'

import { api } from '@convex/_generated/api'
import type {DateScope} from '@/components/date-context-selector';
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
  DateContextSelector
  
} from '@/components/date-context-selector'

const privilegedRoles = new Set(['trainer', 'admin'])

export const Route = createFileRoute(
  '/app/management/clients/$clientId/pattern',
)({
  component: PatternRoute,
})

function PatternRoute() {
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  // State
  const [dateScope, setDateScope] = useState<DateScope>('today')
  const [selectedTrainingPlan, setSelectedTrainingPlan] = useState('')
  const [selectedDietPlan, setSelectedDietPlan] = useState('')

  const client = useQuery(
    api.users.getUserById,
    clientId ? { userId: clientId as any } : 'skip',
  )

  const trainingPlans = useQuery(api.trainingPlans.getAllTrainingPlans)
  const dietPlans = useQuery(
    api.dietPlans.getDietPlansByUser,
    user ? { userId: user._id } : 'skip',
  )

  // Mutations
  const assignTrainingPlan = useMutation(
    api.trainingPlans.assignTrainingPlanToUser,
  )

  // Get client's assigned plans (would need API endpoint)
  // const clientAssignedPlans = useQuery(
  //   api.users.getAssignedPlans,
  //   clientId ? { userId: clientId } : 'skip',
  // )

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

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!user || !privilegedRoles.has(user.role)) {
    return null
  }

  if (!client) {
    return <div className="p-4">Loading client...</div>
  }

  return (
    <div className="space-y-6 p-4 pb-20 max-w-4xl mx-auto">
      <header className="space-y-3">
        <Link
          to={`/app/management/clients/$clientId`}
          params={{ clientId }}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to client detail
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Training & Diet Plans</h1>
            <p className="text-sm text-muted-foreground">
              Assign and manage plans for {client.name}
            </p>
          </div>
          
        </div>
      </header>

      {/* Date Context for Plan Review */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Plan Duration</h2>
        <DateContextSelector value={dateScope} onChange={setDateScope} />
      </div>

      {/* Assign Workout Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Assign Workout Plan
          </CardTitle>
          <CardDescription>
            Select a training plan to assign to this client
            {dateScope !== 'today' &&
              ` for ${dateScope === 'this-week' ? 'this week' : 'last week'}`}
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
            value={selectedTrainingPlan}
            onChange={(e) => setSelectedTrainingPlan(e.target.value)}
            aria-label="Select a workout plan"
          >
            <option value="">Select a workout plan...</option>
            {trainingPlans?.map((plan) => (
              <option key={plan._id} value={plan._id}>
                {plan.name}
              </option>
            ))}
          </select>

          {selectedTrainingPlan && (
            <Card className="bg-muted border-0">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {trainingPlans?.find((p) => p._id === selectedTrainingPlan)
                      ?.name || 'Selected Plan'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trainingPlans?.find((p) => p._id === selectedTrainingPlan)
                      ?.description || 'No description'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            className="w-full"
            disabled={!selectedTrainingPlan}
            onClick={async () => {
              if (!selectedTrainingPlan) return
              try {
                await assignTrainingPlan({
                  userId: clientId as any,
                  trainingPlanId: selectedTrainingPlan as any,
                })
                setSelectedTrainingPlan('')
                // Show success toast here
              } catch (error) {
                console.error('Failed to assign workout plan:', error)
                // Show error toast here
              }
            }}
          >
            <Check className="w-4 h-4 mr-2" />
            Assign Plan
          </Button>
        </CardContent>
      </Card>

      {/* Current Assigned Workouts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="w-4 h-4" />
            Currently Assigned
          </CardTitle>
          <CardDescription>
            Active workout plans for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trainingPlans && trainingPlans.length > 0 ? (
              trainingPlans.map((plan) => (
                <div
                  key={plan._id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                      // Unassign logic here
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No workout plans assigned
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assign Diet Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            Assign Diet Plan
          </CardTitle>
          <CardDescription>
            Select a diet plan to assign to this client
            {dateScope !== 'today' &&
              ` for ${dateScope === 'this-week' ? 'this week' : 'last week'}`}
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
            value={selectedDietPlan}
            onChange={(e) => setSelectedDietPlan(e.target.value)}
            aria-label="Select a diet plan"
          >
            <option value="">Select a diet plan...</option>
            {dietPlans?.map((plan) => (
              <option key={plan._id} value={plan._id}>
                {plan.name}
              </option>
            ))}
          </select>

          {selectedDietPlan && (
            <Card className="bg-muted border-0">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {dietPlans?.find((p) => p._id === selectedDietPlan)?.name ||
                      'Selected Plan'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dietPlans?.find((p) => p._id === selectedDietPlan)
                      ?.description || 'No description'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            className="w-full"
            disabled={!selectedDietPlan}
            onClick={async () => {
              if (!selectedDietPlan) return
              // Assign diet plan logic here
              setSelectedDietPlan('')
            }}
          >
            <Check className="w-4 h-4 mr-2" />
            Assign Plan
          </Button>
        </CardContent>
      </Card>

      {/* Current Assigned Diet Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            Currently Assigned
          </CardTitle>
          <CardDescription>Active diet plans for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dietPlans && dietPlans.length > 0 ? (
              dietPlans.map((plan) => (
                <div
                  key={plan._id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                      // Unassign diet plan logic here
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No diet plans assigned
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Plans assigned with different date scopes allow you to rotate or
            adjust training and diet based on time periods. Use the date
            selector above to review and modify plans for specific time windows.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
