import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Dumbbell, UtensilsCrossed } from 'lucide-react'
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

export const Route = createFileRoute(
  '/app/management/clients/pattern',
)({
  component: PatternRoute,
})

function PatternRoute() {
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  const client = useQuery(
    api.users.getUserById,
    clientId ? { userId: clientId } : 'skip',
  )

  const trainingPlans = useQuery(api.trainingPlans.getAllTrainingPlans)
  const dietPlans = useQuery(
    api.dietPlans.getDietPlansByUser,
    user ? { userId: user._id } : 'skip',
  )

  const assignTrainingPlan = useMutation(
    api.trainingPlans.assignTrainingPlanToUser,
  )

  const [selectedTrainingPlan, setSelectedTrainingPlan] = useState('')

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
    <div className="space-y-6 p-4 pb-20 max-w-3xl mx-auto">
      <header className="space-y-3">
        <Link
          to={`/app/management/clients/${clientId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to client detail
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Pattern</h1>
          <p className="text-sm text-muted-foreground">
            Assign and review workout + diet plans for {client.name}.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="w-4 h-4" />
              Assign Workout
            </CardTitle>
            <CardDescription>
              Choose a training plan to attach to this client.
            </CardDescription>
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
            <CardDescription>
              View current templates before sharing guidance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
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
    </div>
  )
}
