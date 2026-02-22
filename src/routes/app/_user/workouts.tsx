import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Dumbbell,
  Flame,
  Plus,
} from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '@convex/_generated/api'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/useAuth'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import {
  AddExerciseDrawer,
  type ExerciseData,
} from '@/components/add-exercise-drawer'

export const Route = createFileRoute('/app/_user/workouts')({
  component: RouteComponent,
})

function RouteComponent() {
  const today = new Date()
  const { user } = useAuth()
  const isSelfManaged = user?.role === 'selfManagedCustomer'
  const [isAddExerciseDrawerOpen, setIsAddExerciseDrawerOpen] = useState(false)
  const addSelfManagedExercise = useMutation(
    api.workoutSessions.addSelfManagedExerciseToToday,
  )

  // Fetch user's assigned training plan
  const userWithMeta = useQuery(
    api.users.getUserWithMeta,
    user ? { userId: user._id } : 'skip',
  )

  const trainingPlan = useQuery(
    api.trainingPlans.getTrainingPlanById,
    userWithMeta?.trainingPlanId
      ? { trainingPlanId: userWithMeta.trainingPlanId }
      : 'skip',
  )

  const dayOfWeek = (
    ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  )[today.getDay()]
  const dayStart = new Date(today)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(today)
  dayEnd.setHours(23, 59, 59, 999)

  const todaysSession = useQuery(
    api.workoutSessions.getLatestSessionForDay,
    user
      ? {
          userId: user._id,
          dayOfWeek,
          dayStart: dayStart.getTime(),
          dayEnd: dayEnd.getTime(),
        }
      : 'skip',
  )

  // Fetch today's ongoing session for stats
  const todaySession = useQuery(
    api.workoutSessions.getOngoingSession,
    user ? { userId: user._id } : 'skip',
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTodayStats = () => {
    let totalTime = 0
    let totalCalories = 0
    let completedSets = 0

    if (todaySession) {
      totalTime = todaySession.totalTime || 0
      totalCalories = todaySession.totalCaloriesBurned || 0
      completedSets = todaySession.exercises.reduce((sum, ex) => {
        return sum + ex.sets.filter((s) => s.completed).length
      }, 0)
    }

    return { totalTime, totalCalories, completedSets }
  }

  const todayStats = getTodayStats()

  const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  const dayLabels: Record<(typeof dayOrder)[number], string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  }

  const todayKey = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[
    today.getDay()
  ]

  const sortedDays = useMemo(() => {
    if (!trainingPlan) return []
    const orderIndex = new Map(dayOrder.map((day, index) => [day, index]))
    return [...trainingPlan.days].sort((a, b) => {
      return (orderIndex.get(a.day) ?? 0) - (orderIndex.get(b.day) ?? 0)
    })
  }, [trainingPlan, dayOrder])

  const availableDays = useMemo(
    () => sortedDays.map((day) => day.day),
    [sortedDays],
  )
  const availableDaySet = useMemo(() => new Set(availableDays), [availableDays])
  const [activeDay, setActiveDay] = useState<string | undefined>(todayKey)

  useEffect(() => {
    if (!availableDays.length) return
    setActiveDay((prev) => {
      if (prev && availableDaySet.has(prev)) return prev
      if (availableDaySet.has(todayKey)) return todayKey
      return availableDays[0]
    })
  }, [availableDays, availableDaySet, todayKey])

  const handleAddExercise = async (data: ExerciseData) => {
    if (!user || !isSelfManaged) return

    try {
      await addSelfManagedExercise({
        userId: user._id,
        dayOfWeek,
        dayStart: dayStart.getTime(),
        dayEnd: dayEnd.getTime(),
        exerciseName: data.exerciseName,
        sets: data.sets,
      })
      toast.success("Exercise added to today's session")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to add exercise')
      }
    }
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header with date and day */}
      <div className="sticky top-0 z-10 bg-background p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workouts</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>
                {today.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
          {isSelfManaged && !trainingPlan && (
            <Button
              variant="outline"
              size="icon"
              aria-label="Add workout exercise"
              onClick={() => setIsAddExerciseDrawerOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {!user && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Please sign in to view workouts
            </p>
          </div>
        )}

        {user && (
          <>
            {/* Today's Stats Card */}
            {todayStats.totalTime > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Today's Workout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Total Time</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {formatTime(todayStats.totalTime)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Flame className="h-4 w-4" />
                        <span className="text-xs">Calories</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {todayStats.totalCalories}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">Sets Done</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {todayStats.completedSets}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {user && !trainingPlan && !isSelfManaged && (
          <Card>
            <CardHeader>
              <CardTitle>No Training Program Assigned</CardTitle>
              <CardDescription>
                Contact your trainer to get a workout program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <ClipboardList className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">No Program Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Your trainer will assign you a personalized training
                    program.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user && !trainingPlan && isSelfManaged && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Session</CardTitle>
              <CardDescription>
                Add and track today&apos;s self-managed exercises
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysSession?.exercises.length ? (
                todaysSession.exercises.map((exercise, exIndex) => (
                  <div
                    key={exIndex}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <h4 className="font-medium">{exercise.exerciseName}</h4>
                    <div className="text-sm text-muted-foreground">
                      {exercise.noOfSets} sets
                    </div>
                    <div className="space-y-1">
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className="text-sm flex items-center gap-2"
                        >
                          <span className="text-muted-foreground">
                            Set {setIndex + 1}:
                          </span>
                          <span>{set.reps} reps</span>
                          {set.weight !== undefined && (
                            <span>@ {set.weight}kg</span>
                          )}
                          <span
                            className={
                              set.completed
                                ? 'text-green-600 text-xs'
                                : 'text-muted-foreground text-xs'
                            }
                          >
                            {set.completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No exercises added for today yet. Use the + button to add one.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {trainingPlan && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{trainingPlan.name}</CardTitle>
                <CardDescription>{trainingPlan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{trainingPlan.durationWeeks} weeks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    <span>{trainingPlan.days.length} workout days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeDay} onValueChange={setActiveDay}>
              <TabsList className="grid w-full grid-cols-7">
                {dayOrder.map((dayKey) => {
                  const isAvailable = availableDaySet.has(dayKey)
                  return (
                    <TabsTrigger
                      key={dayKey}
                      value={dayKey}
                      disabled={!isAvailable}
                      className="text-xs uppercase"
                    >
                      {dayLabels[dayKey]}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <TabsContents className="space-y-4">
                {sortedDays.map((day) => (
                  <TabsContent key={day.day} value={day.day}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg capitalize">
                          {day.day}
                        </CardTitle>
                        <CardDescription>
                          {day.exercises.length} exercises
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {day.exercises.map((exercise, exIndex) => (
                          <div
                            key={exIndex}
                            className="border rounded-lg p-4 space-y-2"
                          >
                            <h4 className="font-medium">
                              {exercise.exerciseName}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              {exercise.noOfSets} sets
                            </div>
                            <div className="space-y-1">
                              {exercise.sets.map((set, setIndex) => (
                                <div
                                  key={setIndex}
                                  className="text-sm flex items-center gap-2"
                                >
                                  <span className="text-muted-foreground">
                                    Set {setIndex + 1}:
                                  </span>
                                  <span>{set.reps} reps</span>
                                  {set.weight && <span>@ {set.weight}kg</span>}
                                  {set.restTime && (
                                    <span className="text-muted-foreground">
                                      ({set.restTime}s rest)
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </TabsContents>
            </Tabs>
          </>
        )}
      </div>

      {user && (
        <Link
          to="/app/workout-session"
          className="fixed left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-screen-sm"
          style={{ bottom: 'calc(5rem + var(--safe-bottom))' }}
        >
          <Button className="h-14 w-full rounded-full shadow-lg">
            <Dumbbell className="w-5 h-5 mr-2" />
            Start Workout
          </Button>
        </Link>
      )}

      <AddExerciseDrawer
        open={isAddExerciseDrawerOpen}
        onOpenChange={setIsAddExerciseDrawerOpen}
        onSave={handleAddExercise}
      />
    </div>
  )
}
