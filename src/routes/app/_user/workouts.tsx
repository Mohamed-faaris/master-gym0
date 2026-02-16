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
  X,
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/auth/useAuth'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'

const EXERCISE_NAMES = [
  'Barbell Bench Press',
  'Incline Dumbbell Press',
  'Decline Bench Press',
  'Dumbbell Fly',
  'Cable Chest Fly',
  'Push-Ups',
  'Dumbbell Pullover',
  'Smith Machine Bench Press',
  'Lat Pulldown',
  'Pull-Ups / Assisted Pull-Ups',
  'Seated Cable Row',
  'Bent-Over Barbell Row',
  'One-Arm Dumbbell Row',
  'T-Bar Row',
  'Deadlift',
  'Straight-Arm Pulldown',
  'Barbell Overhead Press',
  'Dumbbell Lateral Raise',
  'Front Raise',
  'Rear Delt Fly',
  'Arnold Press',
  'Upright Row',
  'Face Pull',
  'Barbell Curl',
  'Dumbbell Curl',
  'Hammer Curl',
  'Preacher Curl',
  'Concentration Curl',
  'Cable Biceps Curl',
  'Cable Triceps Pushdown',
  'Skull Crushers',
  'Overhead Dumbbell Triceps Extension',
  'Bench Dips',
  'Close-Grip Bench Press',
  'Triceps Kickbacks',
  'Barbell Squat',
  'Leg Press',
  'Walking Lunges',
  'Leg Extension',
  'Leg Curl',
  'Romanian Deadlift',
  'Standing Calf Raises',
  'Seated Calf Raises',
  'Bulgarian Split Squat',
  'Hack Squat',
  'Hanging Leg Raises',
  'Cable Crunch',
  'Ab Wheel Rollout',
  'Plank',
  'Russian Twist',
] as const

export const Route = createFileRoute('/app/_user/workouts')({
  component: RouteComponent,
})

function RouteComponent() {
  const today = new Date()
  const { user } = useAuth()
  const isSelfManaged = user?.role === 'selfManagedCustomer'
  const [isAddExerciseDrawerOpen, setIsAddExerciseDrawerOpen] = useState(false)
  const [exerciseName, setExerciseName] = useState('')
  const [setCount, setSetCount] = useState(1)
  const [setReps, setSetReps] = useState([''])
  const [setWeights, setSetWeights] = useState([''])
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

  useEffect(() => {
    setSetReps((previous) => {
      if (previous.length === setCount) return previous
      if (previous.length < setCount) {
        return [...previous, ...Array(setCount - previous.length).fill('')]
      }
      return previous.slice(0, setCount)
    })
  }, [setCount])

  useEffect(() => {
    setSetWeights((previous) => {
      if (previous.length === setCount) return previous
      if (previous.length < setCount) {
        return [...previous, ...Array(setCount - previous.length).fill('')]
      }
      return previous.slice(0, setCount)
    })
  }, [setCount])

  const resetDrawerForm = () => {
    setExerciseName('')
    setSetCount(1)
    setSetReps([''])
    setSetWeights([''])
  }

  const handleAddExercise = async () => {
    if (!user || !isSelfManaged) return

    if (
      !EXERCISE_NAMES.includes(exerciseName as (typeof EXERCISE_NAMES)[number])
    ) {
      toast.error('Select an exercise from the list')
      return
    }

    const repsValues = setReps.map((reps, index) => {
      const parsedReps = Number.parseInt(reps, 10)
      if (Number.isNaN(parsedReps) || parsedReps <= 0) {
        throw new Error(`Set ${index + 1} reps must be a positive number`)
      }
      return parsedReps
    })

    const weightValues = setWeights.map((weight, index) => {
      const trimmedWeight = weight.trim()
      if (!trimmedWeight) return undefined
      const parsedWeight = Number.parseFloat(trimmedWeight)
      if (Number.isNaN(parsedWeight) || parsedWeight < 0) {
        throw new Error(`Set ${index + 1} weight must be a non-negative number`)
      }
      return parsedWeight
    })

    try {
      await addSelfManagedExercise({
        userId: user._id,
        dayOfWeek,
        dayStart: dayStart.getTime(),
        dayEnd: dayEnd.getTime(),
        exerciseName,
        sets: repsValues.map((reps, index) => ({
          reps,
          weight: weightValues[index],
        })),
      })
      toast.success("Exercise added to today's session")
      setIsAddExerciseDrawerOpen(false)
      resetDrawerForm()
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
                                  {set.notes && (
                                    <span className="text-muted-foreground italic">
                                      ({set.notes})
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

      <Drawer
        open={isAddExerciseDrawerOpen}
        onOpenChange={setIsAddExerciseDrawerOpen}
      >
        <DrawerContent className="flex max-h-[85vh] flex-col">
          <DrawerHeader className="shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setIsAddExerciseDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <DrawerTitle>Add Exercise for Today</DrawerTitle>
            <DrawerDescription>
              Add sets and reps to your current day session
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Exercise</label>
              <Input
                list="workouts-exercise-options"
                value={exerciseName}
                onChange={(event) => setExerciseName(event.target.value)}
                placeholder="Search and select exercise"
              />
              <datalist id="workouts-exercise-options">
                {EXERCISE_NAMES.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Sets</label>
              <Input
                type="number"
                min={1}
                value={setCount}
                onChange={(event) =>
                  setSetCount(
                    Math.max(
                      1,
                      Number.parseInt(event.target.value || '1', 10) || 1,
                    ),
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Set Details</p>
              {setReps.map((reps, index) => (
                <div key={index} className="space-y-2 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground font-medium">
                    Set {index + 1}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Reps
                      </label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="e.g. 10"
                        value={reps}
                        onChange={(event) => {
                          const updatedReps = [...setReps]
                          updatedReps[index] = event.target.value
                          setSetReps(updatedReps)
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Weight (kg)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        placeholder="Optional"
                        value={setWeights[index] ?? ''}
                        onChange={(event) => {
                          const updatedWeights = [...setWeights]
                          updatedWeights[index] = event.target.value
                          setSetWeights(updatedWeights)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DrawerFooter className="shrink-0 border-t bg-background">
            <Button onClick={handleAddExercise}>Save Exercise</Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddExerciseDrawerOpen(false)
                resetDrawerForm()
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
