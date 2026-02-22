import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from '@convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { CheckCircle2, Clock, Pause, Play, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth/useAuth'
import {
  Checkbox,
  CheckboxIndicator,
} from '@/components/animate-ui/primitives/radix/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'

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

export const Route = createFileRoute('/app/_user/workout-session')({
  component: WorkoutSessionRouteComponent,
})

export function WorkoutSessionRouteComponent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isSelfManaged = user?.role === 'selfManagedCustomer'

  // Convex mutations
  const startSession = useMutation(api.workoutSessions.startSession)
  const updateSession = useMutation(api.workoutSessions.updateSessionProgress)
  const completeSession = useMutation(api.workoutSessions.completeSession)
  const addSelfManagedExercise = useMutation(
    api.workoutSessions.addSelfManagedExerciseToToday,
  )

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

  // Workout session state - track individual sets
  const [isPaused, setIsPaused] = React.useState(false)
  const [completedSets, setCompletedSets] = React.useState<Set<string>>(
    new Set(),
  ) // Format: "exerciseIndex-setNumber"
  const [workoutTime, setWorkoutTime] = React.useState(0) // Total workout time in seconds
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [isAddExerciseDrawerOpen, setIsAddExerciseDrawerOpen] =
    React.useState(false)
  const [exerciseName, setExerciseName] = React.useState('')
  const [setCount, setSetCount] = React.useState(1)
  const [setReps, setSetReps] = React.useState([''])
  const [setWeights, setSetWeights] = React.useState([''])

  // Ref for current exercise card
  const currentExerciseRef = React.useRef<HTMLDivElement>(null)

  // Get today's workout
  const today = new Date()
  const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
    today.getDay()
  ] as 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
  const dayStart = new Date(today)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(today)
  dayEnd.setHours(23, 59, 59, 999)

  const existingSession = useQuery(
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

  const todaysWorkout = useQuery(
    api.trainingPlans.getWorkoutForDay,
    userWithMeta?.trainingPlanId
      ? { trainingPlanId: userWithMeta.trainingPlanId, day: dayOfWeek }
      : 'skip',
  )

  const activeExercises = existingSession?.exercises.length
    ? existingSession.exercises
    : (todaysWorkout?.exercises ?? [])

  React.useEffect(() => {
    if (existingSession) {
      const completed = new Set<string>()
      existingSession.exercises.forEach((exercise, exIndex) => {
        exercise.sets.forEach((set, setIndex) => {
          if (set.completed) {
            completed.add(`${exIndex}-${setIndex}`)
          }
        })
      })
      setSessionId(existingSession._id)
      setWorkoutTime(existingSession.totalTime || 0)
      setCompletedSets(completed)
      if (existingSession.status === 'completed') {
        setIsPaused(true)
      }
    }
  }, [existingSession])

  React.useEffect(() => {
    let timer: NodeJS.Timeout | undefined

    if (sessionId && !isPaused) {
      timer = setInterval(() => {
        setWorkoutTime((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [sessionId, isPaused])

  React.useEffect(() => {
    setSetReps((previous) => {
      if (previous.length === setCount) return previous
      if (previous.length < setCount) {
        return [...previous, ...Array(setCount - previous.length).fill('')]
      }
      return previous.slice(0, setCount)
    })
  }, [setCount])

  React.useEffect(() => {
    setSetWeights((previous) => {
      if (previous.length === setCount) return previous
      if (previous.length < setCount) {
        return [...previous, ...Array(setCount - previous.length).fill('')]
      }
      return previous.slice(0, setCount)
    })
  }, [setCount])

  const buildExercisesData = (
    updatedSets: Set<string>,
    exercises: Array<{
      exerciseName: string
      noOfSets?: number
      sets?: Array<{ reps?: number; weight?: number; restTime?: number }>
    }>,
  ) =>
    exercises.map((ex, idx) => {
      const exerciseSetCount = getSetCount(ex)
      const sets =
        ex.sets && ex.sets.length > 0
          ? ex.sets.map((set, setIdx) => ({
              reps: set.reps,
              weight: set.weight,
              restTime: set.restTime,
              completed: updatedSets.has(`${idx}-${setIdx}`),
            }))
          : Array.from({ length: exerciseSetCount }).map((_, setIdx) => ({
              completed: updatedSets.has(`${idx}-${setIdx}`),
            }))

      return {
        exerciseName: ex.exerciseName,
        noOfSets: ex.noOfSets ?? exerciseSetCount,
        sets,
      }
    })

  const toggleSet = async (exerciseIndex: number, setIndex: number) => {
    if (!sessionId) return

    const key = `${exerciseIndex}-${setIndex}`
    const updatedSets = new Set(completedSets)
    if (updatedSets.has(key)) {
      updatedSets.delete(key)
    } else {
      updatedSets.add(key)
    }

    setCompletedSets(updatedSets)

    try {
      const estimatedCalories = (workoutTime / 60) * 5
      await updateSession({
        sessionId,
        exercises: buildExercisesData(updatedSets, activeExercises),
        totalTime: workoutTime,
        totalCaloriesBurned: Math.round(estimatedCalories),
      })
    } catch (error) {
      console.error(error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartSession = async () => {
    if (!user || !trainingPlan) return

    try {
      const session = await startSession({
        userId: user._id,
        trainingPlanId: trainingPlan._id,
        dayOfWeek,
        dayStart: dayStart.getTime(),
        dayEnd: dayEnd.getTime(),
      })
      setSessionId(session)
      toast.success('Workout session started')
    } catch (error) {
      console.error(error)
      toast.error('Failed to start session')
    }
  }

  const handleCompleteSession = async () => {
    if (!sessionId) return

    try {
      await completeSession({
        sessionId,
        totalTime: workoutTime,
        totalCaloriesBurned: Math.round((workoutTime / 60) * 5),
      })
      toast.success('Workout completed!')
      navigate({ to: '/app' })
    } catch (error) {
      console.error(error)
      toast.error('Failed to complete workout')
    }
  }

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

    if (setCount < 1) {
      toast.error('Set count must be at least 1')
      return
    }

    const repsValues = setReps.map((reps, index) => {
      const parsedReps = Number.parseInt(reps, 10)
      if (Number.isNaN(parsedReps) || parsedReps <= 0) {
        throw new Error(`Set ${index + 1} reps must be a positive number`)
      }
      return parsedReps
    })

    const weightsValues = setWeights.map((weight, index) => {
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
          weight: weightsValues[index],
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

  const getSetCount = (exercise: {
    noOfSets?: number
    sets?: Array<{ reps?: number }>
  }) => {
    const explicitCount = exercise.sets?.length ?? 0
    if (explicitCount > 0) return explicitCount
    return exercise.noOfSets ?? 0
  }

  const getRepsLabel = (exercise: { sets?: Array<{ reps?: number }> }) => {
    const reps = exercise.sets?.[0]?.reps
    return reps ? `${reps} reps` : 'Reps TBD'
  }

  const getSetDetails = (
    exercise: {
      sets?: Array<{ reps?: number; weight?: number; restTime?: number }>
    },
    setIndex: number,
  ) => {
    const setData = exercise.sets?.[setIndex]

    return {
      repsLabel: setData?.reps ? `${setData.reps} reps` : 'Reps TBD',
      weightLabel: setData?.weight ? `${setData.weight} lbs` : 'Weight TBD',
      restTimeLabel: setData?.restTime ? `${setData.restTime}s rest` : '',
    }
  }

  return (
    <div className="p-4 pb-48 space-y-6 max-w-4xl mx-auto">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {todaysWorkout?.name ?? 'Workout Session'}
          </h1>
        </div>
        {isSelfManaged && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsAddExerciseDrawerOpen(true)}
            aria-label="Add workout exercise"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </header>

      <div className="space-y-4">
        {activeExercises.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                No workout scheduled today.
              </p>
            </CardContent>
          </Card>
        )}

        {activeExercises.map((exercise, exerciseIndex) => (
          <Card key={exercise.exerciseName}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">
                  {exercise.exerciseName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {getSetCount(exercise)} sets · {getRepsLabel(exercise)}
                </p>
              </div>

              <div className="space-y-2">
                {Array.from({ length: getSetCount(exercise) }).map(
                  (_, setIndex) => {
                    const key = `${exerciseIndex}-${setIndex}`
                    const isCompleted = completedSets.has(key)
                    const { repsLabel, weightLabel, restTimeLabel } =
                      getSetDetails(exercise, setIndex)
                    return (
                      <Card
                        key={key}
                        ref={
                          exerciseIndex === 0 && setIndex === 0
                            ? currentExerciseRef
                            : undefined
                        }
                        className={`transition-all ${
                          isCompleted
                            ? 'border-green-500 bg-green-500/5'
                            : 'border-border'
                        } cursor-pointer`}
                        onClick={() => toggleSet(exerciseIndex, setIndex)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center flex-shrink-0">
                              <Checkbox
                                checked={isCompleted}
                                onCheckedChange={() =>
                                  toggleSet(exerciseIndex, setIndex)
                                }
                                aria-label={`Mark set ${setIndex + 1}`}
                                onClick={(event) => event.stopPropagation()}
                                className="size-5 flex justify-center items-center border [&[data-state=checked],&[data-state=indeterminate]]:bg-primary [&[data-state=checked],&[data-state=indeterminate]]:text-primary-foreground transition-colors duration-500"
                              >
                                <CheckboxIndicator className="size-3.5" />
                              </Checkbox>
                            </div>
                            <div className="flex-1">
                              <div
                                className={`font-semibold ${
                                  isCompleted
                                    ? 'line-through text-muted-foreground'
                                    : ''
                                }`}
                              >
                                Set {setIndex + 1}
                              </div>
                              <div
                                className={`text-sm text-muted-foreground ${
                                  isCompleted ? 'line-through' : ''
                                }`}
                              >
                                {repsLabel} · {weightLabel}
                              </div>
                              <div
                                className={`text-xs text-muted-foreground mt-1 ${
                                  isCompleted ? 'line-through' : ''
                                }`}
                              >
                                {restTimeLabel}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  },
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        className="fixed inset-x-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90"
        style={{ bottom: 'calc(4rem + var(--safe-bottom))' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {formatTime(workoutTime)} elapsed
          </div>

          <div className="flex items-center gap-2">
            {!sessionId && trainingPlan ? (
              <Button onClick={handleStartSession} className="gap-2">
                <Play className="w-4 h-4" />
                Start Session
              </Button>
            ) : (
              sessionId && (
                <>
                  <Button
                    onClick={() => setIsPaused((prev) => !prev)}
                    variant="outline"
                    className="gap-2"
                  >
                    {isPaused ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    onClick={handleCompleteSession}
                    className="gap-2"
                    variant="default"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </div>

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
                list="exercise-options"
                value={exerciseName}
                onChange={(event) => setExerciseName(event.target.value)}
                placeholder="Search and select exercise"
              />
              <datalist id="exercise-options">
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
