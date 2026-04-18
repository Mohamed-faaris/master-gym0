import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import type { Id } from '@convex/_generated/dataModel'

import { api } from '@convex/_generated/api'
import { WorkoutWeekPlanEditor } from '@/components/workout-week-plan-editor'

export const Route = createFileRoute(
  '/app/management/clients/$clientId/routines/week-plans/$planId',
)({
  component: ClientWorkoutWeekPlanRoute,
})

function ClientWorkoutWeekPlanRoute() {
  const { clientId, planId } = Route.useParams()
  const navigate = useNavigate()

  const plan = useQuery(api.workoutWeekPlans.getWorkoutWeekPlanById, {
    planId: planId as Id<'workoutWeekPlans'>,
  })
  const updatePlan = useMutation(api.workoutWeekPlans.updateWorkoutWeekPlan)
  const deletePlan = useMutation(api.workoutWeekPlans.deleteWorkoutWeekPlan)

  if (plan === undefined) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  if (plan === null) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Workout week plan not found
      </div>
    )
  }

  return (
    <WorkoutWeekPlanEditor
      heading="Edit Client Week Plan"
      plan={plan as any}
      onBack={() => navigate({ to: `/app/management/clients/${clientId}/logs/workout` })}
      onDelete={async () => {
        if (!confirm('Are you sure you want to delete this week plan?')) return
        try {
          await deletePlan({ planId: planId as Id<'workoutWeekPlans'> })
          toast.success('Week plan deleted')
          navigate({ to: `/app/management/clients/${clientId}/logs/workout` })
        } catch {
          toast.error('Failed to delete week plan')
        }
      }}
      onSave={async (payload) => {
        if (!payload.name.trim()) {
          toast.error('Week plan name is required')
          return
        }
        if (payload.activeDays.length === 0) {
          toast.error('Select at least one active day')
          return
        }
        try {
          await updatePlan({
            planId: planId as Id<'workoutWeekPlans'>,
            name: payload.name,
            goal: payload.goal,
            notes: payload.notes,
            activeDays: payload.activeDays as any,
            dayPlans: payload.dayPlans as any,
          })
          toast.success('Week plan saved')
          navigate({ to: `/app/management/clients/${clientId}/logs/workout` })
        } catch {
          toast.error('Failed to save week plan')
        }
      }}
    />
  )
}
