import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { WorkoutPlanCreateWizard } from '@/components/workout-plan-create-wizard'
import { useAuth } from '@/components/auth/useAuth'

type WorkoutCreateMode = 'routine' | 'weekPlan'

export const Route = createFileRoute(
  '/app/management/clients/$clientId/routines/new',
)({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode === 'weekPlan' ? 'weekPlan' : 'routine') as WorkoutCreateMode,
  }),
  component: ClientWorkoutCreateRoute,
})

function ClientWorkoutCreateRoute() {
  const { clientId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { user } = useAuth()

  if (!user) {
    return <div className="p-4 text-muted-foreground">Loading...</div>
  }

  return (
    <WorkoutPlanCreateWizard
      mode={search.mode}
      authorId={user._id}
      userId={clientId}
      scope="single_client"
      onBack={() =>
        navigate({ to: '/app/management/clients/$clientId/logs/workout', params: { clientId } })
      }
      onCreated={({ kind, id }) =>
        navigate({
          to:
            kind === 'routine'
              ? '/app/management/clients/$clientId/routines/$routineId'
              : '/app/management/clients/$clientId/routines/week-plans/$planId',
          params:
            kind === 'routine'
              ? { clientId, routineId: id }
              : { clientId, planId: id },
        })
      }
    />
  )
}
