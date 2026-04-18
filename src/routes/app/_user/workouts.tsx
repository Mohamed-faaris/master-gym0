import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Dumbbell,
  Flame,
  Play,
  Sparkles,
} from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '@convex/_generated/api'

import type { Id } from '@convex/_generated/dataModel'
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'

const dayLabels: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

type RoutineCardProps = {
  routine: any
  isToday?: boolean
  primaryAction: ReactNode
  secondaryAction?: ReactNode
  accent?: 'assigned' | 'premade'
}

type WeekPlanCardProps = {
  plan: any
  primaryAction: ReactNode
  accent?: 'saved' | 'premade'
  onView: () => void
}

function WeekPlanCard({
  plan,
  primaryAction,
  accent = 'saved',
  onView,
}: WeekPlanCardProps) {
  return (
    <div className="space-y-3">
      <Card
        role="button"
        tabIndex={0}
        onClick={onView}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onView()
          }
        }}
        className={`cursor-pointer transition-colors hover:border-primary/50 ${
          accent === 'premade' ? 'border-chart-2/30 bg-chart-2/5' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              {plan.goal ? <CardDescription>{plan.goal}</CardDescription> : null}
            </div>
            {accent === 'premade' ? (
              <div className="rounded-full border border-chart-2/30 bg-chart-2/10 px-3 py-1 text-xs font-semibold text-chart-2">
                Premade
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{plan.activeDays.length} active days</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.activeDays.map((day: string) => (
              <span
                key={`${plan._id}-${day}`}
                className="rounded-full border px-2 py-1 text-xs text-muted-foreground"
              >
                {dayLabels[day] || day}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
      <div>{primaryAction}</div>
    </div>
  )
}

function RoutineCard({
  routine,
  isToday = false,
  primaryAction,
  secondaryAction,
  accent = 'assigned',
}: RoutineCardProps) {
  return (
    <Card
      className={
        accent === 'premade'
          ? 'border-chart-2/30 bg-chart-2/5'
          : isToday
            ? 'border-primary/50 bg-primary/5'
            : ''
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-lg">{routine.name}</CardTitle>
            {(routine.dayOfWeek || routine.focus) && (
              <CardDescription className="flex flex-wrap items-center gap-2">
                {routine.dayOfWeek ? (
                  <span className="font-medium text-primary">
                    {dayLabels[routine.dayOfWeek as string]}
                  </span>
                ) : null}
                {routine.dayOfWeek && routine.focus ? <span>•</span> : null}
                {routine.focus ? <span>{routine.focus}</span> : null}
              </CardDescription>
            )}
          </div>
          {isToday ? (
            <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Today
            </div>
          ) : null}
          {accent === 'premade' && !isToday ? (
            <div className="rounded-full border border-chart-2/30 bg-chart-2/10 px-3 py-1 text-xs font-semibold text-chart-2">
              Premade
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Dumbbell className="h-4 w-4" />
          <span>{routine.exercises.length} exercises</span>
        </div>
        <div className="text-sm font-medium">
          {routine.exercises.length > 0
            ? routine.exercises
                .slice(0, 3)
                .map((exercise: any) => exercise.exerciseName)
                .join(', ')
            : 'No exercises added yet'}
          {routine.exercises.length > 3 ? '...' : ''}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">{primaryAction}</div>
          {secondaryAction ? <div className="flex-1">{secondaryAction}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export const Route = createFileRoute('/app/_user/workouts')({
  component: RouteComponent,
})

function RouteComponent() {
  const today = new Date()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isCreateRoutineOpen, setIsCreateRoutineOpen] = useState(false)
  const [newRoutineName, setNewRoutineName] = useState('')
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false)
  const [copyingRoutineId, setCopyingRoutineId] = useState<string | null>(null)

  const createRoutine = useMutation(api.routines.createRoutine)
  const copyRoutineToUser = useMutation(api.routines.copyRoutineToUser)

  const dayOfWeek = (
    ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  )[today.getDay()]
  const dayStart = new Date(today)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(today)
  dayEnd.setHours(23, 59, 59, 999)

  const assignedRoutines = useQuery(
    api.routines.getRoutinesByUser,
    user ? { userId: user._id } : 'skip',
  )
  const premadeRoutines = useQuery(
    api.routines.getPremadeRoutinesForUser,
    user ? { userId: user._id } : 'skip',
  )
  const savedWeekPlans = useQuery(
    api.workoutWeekPlans.getWorkoutWeekPlansByUser,
    user ? { userId: user._id } : 'skip',
  )
  const premadeWeekPlans = useQuery(
    api.workoutWeekPlans.getPremadeWorkoutWeekPlansForUser,
    user ? { userId: user._id } : 'skip',
  )
  const todaySession = useQuery(
    api.workoutSessions.getOngoingSession,
    user ? { userId: user._id } : 'skip',
  )

  const sortedAssignedRoutines = assignedRoutines
    ? [...assignedRoutines].sort((left, right) => {
        const leftPriority = left.dayOfWeek === dayOfWeek ? 0 : 1
        const rightPriority = right.dayOfWeek === dayOfWeek ? 0 : 1
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority
        }

        return (right.updatedAt ?? right.createdAt) - (left.updatedAt ?? left.createdAt)
      })
    : []

  const getWeekPlanStartDay = (plan: { activeDays: string[] }) =>
    plan.activeDays.includes(dayOfWeek) ? dayOfWeek : plan.activeDays[0]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const todayStats = (() => {
    let totalTime = 0
    let totalCalories = 0
    let completedSets = 0

    if (todaySession) {
      totalTime = todaySession.totalTime || 0
      totalCalories = todaySession.totalCaloriesBurned || 0
      completedSets = todaySession.exercises.reduce((sum, exercise) => {
        return sum + exercise.sets.filter((set) => set.completed).length
      }, 0)
    }

    return { totalTime, totalCalories, completedSets }
  })()

  const handleCreateRoutine = async () => {
    if (!user) return
    const trimmedName = newRoutineName.trim()

    if (!trimmedName) {
      toast.error('Routine name is required')
      return
    }

    setIsCreatingRoutine(true)
    try {
      const routineId = await createRoutine({
        name: trimmedName,
        type: 'custom',
        scope: 'single_client',
        authorId: user._id,
        userId: user._id,
        exercises: [],
      })
      setIsCreateRoutineOpen(false)
      setNewRoutineName('')
      navigate({ to: `/app/routines/${routineId}` })
    } catch (error) {
      console.error('Failed to create routine', error)
      toast.error('Failed to create routine')
    } finally {
      setIsCreatingRoutine(false)
    }
  }

  const handleCopyPremade = async (routineId: Id<'routines'>) => {
    if (!user) return

    setCopyingRoutineId(routineId)
    try {
      const newRoutineId = await copyRoutineToUser({
        routineId,
        targetUserId: user._id,
        authorId: user._id,
      })
      toast.success('Routine copied to your saved routines')
      navigate({ to: `/app/routines/${newRoutineId}` })
    } catch (error) {
      console.error('Failed to copy routine', error)
      toast.error('Failed to copy routine')
    } finally {
      setCopyingRoutineId(null)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="sticky top-0 z-10 border-b bg-background/95 p-4 backdrop-blur">
        <div>
          <div>
            <h1 className="text-2xl font-bold">Workouts</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {today.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4">
        {todayStats.totalTime > 0 ? (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Today&apos;s progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-primary/10 bg-background/80 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Total time</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {formatTime(todayStats.totalTime)}
                  </div>
                </div>
                <div className="rounded-xl border border-primary/10 bg-background/80 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Flame className="h-4 w-4" />
                    <span>Calories</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {todayStats.totalCalories}
                  </div>
                </div>
                <div className="rounded-xl border border-primary/10 bg-background/80 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Sets done</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {todayStats.completedSets}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Card className="border-primary/40 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Start a blank session</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Nothing is saved as a routine. This only creates workout logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/app/workout-session"
                search={{
                  routineId: undefined,
                  weekPlanId: undefined,
                  day: undefined,
                }}
                className="block"
              >
                <Button
                  className="h-12 w-full gap-2 bg-background text-foreground hover:bg-background/90"
                >
                  <Play className="h-4 w-4" />
                  Start blank workout
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-chart-2/40 bg-chart-2/5">
            <CardHeader>
              <CardTitle className="text-lg">Build a saved routine</CardTitle>
              <CardDescription>
                Name it first, then add exercises in the editor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="h-12 w-full gap-2"
                onClick={() => setIsCreateRoutineOpen(true)}
              >
                <Sparkles className="h-4 w-4" />
                Create named routine
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Your saved routines</h2>
            <p className="text-sm text-muted-foreground">
              Today&apos;s matching routine is pinned to the top.
            </p>
          </div>

          {!assignedRoutines ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Loading your routines...
              </CardContent>
            </Card>
          ) : sortedAssignedRoutines.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="mx-auto max-w-sm space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Dumbbell className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">No saved routines yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start with a blank session or create a named routine you can reuse later.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedAssignedRoutines.map((routine) => (
                <RoutineCard
                  key={routine._id}
                  routine={routine}
                  isToday={routine.dayOfWeek === dayOfWeek}
                  primaryAction={
                    <Link
                      to="/app/workout-session"
                      search={{
                        routineId: routine._id,
                        weekPlanId: undefined,
                        day: undefined,
                      }}
                      className="block"
                    >
                      <Button className="w-full gap-2">
                        <Play className="h-4 w-4" />
                        Start workout
                      </Button>
                    </Link>
                  }
                  secondaryAction={
                    <Link to="/app/routines/$routineId" params={{ routineId: routine._id }} className="block">
                      <Button variant="outline" className="w-full">
                        Edit routine
                      </Button>
                    </Link>
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Your workout plans</h2>
            <p className="text-sm text-muted-foreground">
              Weekly workout plans saved to your profile.
            </p>
          </div>

          {!savedWeekPlans ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Loading your workout plans...
              </CardContent>
            </Card>
          ) : savedWeekPlans.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No workout plans yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {savedWeekPlans.map((plan) => (
                <WeekPlanCard
                  key={plan._id}
                  plan={plan}
                  onView={() =>
                    navigate({
                      to: '/app/workout-week-plans/$planId',
                      params: { planId: plan._id },
                    })
                  }
                  primaryAction={
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
                        <Play className="h-4 w-4" />
                        Start workout
                      </Button>
                    </Link>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {user?.role === 'trainerManagedCustomer' ? (
          <>
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Premade by trainers</h2>
                <p className="text-sm text-muted-foreground">
                  Start from a premade routine instantly or copy one into your saved list.
                </p>
              </div>

              {!premadeRoutines ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Loading premade routines...
                  </CardContent>
                </Card>
              ) : premadeRoutines.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No premade routines are available for you yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {premadeRoutines.map((routine) => (
                    <RoutineCard
                      key={routine._id}
                      routine={routine}
                      accent="premade"
                      primaryAction={
                        <Link
                          to="/app/workout-session"
                          search={{
                            routineId: routine._id,
                            weekPlanId: undefined,
                            day: undefined,
                          }}
                          className="block"
                        >
                          <Button className="w-full gap-2">
                            <Play className="h-4 w-4" />
                            Start now
                          </Button>
                        </Link>
                      }
                      secondaryAction={
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          disabled={copyingRoutineId === routine._id}
                          onClick={() => handleCopyPremade(routine._id)}
                        >
                          <Copy className="h-4 w-4" />
                          {copyingRoutineId === routine._id ? 'Copying...' : 'Copy & edit'}
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Premade workout plans</h2>
                <p className="text-sm text-muted-foreground">
                  Weekly workout plans from your trainer.
                </p>
              </div>

              {!premadeWeekPlans ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Loading premade workout plans...
                  </CardContent>
                </Card>
              ) : premadeWeekPlans.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No premade workout plans are available for you yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {premadeWeekPlans.map((plan) => (
                    <WeekPlanCard
                      key={plan._id}
                      plan={plan}
                      accent="premade"
                      onView={() =>
                        navigate({
                          to: '/app/workout-week-plans/$planId',
                          params: { planId: plan._id },
                        })
                      }
                      primaryAction={
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
                            <Play className="h-4 w-4" />
                            Start workout
                          </Button>
                        </Link>
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>

      <Drawer open={isCreateRoutineOpen} onOpenChange={setIsCreateRoutineOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create routine</DrawerTitle>
            <DrawerDescription>
              Give this routine a name before opening the editor.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <Input
              autoFocus
              value={newRoutineName}
              onChange={(event) => setNewRoutineName(event.target.value)}
              placeholder="Push day, Upper body, Saturday session..."
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleCreateRoutine()
                }
              }}
            />
          </div>
          <DrawerFooter>
            <Button onClick={() => void handleCreateRoutine()} disabled={isCreatingRoutine}>
              {isCreatingRoutine ? 'Creating...' : 'Create routine'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateRoutineOpen(false)
                setNewRoutineName('')
              }}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
