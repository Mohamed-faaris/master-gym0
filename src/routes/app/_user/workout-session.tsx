
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { Play, Pause, CheckCircle2, X, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { toast } from 'sonner'

export const Route = createFileRoute('/app/_user/workout-session')({
  component: RouteComponent,
})

function RouteComponent() {
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
  const todaysWorkout = trainingPlan?.days.find((day) => day.day === dayOfWeek)

  const getSetCount = (exercise: {
    noOfSets: number
    sets: Array<{
      reps?: number
      weight?: number
      notes?: string
    }>
  }) => (exercise.sets.length > 0 ? exercise.sets.length : exercise.noOfSets)

  const activeExercises = existingSession?.exercises ?? todaysWorkout?.exercises ?? []

  const hydrateFromSession = React.useCallback(() => {
    if (!existingSession) return
    const completed = new Set<string>()
    existingSession.exercises.forEach((exercise, exIndex) => {
      exercise.sets.forEach((set, setIndex) => {
        if (set.completed) {
          completed.add(`${exIndex}-${setIndex}`)
        }
      })
    })
    setCompletedSets(completed)
    setSessionId(existingSession._id)
    setWorkoutTime(existingSession.totalTime || 0)
  }, [existingSession])

  // Calculate total sets and current set index
  const calculateSetInfo = () => {
    let totalSets = 0
    let currentSetIndex = 0
    for (let i = 0; i < activeExercises.length; i++) {
      const setCount = getSetCount(activeExercises[i])
      for (let j = 0; j < setCount; j++) {
        const setKey = `${i}-${j}`
        if (!completedSets.has(setKey)) {
          currentSetIndex = totalSets
          return { totalSets, currentSetIndex }
        }
        totalSets++
      }
    }
    return { totalSets, currentSetIndex }
  }

  const { totalSets, currentSetIndex } = calculateSetInfo()

  React.useEffect(() => {
    hydrateFromSession()
  }, [hydrateFromSession])

  // Initialize session on component mount
  React.useEffect(() => {
    if (
      user &&
      todaysWorkout &&
      !sessionId &&
      userWithMeta?.trainingPlanId &&
      !existingSession
    ) {
      const initSession = async () => {
        try {
          const id = await startSession({
            userId: user._id,
            trainingPlanId: userWithMeta.trainingPlanId,
            dayOfWeek,
            dayStart: dayStart.getTime(),
            dayEnd: dayEnd.getTime(),
          })
          setSessionId(id)
        } catch (error) {
          toast.error('Failed to start workout session')
          console.error(error)
        }
      }
      initSession()
    }
  }, [
    user,
    todaysWorkout,
    sessionId,
    startSession,
    dayOfWeek,
    userWithMeta,
    existingSession,
    dayStart,
    dayEnd,
  ])

  // Timer effect for total workout time
  React.useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setWorkoutTime((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isPaused])

  // Update session progress every 10 seconds
  React.useEffect(() => {
    if (!sessionId || activeExercises.length === 0) return

    const updateInterval = setInterval(async () => {
      try {
        const exercises = activeExercises.map((ex, idx) => {
          const setCount = getSetCount(ex)
          const sets =
            ex.sets.length > 0
              ? ex.sets.map((set, setIdx) => ({
                  reps: set.reps,
                  weight: set.weight,
                  notes: set.notes,
                  completed: completedSets.has(`${idx}-${setIdx}`),
                }))
              : Array.from({ length: setCount }).map((_, setIdx) => ({
                  completed: completedSets.has(`${idx}-${setIdx}`),
                }))

          return {
            exerciseName: ex.exerciseName,
            noOfSets: ex.noOfSets,
            sets,
          }
        })

        // Simple calorie estimation: ~5 calories per minute per exercise
        const estimatedCalories = (workoutTime / 60) * 5

        await updateSession({
          sessionId,
          exercises,
          totalTime: workoutTime,
          totalCaloriesBurned: Math.round(estimatedCalories),
        })
      } catch (error) {
        console.error('Failed to update session:', error)
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(updateInterval)
  }, [
    sessionId,
    completedSets,
    workoutTime,
    activeExercises,
    updateSession,
  ])

  // Redirect if no workout
  React.useEffect(() => {
    if (!todaysWorkout || todaysWorkout.exercises.length === 0) {
      navigate({ to: '/app/workouts' })
    }
  }, [todaysWorkout, navigate])

  // Auto-scroll to current set when it changes
  React.useEffect(() => {
    if (
      currentExerciseRef.current &&
      document.body.contains(currentExerciseRef.current)
    ) {
      try {
        currentExerciseRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      } catch (error) {
        // Silently handle scroll errors
        console.debug('Scroll error:', error)
      }
    }
  }, [completedSets])

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const endWorkout = async () => {
    if (sessionId) {
      try {
        // Simple calorie estimation
        const estimatedCalories = (workoutTime / 60) * 5
        await completeSession({
          sessionId,
          totalTime: workoutTime,
          totalCaloriesBurned: Math.round(estimatedCalories),
        })
        toast.success('Workout completed!')
      } catch (error) {
        toast.error('Failed to save workout')
        console.error(error)
      }
    }
    navigate({ to: '/app/workouts' })
  }

  const cancelWorkout = async () => {
    if (sessionId) {
      try {
        await cancelSession({ sessionId })
        toast.success('Workout cancelled')
      } catch (error) {
        toast.error('Failed to cancel workout')
        console.error(error)
      }
    }
    navigate({ to: '/app/workouts' })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!todaysWorkout) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-48">
      {/* Simple Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {trainingPlan?.name || 'Workout Session'}
            </h2>
            <div className="text-sm text-muted-foreground">
              {completedSets.size} / {totalSets} sets completed
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={cancelWorkout}>
            <X className="w-4 h-4 mr-2" />
            End
          </Button>
        </div>
      </div>

      {/* Exercise List - Grouped by Exercise with Individual Sets */}
      <div className="p-4 space-y-6">
        {/* Empty space to allow first items to scroll above timer */}
        <div className="h-[50vh]" />

        {activeExercises.map((exercise, exerciseIndex) => {
          const exerciseCompletedSets = Array.from(completedSets).filter(
            (key) => key.startsWith(`${exerciseIndex}-`),
          ).length
          const setCount = getSetCount(exercise)

          return (
            <div key={exerciseIndex} className="space-y-2">
              {/* Exercise Group Header */}
              <div className="px-2 py-1">
                <h3 className="font-bold text-lg">
                  {exercise.exerciseName}
                </h3>
                <div className="text-xs text-muted-foreground">
                  {exerciseCompletedSets} / {setCount} sets
                </div>
              </div>

              {/* Individual Sets */}
              <div className="space-y-2">
                {Array.from({ length: setCount }).map((_, setIndex) => {
                  const setKey = `${exerciseIndex}-${setIndex}`
                  const isCompleted = completedSets.has(setKey)
                  const isCurrent =
                    completedSets.size === currentSetIndex && !isCompleted

                  // Get the specific set data from the exercise
                  const setData =
                    exercise.sets && exercise.sets.length > 0
                      ? exercise.sets[setIndex]
                      : null

                  return (
                    <Card
                      key={setKey}
                      ref={isCurrent ? currentExerciseRef : null}
                      className={`transition-all ${
                        isCurrent
                          ? 'border-primary shadow-lg scale-[1.01]'
                          : isCompleted
                            ? 'border-green-500 bg-green-500/5'
                            : 'border-border'
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                                isCompleted
                                  ? 'bg-green-500 text-white'
                                  : isCurrent
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                setIndex + 1
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">
                                Set {setIndex + 1}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {setData?.reps && `${setData.reps} reps`}
                                {setData?.weight && ` • ${setData.weight} lbs`}
                              </div>
                              {setData?.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {setData.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          {isCurrent && (
                            <div className="flex gap-2">
                              {exerciseIndex ===
                                activeExercises.length - 1 &&
                              setIndex === setCount - 1 ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const newCompleted = new Set(completedSets)
                                    newCompleted.add(setKey)
                                    setCompletedSets(newCompleted)
                                    if (sessionId) {
                                      updateSession({
                                        sessionId,
                                        exercises: activeExercises.map((ex, idx) => {
                                          const setTotal = getSetCount(ex)
                                          const sets =
                                            ex.sets.length > 0
                                              ? ex.sets.map((set, setIdx) => ({
                                                  reps: set.reps,
                                                  weight: set.weight,
                                                  notes: set.notes,
                                                  completed: newCompleted.has(
                                                    `${idx}-${setIdx}`,
                                                  ),
                                                }))
                                              : Array.from({ length: setTotal }).map(
                                                  (_, setIdx) => ({
                                                    completed: newCompleted.has(
                                                      `${idx}-${setIdx}`,
                                                    ),
                                                  }),
                                                )

                                          return {
                                            exerciseName: ex.exerciseName,
                                            noOfSets: ex.noOfSets,
                                            sets,
                                          }
                                        }),
                                        totalTime: workoutTime,
                                        totalCaloriesBurned: Math.round(
                                          (workoutTime / 60) * 5,
                                        ),
                                      })
                                    }
                                    endWorkout()
                                  }}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  End
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const newCompleted = new Set(completedSets)
                                    newCompleted.add(setKey)
                                    setCompletedSets(newCompleted)
                                    if (sessionId) {
                                      updateSession({
                                        sessionId,
                                        exercises: activeExercises.map((ex, idx) => {
                                          const setTotal = getSetCount(ex)
                                          const sets =
                                            ex.sets.length > 0
                                              ? ex.sets.map((set, setIdx) => ({
                                                  reps: set.reps,
                                                  weight: set.weight,
                                                  notes: set.notes,
                                                  completed: newCompleted.has(
                                                    `${idx}-${setIdx}`,
                                                  ),
                                                }))
                                              : Array.from({ length: setTotal }).map(
                                                  (_, setIdx) => ({
                                                    completed: newCompleted.has(
                                                      `${idx}-${setIdx}`,
                                                    ),
                                                  }),
                                                )

                                          return {
                                            exerciseName: ex.exerciseName,
                                            noOfSets: ex.noOfSets,
                                            sets,
                                          }
                                        }),
                                        totalTime: workoutTime,
                                        totalCaloriesBurned: Math.round(
                                          (workoutTime / 60) * 5,
                                        ),
                                      })
                                    }
                                  }}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Done
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Fixed Bottom Timer Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t shadow-lg z-20">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              <div>
                <div className="text-3xl font-bold tabular-nums">
                  {formatTime(workoutTime)}
                </div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
            </div>
            <Button
              variant={isPaused ? 'default' : 'secondary'}
              size="lg"
              onClick={togglePause}
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
