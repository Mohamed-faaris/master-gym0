import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { CalendarDays, Dumbbell, Play, Plus } from 'lucide-react'

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
  const today = new Date()

  const routines = useQuery(
    api.routines.getReusableRoutinesByAuthor,
    user ? { authorId: user._id } : 'skip',
  )
  const weekPlans = useQuery(
    api.workoutWeekPlans.getReusableWorkoutWeekPlansByAuthor,
    user ? { authorId: user._id } : 'skip',
  )

  const isAdmin = user?.role === 'admin'
  const currentDayOfWeek = (
    ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  )[today.getDay()]
  const getWeekPlanStartDay = (plan: { activeDays: Array<string> }) =>
    plan.activeDays.includes(currentDayOfWeek) ? currentDayOfWeek : plan.activeDays[0]

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
            <div key={plan._id} className="space-y-3">
              <Card
                role="button"
                tabIndex={0}
                className="cursor-pointer transition-colors hover:border-primary/50"
                onClick={() =>
                  navigate({
                    to: '/app/management/routines/week-plans/$planId',
                    params: { planId: plan._id },
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate({
                      to: '/app/management/routines/week-plans/$planId',
                      params: { planId: plan._id },
                    })
                  }
                }}
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
                        className={`rounded-full border px-2 py-1 text-xs ${
                          day === currentDayOfWeek
                            ? 'border-primary bg-primary/10 font-medium text-primary'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {DAYS_OF_WEEK.find((entry) => entry.value === day)?.label}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Link
                to="/app/workout-session"
                search={{
                  routineId: undefined,
                  weekPlanId: plan._id,
                  day: getWeekPlanStartDay(plan),
                }}
                className="block"
              >
                <Button className="w-full gap-2">
                  <Play className="w-4 h-4" />
                  Start workout
                </Button>
              </Link>
            </div>
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
