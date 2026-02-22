import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Check, Dumbbell, Trash2, UtensilsCrossed, ArrowLeft } from 'lucide-react'
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

export const Route = createFileRoute('/app/admin/list/pattern/$clientId')({
  component: AdminPatternRoute,
})

function AdminPatternRoute() {
  const { clientId } = Route.useParams()
  const { user } = useAuth()

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

  const assignTrainingPlan = useMutation(
    api.trainingPlans.assignTrainingPlanToUser,
  )
  const unassignTrainingPlan = useMutation(
    api.trainingPlans.unassignTrainingPlanFromUser,
  )
  const assignDietPlan = useMutation(api.dietPlans.assignDietPlanToUser)
  const unassignDietPlan = useMutation(api.dietPlans.unassignDietPlanFromUser)

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

  if (!client) {
    return <div className="p-4">Loading client...</div>
  }

  return (
    <div className="space-y-6 p-4 pb-20 max-w-4xl mx-auto">
      <header className="space-y-3">
        <Link
          to="/app/admin/list/$clientId"
          params={{ clientId }}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to client detail
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Training & Diet Plans</h1>
          <p className="text-sm text-muted-foreground">
            Assign and manage plans for {client.name}
          </p>
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
                toast.success('Workout plan assigned')
              } catch (error) {
                console.error('Failed to assign workout plan:', error)
                toast.error('Failed to assign workout plan')
              }
            }}
          >
            <Check className="w-4 h-4 mr-2" />
            Assign Plan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="w-4 h-4" />
            Currently Assigned Workout
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedTrainingPlan ? (
            <div className="flex items-start justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-sm">{assignedTrainingPlan.name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={async () => {
                  try {
                    await unassignTrainingPlan({ userId: clientId as any })
                    setAssignedTrainingPlanId('')
                    toast.success('Workout plan unassigned')
                  } catch (error) {
                    console.error('Failed to unassign workout plan:', error)
                    toast.error('Failed to unassign workout plan')
                  }
                }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No workout plans assigned
            </p>
          )}
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            Currently Assigned Diet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedDietPlan ? (
            <div className="flex items-start justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-sm">{assignedDietPlan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {assignedDietPlan.description}
                </p>
              </div>
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
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No diet plans assigned
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
