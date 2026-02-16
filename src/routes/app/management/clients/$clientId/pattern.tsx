import { useEffect, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  Dumbbell,
  Eye,
  Pencil,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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
  const [selectedTrainingPlan, setSelectedTrainingPlan] = useState('')
  const [selectedDietPlan, setSelectedDietPlan] = useState('')
  const [assignedTrainingPlanId, setAssignedTrainingPlanId] = useState('')
  const [assignedDietPlanId, setAssignedDietPlanId] = useState('')

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
  const unassignTrainingPlan = useMutation(
    api.trainingPlans.unassignTrainingPlanFromUser,
  )
  const assignDietPlan = useMutation(api.dietPlans.assignDietPlanToUser)
  const unassignDietPlan = useMutation(api.dietPlans.unassignDietPlanFromUser)

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

  useEffect(() => {
    if (!client?.trainingPlanId) return
    setAssignedTrainingPlanId(client.trainingPlanId)
  }, [client?.trainingPlanId])

  useEffect(() => {
    setAssignedDietPlanId(client?.dietPlanId ?? '')
  }, [client?.dietPlanId])

  const assignedTrainingPlan = trainingPlans?.find(
    (plan) => plan._id === assignedTrainingPlanId,
  )
  const nonCopyTrainingPlans =
    trainingPlans?.filter((plan) => !plan.isCopy) ?? []
  const assignedWorkoutDropdownPlans =
    assignedTrainingPlan && assignedTrainingPlan.isCopy
      ? [assignedTrainingPlan, ...nonCopyTrainingPlans]
      : nonCopyTrainingPlans
  const assignedDietPlan = dietPlans?.find(
    (plan) => plan._id === assignedDietPlanId,
  )

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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-semibold">Assigned Workout</h2>
          <select
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
            value={assignedTrainingPlanId}
            onChange={(e) => setAssignedTrainingPlanId(e.target.value)}
            aria-label="Assigned workout plan"
          >
            <option value="">No workout plan assigned</option>
            {assignedWorkoutDropdownPlans.map((plan) => (
              <option key={plan._id} value={plan._id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">Assigned Diet</h2>
          <select
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
            value={assignedDietPlanId}
            onChange={(e) => setAssignedDietPlanId(e.target.value)}
            aria-label="Assigned diet plan"
          >
            <option value="">No diet plan assigned</option>
            {dietPlans?.map((plan) => (
              <option key={plan._id} value={plan._id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assign Workout Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Assign Workout Plan
          </CardTitle>
          <CardDescription>
            Select a training plan to assign to this client.
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
            {nonCopyTrainingPlans.map((plan) => (
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
                    {nonCopyTrainingPlans.find(
                      (p) => p._id === selectedTrainingPlan,
                    )?.name || 'Selected Plan'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nonCopyTrainingPlans.find(
                      (p) => p._id === selectedTrainingPlan,
                    )?.description || 'No description'}
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
                setAssignedTrainingPlanId(selectedTrainingPlan)
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
            {assignedTrainingPlan ? (
              <div
                key={assignedTrainingPlan._id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {assignedTrainingPlan.name}
                  </p>
                  {/* <p className="text-xs text-muted-foreground">
                      {assignedTrainingPlan.description}
                    </p> */}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="View workout plan"
                    onClick={() =>
                      navigate({
                        to: '/app/management/programs/$programId',
                        params: { programId: assignedTrainingPlan._id },
                      })
                    }
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Edit workout plan"
                    onClick={() =>
                      navigate({
                        to: '/app/management/programs/$programId/edit',
                        params: { programId: assignedTrainingPlan._id },
                      })
                    }
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                      try {
                        await unassignTrainingPlan({ userId: clientId as any })
                        setAssignedTrainingPlanId('')
                      } catch (error) {
                        console.error('Failed to unassign workout plan:', error)
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No workout plans assignedb
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
            Select a diet plan to assign to this client.
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
              try {
                await assignDietPlan({
                  userId: clientId as any,
                  dietPlanId: selectedDietPlan as any,
                })
                setAssignedDietPlanId(selectedDietPlan)
                setSelectedDietPlan('')
                toast.success('Diet plan assigned')
              } catch (error) {
                console.error('Failed to assign diet plan:', error)
                toast.error('Failed to assign diet plan')
              }
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
            {assignedDietPlan ? (
              <div
                key={assignedDietPlan._id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{assignedDietPlan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignedDietPlan.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="View diet plan"
                    onClick={() =>
                      navigate({
                        to: '/app/management/diet-plans/$planId',
                        params: { planId: assignedDietPlan._id },
                      })
                    }
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Edit diet plan"
                    onClick={() =>
                      navigate({
                        to: '/app/management/diet-plans/$planId',
                        params: { planId: assignedDietPlan._id },
                      })
                    }
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                      try {
                        await unassignDietPlan({ userId: clientId as any })
                        setAssignedDietPlanId('')
                        toast.success('Diet plan unassigned')
                      } catch (error) {
                        console.error('Failed to unassign diet plan:', error)
                        toast.error('Failed to unassign diet plan')
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
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
            Use the assigned dropdowns above to quickly view which workout and
            diet plans are currently selected for this client.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
