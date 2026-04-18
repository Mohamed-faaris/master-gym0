import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { CalendarDays, Dumbbell, Plus } from 'lucide-react'

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
import { DAYS_OF_WEEK } from '@/lib/workout-plan-helpers'

export const Route = createFileRoute('/app/management/routines/')({
  component: ManagementRoutinesIndexComponent,
})

function ManagementRoutinesIndexComponent() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const routines = useQuery(
    api.routines.getReusableRoutinesByAuthor,
    user ? { authorId: user._id } : 'skip',
  )
  const weekPlans = useQuery(
    api.workoutWeekPlans.getReusableWorkoutWeekPlansByAuthor,
    user ? { authorId: user._id } : 'skip',
  )

  const isAdmin = user?.role === 'admin'

  return (
    <div className="p-4 space-y-6 pb-24 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdmin ? 'Global Workout Library' : 'Workout Library'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin
              ? 'Manage reusable routines and week plans across app.'
              : 'Manage reusable routines and week plans for your clients.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              navigate({
                to: '/app/management/routines/new',
                search: { mode: 'routine' },
              })
            }
          >
            <Plus className="w-4 h-4" /> New Routine
          </Button>
          <Button
            className="gap-2"
            onClick={() =>
              navigate({
                to: '/app/management/routines/new',
                search: { mode: 'weekPlan' },
              })
            }
          >
            <Plus className="w-4 h-4" /> New Week Plan
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Reusable Routines</h2>
          <p className="text-sm text-muted-foreground">
            Single workout templates for fast reuse.
          </p>
        </div>

        {routines?.length ? (
          routines.map((routine) => (
            <Card
              key={routine._id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() =>
                navigate({
                  to: '/app/management/routines/$routineId',
                  params: { routineId: routine._id },
                })
              }
            >
              <CardHeader className="pb-2">
                <CardTitle>{routine.name}</CardTitle>
                {(routine.focus || routine.dayOfWeek) && (
                  <CardDescription className="flex items-center gap-2">
                    {routine.dayOfWeek && (
                      <span className="font-medium text-primary">
                        {
                          DAYS_OF_WEEK.find((day) => day.value === routine.dayOfWeek)
                            ?.label
                        }
                      </span>
                    )}
                    {routine.dayOfWeek && routine.focus && <span>•</span>}
                    {routine.focus && <span>{routine.focus}</span>}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  <span>{routine.exercises.length} exercises total</span>
                </div>
                <div className="text-sm font-medium">
                  {routine.exercises
                    .slice(0, 3)
                    .map((exercise) => exercise.exerciseName)
                    .join(', ') || 'No exercises yet'}
                  {routine.exercises.length > 3 && '...'}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/10 text-muted-foreground">
            No reusable routines yet.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Workout Week Plans</h2>
          <p className="text-sm text-muted-foreground">
            Multi-day weekly workout structures.
          </p>
        </div>

        {weekPlans?.length ? (
          weekPlans.map((plan) => (
            <Card
              key={plan._id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() =>
                navigate({
                  to: '/app/management/routines/week-plans/$planId',
                  params: { planId: plan._id },
                })
              }
            >
              <CardHeader className="pb-2">
                <CardTitle>{plan.name}</CardTitle>
                {plan.goal && <CardDescription>{plan.goal}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>{plan.activeDays.length} active days</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.activeDays.map((day) => (
                    <span
                      key={day}
                      className="rounded-full border px-2 py-1 text-xs text-muted-foreground"
                    >
                      {DAYS_OF_WEEK.find((entry) => entry.value === day)?.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/10 text-muted-foreground">
            No week plans yet.
          </div>
        )}
      </section>
    </div>
  )
}
