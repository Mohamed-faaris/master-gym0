import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from '@convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Clock,
  Link2,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Unlink2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Id } from '@convex/_generated/dataModel'
import type { ExerciseData } from '@/components/add-exercise-drawer'
import { useAuth } from '@/components/auth/useAuth'
import {
  Checkbox,
  CheckboxIndicator,
} from '@/components/animate-ui/primitives/radix/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AddExerciseDrawer } from '@/components/add-exercise-drawer'
import { RestTimer } from '@/components/rest-timer'

const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export const Route = createFileRoute(
  '/app/management/clients/$clientId/workout-session',
)({
  component: TrainerWorkoutSessionRoute,
})

type WorkoutSet = {
  reps?: number
  weight?: number
  restTime?: number
  completed: boolean
}

type WorkoutExercise = {
  exerciseId?: Id<'exercises'>
  exerciseName: string
  supersetGroupId?: string
  sets: Array<WorkoutSet>
}

const cloneExercises = (exercises: Array<WorkoutExercise>) =>
  exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => ({ ...set })),
  }))

const clearSupersetGroup = (
  exercises: Array<WorkoutExercise>,
  groupId?: string,
) => {
  if (!groupId) return exercises
  return exercises.map((exercise) =>
    exercise.supersetGroupId === groupId
      ? { ...exercise, supersetGroupId: undefined }
      : exercise,
  )
}

function TrainerWorkoutSessionRoute() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()

  const privilegedRoles = new Set(['trainer', 'admin'])

  const startSession = useMutation(api.workoutSessions.startSession)
  const updateSession = useMutation(api.workoutSessions.updateSessionProgress)
  const completeSession = useMutation(api.workoutSessions.completeSession)

  const routineQuery = useQuery(
    api.routines.getRoutineById,
    search.routineId ? { routineId: search.routineId } : 'skip'
  )
  const todaysWorkout = routineQuery

  const [isPaused, setIsPaused] = React.useState(false)
  const [workoutTime, setWorkoutTime] = React.useState(0)
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [isAddExerciseDrawerOpen, setIsAddExerciseDrawerOpen] = React.useState(false)

  // New Rest Timer state
  const [isRestTimerOpen, setIsRestTimerOpen] = React.useState(false)
  const [restTimerSeconds, setRestTimerSeconds] = React.useState(90)

  const today = new Date()
  const dayOfWeek = daysOfWeek[today.getDay()]
  const dayStart = new Date(today)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(today)
  dayEnd.setHours(23, 59, 59, 999)

  const existingSession = useQuery(
    api.workoutSessions.getLatestSessionForDay,
    clientId
      ? {
          userId: clientId as Id<'users'>,
          dayOfWeek,
          dayStart: dayStart.getTime(),
          dayEnd: dayEnd.getTime(),
        }
      : 'skip',
  )

  const [localExercises, setLocalExercises] = React.useState<Array<WorkoutExercise>>([])
  const [replaceExerciseIndex, setReplaceExerciseIndex] = React.useState<number | null>(null)

  // Auth check
  React.useEffect(() => {
    if (isLoading) return
    if (!user || !privilegedRoles.has(user.role)) {
      navigate({ to: '/' })
    }
  }, [user, isLoading, navigate])

  React.useEffect(() => {
    if (existingSession) {
      setSessionId(existingSession._id)
      setWorkoutTime(existingSession.totalTime || 0)
      if (existingSession.status === 'completed') {
        setIsPaused(true)
      }
      setLocalExercises(existingSession.exercises)
    } else if (todaysWorkout && localExercises.length === 0) {
      // initialize from routine
      const initial = todaysWorkout.exercises.map((ex: any) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        supersetGroupId: undefined,
        sets: ex.sets.map((s: any) => ({ ...s, completed: false }))
      }))
      setLocalExercises(initial)
    }
  }, [existingSession, todaysWorkout])

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

  const syncToDb = async (newExercises: Array<WorkoutExercise>) => {
    if (!sessionId) return
    try {
      const estimatedCalories = (workoutTime / 60) * 5
      await updateSession({
        sessionId: sessionId as Id<'workoutSessions'>,
        exercises: newExercises,
        totalTime: workoutTime,
        totalCaloriesBurned: Math.round(estimatedCalories),
      })
    } catch (error) {
      console.error(error)
    }
  }

  const updateSet = (exIndex: number, setIndex: number, field: string, value: any) => {
    const updated = cloneExercises(localExercises)
    updated[exIndex].sets[setIndex][field] = value
    setLocalExercises(updated)
    syncToDb(updated)
  }

  const toggleSet = (exIndex: number, setIndex: number) => {
    const currentStatus = localExercises[exIndex].sets[setIndex].completed
    const newStatus = !currentStatus
    updateSet(exIndex, setIndex, 'completed', newStatus)

    if (newStatus && !isPaused) { // Trigger rest timer only if just checked
      const restTime = localExercises[exIndex].sets[setIndex].restTime || 90
      setRestTimerSeconds(restTime)
      setIsRestTimerOpen(true)
    }
  }

  const addSet = (exIndex: number) => {
    const updated = cloneExercises(localExercises)
    const lastSet = updated[exIndex].sets.slice(-1)[0] || { reps: 8, weight: 0, restTime: 90, completed: false }
    updated[exIndex].sets.push({ ...lastSet, completed: false })
    setLocalExercises(updated)
    syncToDb(updated)
  }

  const moveExercise = (exerciseIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1
    if (targetIndex < 0 || targetIndex >= localExercises.length) return

    const updated = cloneExercises(localExercises)
    const [movedExercise] = updated.splice(exerciseIndex, 1)
    updated.splice(targetIndex, 0, movedExercise)
    setLocalExercises(updated)
    syncToDb(updated)
  }

  const toggleSuperset = (exerciseIndex: number) => {
    if (exerciseIndex >= localExercises.length - 1) {
      toast.error('Move this exercise higher to superset it with the next exercise')
      return
    }

    const currentExercise = localExercises[exerciseIndex]
    const nextExercise = localExercises[exerciseIndex + 1]
    let updated = cloneExercises(localExercises)

    if (
      currentExercise.supersetGroupId &&
      currentExercise.supersetGroupId === nextExercise.supersetGroupId
    ) {
      updated = clearSupersetGroup(updated, currentExercise.supersetGroupId)
      setLocalExercises(updated)
      syncToDb(updated)
      toast.success('Superset removed')
      return
    }

    updated = clearSupersetGroup(updated, currentExercise.supersetGroupId)
    updated = clearSupersetGroup(updated, nextExercise.supersetGroupId)
    const groupId = crypto.randomUUID()
    updated[exerciseIndex] = {
      ...updated[exerciseIndex],
      supersetGroupId: groupId,
    }
    updated[exerciseIndex + 1] = {
      ...updated[exerciseIndex + 1],
      supersetGroupId: groupId,
    }
    setLocalExercises(updated)
    syncToDb(updated)
    toast.success('Superset saved')
  }

  const handleStartSession = async () => {
    if (!user || !clientId) return
    try {
      const activeRoutineId = todaysWorkout?._id
      const session = await startSession({
        userId: clientId as Id<'users'>,
        instructorId: user._id, // the trainer is starting it
        routineId: activeRoutineId as Id<'routines'> | undefined,
        dayOfWeek,
        dayStart: dayStart.getTime(),
        dayEnd: dayEnd.getTime(),
      })
      setSessionId(session)
      toast.success('Client workout session started')
    } catch (error) {
      console.error(error)
      toast.error('Failed to start session')
    }
  }

  const handleCompleteSession = async () => {
    if (!sessionId) return
    try {
      await completeSession({
        sessionId: sessionId as Id<'workoutSessions'>,
        totalTime: workoutTime,
        totalCaloriesBurned: Math.round((workoutTime / 60) * 5),
      })
      toast.success('Workout completed!')
      navigate({ to: `/app/management/clients/${clientId}/logs/workout` })
    } catch (error) {
      console.error(error)
      toast.error('Failed to complete workout')
    }
  }

  const handleAddExercise = async (data: ExerciseData) => {
    if (!sessionId) {
      toast.error('Please start the session first')
      return;
    }

    const nextExercise: WorkoutExercise = {
      exerciseName: data.exerciseName,
      supersetGroupId: undefined,
      sets: data.sets.length
        ? data.sets.map((set) => ({
            ...set,
            restTime: 90,
            completed: false,
          }))
        : [{ reps: 8, weight: 0, restTime: 90, completed: false }]
    }

    const updated = cloneExercises(localExercises)

    if (replaceExerciseIndex === null) {
      updated.push(nextExercise)
    } else {
      const currentExercise = localExercises[replaceExerciseIndex]
      updated[replaceExerciseIndex] = {
        ...nextExercise,
        exerciseId: currentExercise.exerciseId,
        supersetGroupId: currentExercise.supersetGroupId,
        sets: nextExercise.sets.map((set, setIndex) => ({
          ...set,
          restTime: currentExercise.sets[setIndex]?.restTime ?? set.restTime ?? 90,
        })),
      }
    }

    setLocalExercises(updated)
    await syncToDb(updated)
    toast.success(replaceExerciseIndex === null ? 'Exercise added' : 'Exercise replaced')
    setReplaceExerciseIndex(null)
    setIsAddExerciseDrawerOpen(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!user || !privilegedRoles.has(user.role)) {
    return null
  }

  return (
    <div className="p-4 pb-32 space-y-6 max-w-4xl mx-auto">
      <header className="flex flex-col gap-3">
        <Button 
          variant="ghost" 
          className="w-fit p-0 hover:bg-transparent text-muted-foreground"
          onClick={() => navigate({ to: `/app/management/clients/${clientId}/logs/workout` })}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Client Logs
        </Button>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              {todaysWorkout?.name ?? 'Client Workout Session'}
            </h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsAddExerciseDrawerOpen(true)}
            aria-label="Add workout exercise"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        {localExercises.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                No exercises scheduled today. Add an exercise to begin!
              </p>
            </CardContent>
          </Card>
        )}

        {localExercises.map((exercise, exerciseIndex) => (
          <Card
            key={exerciseIndex}
            className={exercise.supersetGroupId ? 'border-primary/50' : undefined}
          >
            <div className="border-b bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-lg">{exercise.exerciseName}</div>
                  {exercise.supersetGroupId && (
                    <div className="text-xs font-medium text-primary">
                      Superset
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveExercise(exerciseIndex, 'up')}
                    disabled={exerciseIndex === 0}
                    aria-label="Move exercise up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveExercise(exerciseIndex, 'down')}
                    disabled={exerciseIndex === localExercises.length - 1}
                    aria-label="Move exercise down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setReplaceExerciseIndex(exerciseIndex)
                      setIsAddExerciseDrawerOpen(true)
                    }}
                    aria-label="Replace exercise"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleSuperset(exerciseIndex)}
                    disabled={exerciseIndex === localExercises.length - 1}
                    aria-label={
                      exercise.supersetGroupId &&
                      exercise.supersetGroupId ===
                        localExercises[exerciseIndex + 1]?.supersetGroupId
                        ? 'Remove superset'
                        : 'Create superset with next exercise'
                    }
                  >
                    {exercise.supersetGroupId &&
                    exercise.supersetGroupId ===
                      localExercises[exerciseIndex + 1]?.supersetGroupId ? (
                      <Unlink2 className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-xs font-medium border-b">
                  <tr>
                    <th className="py-2 pl-4 text-left w-12">Set</th>
                    <th className="py-2 text-center">kg</th>
                    <th className="py-2 text-center">Reps</th>
                    <th className="py-2 pr-4 text-center w-16">Done</th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set: any, setIndex: number) => {
                    const isCompleted = set.completed
                    return (
                      <tr key={setIndex} className={`border-b border-muted transition-colors ${isCompleted ? 'bg-green-500/10' : ''}`}>
                        <td className="py-2 pl-4 text-muted-foreground font-medium">
                          {setIndex + 1}
                        </td>
                        <td className="py-2 px-1 text-center">
                          <Input
                            type="number"
                            className={`h-8 w-16 mx-auto text-center font-medium ${isCompleted ? 'bg-transparent border-transparent text-muted-foreground' : ''}`}
                            value={set.weight ?? ''}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value === '' ? undefined : Number(e.target.value))}
                            disabled={isCompleted}
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <Input
                            type="number"
                            className={`h-8 w-16 mx-auto text-center font-medium ${isCompleted ? 'bg-transparent border-transparent text-muted-foreground' : ''}`}
                            value={set.reps ?? ''}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value === '' ? undefined : Number(e.target.value))}
                            disabled={isCompleted}
                          />
                        </td>
                        <td className="py-2 pr-4 text-center align-middle">
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => toggleSet(exerciseIndex, setIndex)}
                            className={`size-6 mx-auto flex justify-center items-center border rounded-md transition-colors ${
                              isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-input bg-transparent'
                            }`}
                          >
                            <CheckboxIndicator className="size-4" />
                          </Checkbox>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="p-3 text-center">
                <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => addSet(exerciseIndex)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Set
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {localExercises.length > 0 && (
          <Button variant="outline" className="w-full h-12 border-dashed border-2" onClick={() => setIsAddExerciseDrawerOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        )}
      </div>

      <div
        className="fixed inset-x-0 border-t bg-background/95 backdrop-blur shadow-[0_-10px_40px_rgba(0,0,0,0.1)] supports-[backdrop-filter]:bg-background/90 z-40"
        style={{ bottom: 'calc(4rem + var(--safe-bottom))' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium tabular-nums">
            <Clock className="w-4 h-4" />
            {formatTime(workoutTime)}
          </div>

          <div className="flex items-center gap-2">
            {!sessionId ? (
              <Button onClick={handleStartSession} className="gap-2 px-8 rounded-full">
                <Play className="w-4 h-4" />
                Start Session
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setIsPaused((prev) => !prev)}
                  variant="outline"
                  className="gap-2 rounded-full"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={handleCompleteSession}
                  className="gap-2 rounded-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finish
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <AddExerciseDrawer
        open={isAddExerciseDrawerOpen}
        onOpenChange={(open) => {
          setIsAddExerciseDrawerOpen(open)
          if (!open) {
            setReplaceExerciseIndex(null)
          }
        }}
        onSave={handleAddExercise}
        initialData={
          replaceExerciseIndex === null
            ? null
            : {
                exerciseName: localExercises[replaceExerciseIndex]?.exerciseName ?? '',
                sets:
                  localExercises[replaceExerciseIndex]?.sets.map((set) => ({
                    reps: set.reps,
                    weight: set.weight,
                  })) ?? [],
              }
        }
        title={replaceExerciseIndex === null ? 'Add Exercise for Today' : 'Replace Exercise'}
        description={
          replaceExerciseIndex === null
            ? 'Add sets and reps to your current day session'
            : 'Update the exercise and set targets for this position'
        }
        saveLabel={replaceExerciseIndex === null ? 'Save Exercise' : 'Replace Exercise'}
      />

      {isRestTimerOpen && (
        <RestTimer
          initialSeconds={restTimerSeconds}
          onComplete={() => setIsRestTimerOpen(false)}
          onSkip={() => setIsRestTimerOpen(false)}
        />
      )}
    </div>
  )
}
