import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { Play, Pause, CheckCircle2, X, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { toast } from 'sonner'
import {
  Checkbox,
  CheckboxIndicator,
} from '@/components/animate-ui/primitives/radix/checkbox'

export const Route = createFileRoute('/app/_user/workout-session')({
  component: WorkoutSessionRouteComponent,
})

export function WorkoutSessionRouteComponent() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Convex mutations
  const startSession = useMutation(api.workoutSessions.startSession)
  const updateSession = useMutation(api.workoutSessions.updateSessionProgress)
  const completeSession = useMutation(api.workoutSessions.completeSession)
  const cancelSession = useMutation(api.workoutSessions.cancelSession)

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

  React.useEffect(() => {
    if (existingSession) {
      setSessionId(existingSession._id)
      setWorkoutTime(existingSession.totalTime || 0)
      setCompletedSets(new Set(existingSession.completedSets || []))
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

  const buildExercisesData = (
    updatedSets: Set<string>,
    exercises: Array<{
      exerciseName: string
      noOfSets?: number
      sets?: Array<{ reps?: number; weight?: number; notes?: string }>
    }>,
  ) =>
    exercises.map((ex, idx) => {
      const setCount = getSetCount(ex)
      const sets =
        ex.sets && ex.sets.length > 0
          ? ex.sets.map((set, setIdx) => ({
              reps: set.reps,
              weight: set.weight,
              notes: set.notes,
              completed: updatedSets.has(`${idx}-${setIdx + 1}`),
            }))
          : Array.from({ length: setCount }).map((_, setIdx) => ({
              completed: updatedSets.has(`${idx}-${setIdx + 1}`),
            }))

      return {
        exerciseName: ex.exerciseName,
        noOfSets: ex.noOfSets ?? setCount,
        sets,
      }
    })

  const toggleSet = async (exerciseIndex: number, setIndex: number) => {
    if (!sessionId || !todaysWorkout) return

    const key = `${exerciseIndex}-${setIndex + 1}`
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
        exercises: buildExercisesData(updatedSets, todaysWorkout.exercises),
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
      })
      setSessionId(session)
      toast.success('Workout session started')
    } catch (error) {
      console.error(error)
      toast.error('Failed to start session')
    }
  }

  const handleToggleSet = async (exerciseIndex: number, setNumber: number) => {
    await toggleSet(exerciseIndex, setNumber - 1)
  }

  const handleCompleteSession = async () => {
    if (!sessionId) return

    try {
      await completeSession({
        sessionId,
        totalTime: workoutTime,
        completedSets: Array.from(completedSets),
      })
      toast.success('Workout completed!')
      navigate({ to: '/app' })
    } catch (error) {
      console.error(error)
      toast.error('Failed to complete workout')
    }
  }

  const handleCancelSession = async () => {
    if (!sessionId) return

    try {
      await cancelSession({ sessionId })
      toast.success('Workout session canceled')
      navigate({ to: '/app' })
    } catch (error) {
      console.error(error)
      toast.error('Failed to cancel workout')
    }
  }

  if (!todaysWorkout) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No workout scheduled today.</p>
          </CardContent>
        </Card>
      </div>
    )
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

  return (
    <div className="p-4 pb-20 space-y-6 max-w-4xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{todaysWorkout.name}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {formatTime(workoutTime)} elapsed
        </div>
      </header>

      <div className="flex items-center gap-3">
        {!sessionId ? (
          <Button onClick={handleStartSession} className="gap-2">
            <Play className="w-4 h-4" />
            Start Session
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setIsPaused((prev) => !prev)}
              variant="outline"
              className="gap-2"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
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
            <Button
              onClick={handleCancelSession}
              className="gap-2"
              variant="destructive"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </>
        )}
      </div>

      <div className="space-y-4">
        {todaysWorkout.exercises.map((exercise, exerciseIndex) => (
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
                  const key = `${exerciseIndex}-${setIndex + 1}`
                  const isCompleted = completedSets.has(key)
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
                                isCompleted ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              Set {setIndex + 1}
                            </div>
                            <div
                              className={`text-sm text-muted-foreground ${
                                isCompleted ? 'line-through' : ''
                              }`}
                            >
                              {getRepsLabel(exercise)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
