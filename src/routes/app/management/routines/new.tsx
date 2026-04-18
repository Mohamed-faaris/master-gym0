import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { WorkoutPlanCreateWizard } from '@/components/workout-plan-create-wizard'
import { useAuth } from '@/components/auth/useAuth'

type WorkoutCreateMode = 'routine' | 'weekPlan'

export const Route = createFileRoute('/app/management/routines/new')({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode === 'weekPlan' ? 'weekPlan' : 'routine') as WorkoutCreateMode,
  }),
  component: ManagementWorkoutCreateRoute,
})

function ManagementWorkoutCreateRoute() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const search = Route.useSearch()

  if (!user) {
    return <div className="p-4 text-muted-foreground">Loading...</div>
  }

  return (
    <WorkoutPlanCreateWizard
      mode={search.mode}
      authorId={user._id}
      scope={user.role === 'admin' ? 'all' : 'trainer_clients'}
      onBack={() => navigate({ to: '/app/management/routines' })}
      onCreated={({ kind, id }) =>
        navigate({
          to:
            kind === 'routine'
              ? '/app/management/routines/$routineId'
              : '/app/management/routines/week-plans/$planId',
          params:
            kind === 'routine'
              ? { routineId: id }
              : { planId: id },
        })
      }
    />
  )
}
