import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import type { Id } from '@convex/_generated/dataModel'

import { api } from '@convex/_generated/api'
import { WorkoutWeekPlanView } from '@/components/workout-week-plan-view'

export const Route = createFileRoute('/app/_user/workout-week-plans/$planId')({
  component: UserWorkoutWeekPlanRoute,
})

function UserWorkoutWeekPlanRoute() {
  const { planId } = Route.useParams()

  const plan = useQuery(api.workoutWeekPlans.getWorkoutWeekPlanById, {
    planId: planId as Id<'workoutWeekPlans'>,
  })

  if (plan === undefined) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  if (plan === null) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Workout plan not found
      </div>
    )
  }

  return (
    <WorkoutWeekPlanView
      title="Workout Plan"
      backLabel="Back to workouts"
      backTo="/app/workouts"
      plan={plan as any}
    />
  )
}
