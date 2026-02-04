import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Play, Pause, CheckCircle2, X, Clock, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { toast } from 'sonner'

export const Route = createFileRoute('/app/management/clients/$clientId/workout-session')({
  component: TrainerWorkoutSessionRoute,
})

function TrainerWorkoutSessionRoute() {
  const navigate = useNavigate()
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()

  // Convex mutations
  const startSession = useMutation(api.workoutSessions.startSession)
  const updateSession = useMutation(api.workoutSessions.updateSessionProgress)
  const completeSession = useMutation(api.workoutSessions.completeSession)
  const cancelSession = useMutation(api.workoutSessions.cancelSession)

  // Fetch client
  const client = useQuery(
    api.users.getUserById,
    clientId ? { userId: clientId } : 'skip',
  )

  // Workout session state - track individual sets
  const [isPaused, setIsPaused] = React.useState(false)
  const [completedSets, setCompletedSets] = React.useState<Set<string>>(new Set())
  const [workoutTime, setWorkoutTime] = React.useState(0)
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [exercises, setExercises] = React.useState<Array<{
    name: string
    sets: number
    reps: number
    weight: number
    notes: string
  }>>([
    { name: 'Bench Press', sets: 3, reps: 8, weight: 225, notes: '' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 70, notes: '' },
    { name: 'Cable Flyes', sets: 3, reps: 12, weight: 100, notes: '' },
  ])
  const [workoutTitle, setWorkoutTitle] = React.useState('Chest Day')
  const [workoutFocus, setWorkoutFocus] = React.useState('Chest & Shoulders')
  const [isSessionStarted, setIsSessionStarted] = React.useState(false)

  const currentExerciseRef = React.useRef<HTMLDivElement>(null)

  const privilegedRoles = new Set(['trainer', 'admin'])

  // Auth check
  React.useEffect(() => {
    if (isLoading) return
    if (!user || !privilegedRoles.has(user.role)) {
      navigate({ to: '/' })
    }
  }, [user, isLoading, navigate])

  // Calculate total sets
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)

  // Initialize session
  const startWorkout = async () => {
    if (!user || !clientId) return

    try {
      const exercisesData = exercises.map((ex, idx) => ({
        exerciseName: ex.name,
        index: idx,
        completed: false,
        timeSpent: 0,
        sets: Array.from({ length: ex.sets }).map((_, setIdx) => ({
          setIndex: setIdx,
          reps: ex.reps,
          weight: ex.weight,
          completed: false,
        })),
        notes: ex.notes,
      }))

      const id = await startSession({
        userId: clientId,
        dayOfWeek: 'mon',
        exercises: exercisesData,
      })
      setSessionId(id)
      setIsSessionStarted(true)
      toast.success('Workout session started')
    } catch (error) {
      toast.error('Failed to start workout session')
      console.error(error)
    }
  }

  // Timer effect
  React.useEffect(() => {
    if (!isPaused && isSessionStarted) {
      const interval = setInterval(() => {
        setWorkoutTime((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isPaused, isSessionStarted])

  // Update session progress every 10 seconds
  React.useEffect(() => {
    if (!sessionId || !isSessionStarted) return

    const updateInterval = setInterval(async () => {
      try {
        const exercisesData = exercises.map((ex, idx) => ({
          exerciseName: ex.name,
          index: idx,
          completed:
            Array.from(completedSets).filter((key) => key.startsWith(`${idx}-`))
              .length === ex.sets,
          timeSpent: workoutTime,
          sets: Array.from({ length: ex.sets }).map((_, setIdx) => ({
            setIndex: setIdx,
            reps: ex.reps,
            weight: ex.weight,
            completed: completedSets.has(`${idx}-${setIdx}`),
          })),
          notes: ex.notes,
        }))

        const estimatedCalories = (workoutTime / 60) * 5

        await updateSession({
          sessionId,
          exercises: exercisesData,
          totalTime: workoutTime,
          totalCaloriesBurned: Math.round(estimatedCalories),
        })
      } catch (error) {
        console.error('Failed to update session:', error)
      }
    }, 10000)

    return () => clearInterval(updateInterval)
  }, [sessionId, completedSets, workoutTime, exercises, isSessionStarted, updateSession])

  // Auto-scroll to current set
  React.useEffect(() => {
    if (currentExerciseRef.current && document.body.contains(currentExerciseRef.current)) {
      try {
        currentExerciseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } catch (error) {
        console.debug('Scroll error:', error)
      }
    }
  }, [completedSets])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const endWorkout = async () => {
    if (sessionId) {
      try {
        const estimatedCalories = (workoutTime / 60) * 5
        await completeSession({
          sessionId,
          totalTime: workoutTime,
          totalCaloriesBurned: Math.round(estimatedCalories),
        })
        toast.success('Workout logged successfully!')
      } catch (error) {
        toast.error('Failed to save workout')
        console.error(error)
      }
    }
    navigate({ to: `/app/management/clients/${clientId}` })
  }

  const cancelWorkout = async () => {
    if (sessionId) {
      try {
        await cancelSession({ sessionId })
      } catch (error) {
        console.error(error)
      }
    }
    navigate({ to: `/app/management/clients/${clientId}` })
  }

  const calculateSetInfo = () => {
    let totalSetsCount = 0
    let currentSetIndex = 0
    for (let i = 0; i < exercises.length; i++) {
      for (let j = 0; j < exercises[i].sets; j++) {
        const setKey = `${i}-${j}`
        if (!completedSets.has(setKey)) {
          currentSetIndex = totalSetsCount
          return { totalSetsCount, currentSetIndex }
        }
        totalSetsCount++
      }
    }
    return { totalSetsCount, currentSetIndex }
  }

  const { totalSetsCount, currentSetIndex } = calculateSetInfo()

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!user || !privilegedRoles.has(user.role)) {
    return null
  }

  if (!isSessionStarted) {
    return (
      <div className="space-y-6 p-4 pb-20 max-w-4xl mx-auto">
        {/* Header */}
        <header className="space-y-3">
          <Link
            to={`/app/management/clients/${clientId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to client
          </Link>
          <div>
            <h1 className="text-3xl font-semibold">Log Workout Session</h1>
            <p className="text-muted-foreground">
              Record a new workout for {client?.name || 'Client'}
            </p>
          </div>
        </header>

        {/* Workout Details */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Workout Title</label>
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-base"
                placeholder="e.g., Chest Day"
                value={workoutTitle}
                onChange={(e) => setWorkoutTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Focus Area</label>
              <select
                className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-base"
                value={workoutFocus}
                onChange={(e) => setWorkoutFocus(e.target.value)}
              >
                <option>Chest & Shoulders</option>
                <option>Back & Biceps</option>
                <option>Legs</option>
                <option>Full Body</option>
                <option>Cardio</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Exercises */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold">Exercises</h3>
            {exercises.map((ex, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{ex.name}</p>
                <p className="text-sm text-muted-foreground">
                  {ex.sets} sets × {ex.reps} reps @ {ex.weight} lbs
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Start Button */}
        <div className="flex gap-2">
          <Button onClick={startWorkout} className="w-full h-10">
            <Dumbbell className="w-4 h-4 mr-2" />
            Start Workout Session
          </Button>
          <Button onClick={cancelWorkout} variant="outline" className="w-full h-10">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-48">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{workoutTitle}</h2>
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

      {/* Exercise List */}
      <div className="p-4 space-y-6">
        <div className="h-[50vh]" />

        {exercises.map((exercise, exerciseIndex) => {
          const exerciseCompletedSets = Array.from(completedSets).filter(
            (key) => key.startsWith(`${exerciseIndex}-`),
          ).length

          return (
            <div key={exerciseIndex} className="space-y-2">
              {/* Exercise Header */}
              <div className="px-2 py-1">
                <h3 className="font-bold text-lg">{exercise.name}</h3>
                <div className="text-xs text-muted-foreground">
                  {exerciseCompletedSets} / {exercise.sets} sets
                  {exercise.reps && ` • ${exercise.reps} reps`}
                  {exercise.weight > 0 && ` • ${exercise.weight} lbs`}
                </div>
              </div>

              {/* Individual Sets */}
              <div className="space-y-2">
                {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                  const setKey = `${exerciseIndex}-${setIndex}`
                  const isCompleted = completedSets.has(setKey)
                  const isCurrent = completedSets.size === currentSetIndex && !isCompleted

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
                              <div className="font-semibold">Set {setIndex + 1}</div>
                              <div className="text-sm text-muted-foreground">
                                {exercise.reps} reps • {exercise.weight} lbs
                              </div>
                              {exercise.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {exercise.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          {isCurrent && (
                            <div className="flex gap-2">
                              {exerciseIndex === exercises.length - 1 &&
                              setIndex === exercise.sets - 1 ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const newCompleted = new Set(completedSets)
                                    newCompleted.add(setKey)
                                    setCompletedSets(newCompleted)
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
              onClick={() => setIsPaused(!isPaused)}
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


