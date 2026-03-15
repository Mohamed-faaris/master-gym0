import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from '@convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { CheckCircle2, Clock, Pause, Play, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type {ExerciseData} from '@/components/add-exercise-drawer';
import { useAuth } from '@/components/auth/useAuth'
import {
  Checkbox,
  CheckboxIndicator,
} from '@/components/animate-ui/primitives/radix/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Id } from '@convex/_generated/dataModel'
import { AddExerciseDrawer } from '@/components/add-exercise-drawer'
import { RestTimer } from '@/components/rest-timer'

export const Route = createFileRoute('/app/_user/workout-session')({
  component: WorkoutSessionRouteComponent,
})

export function WorkoutSessionRouteComponent() {
  const navigate = useNavigate()
  const search = Route.useSearch() as { routineId?: string }
  const { user } = useAuth()

  const startSession = useMutation(api.workoutSessions.startSession)
  const updateSession = useMutation(api.workoutSessions.updateSessionProgress)
  const completeSession = useMutation(api.workoutSessions.completeSession)

  const routineQuery = useQuery(
    api.routines.getRoutineById,
    search.routineId ? { routineId: search.routineId as Id<'routines'> } : 'skip'
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

  const [localExercises, setLocalExercises] = React.useState<any[]>([])

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
        exerciseName: ex.exerciseName,
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

  const syncToDb = async (newExercises: any[]) => {
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
    const updated = [...localExercises]
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
    const updated = [...localExercises]
    const lastSet = updated[exIndex].sets.slice(-1)[0] || { reps: 8, weight: 0, restTime: 90, completed: false }
    updated[exIndex].sets.push({ ...lastSet, completed: false })
    setLocalExercises(updated)
    syncToDb(updated)
  }

  const handleStartSession = async () => {
    if (!user) return
    try {
      const activeRoutineId = todaysWorkout?._id
      const session = await startSession({
        userId: user._id,
        routineId: activeRoutineId as Id<'routines'> | undefined,
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
        sessionId: sessionId as Id<'workoutSessions'>,
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

  const handleAddExercise = async (data: ExerciseData) => {
    if (!sessionId) {
      toast.error('Please start the session first')
      return;
    }
    
    const updated = [...localExercises, {
      exerciseName: data.exerciseName,
      sets: data.sets?.length ? data.sets.map(s => ({...s, completed: false})) : [{ reps: 8, weight: 0, restTime: 90, completed: false }]
    }]
    setLocalExercises(updated)
    await syncToDb(updated)
    toast.success('Exercise added')
    setIsAddExerciseDrawerOpen(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-4 pb-32 space-y-6 max-w-4xl mx-auto">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {todaysWorkout?.name ?? 'Workout Session'}
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
          <Card key={exerciseIndex}>
            <div className="p-4 font-semibold text-lg border-b bg-muted/20">
              {exercise.exerciseName}
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
        onOpenChange={setIsAddExerciseDrawerOpen}
        onSave={handleAddExercise}
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
