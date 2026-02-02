import { useEffect, useState, useRef } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Activity,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  X,
  Play,
  Pause,
} from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'

import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@convex/_generated/api'
import { toast } from 'sonner'

const privilegedRoles = new Set(['trainer', 'admin'])

export const Route = createFileRoute('/app/management/clients/$clientId')({
  component: ClientDetailRoute,
})

function ClientDetailRoute() {
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [showWorkoutSession, setShowWorkoutSession] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set())
  const [workoutTime, setWorkoutTime] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [workoutTitle, setWorkoutTitle] = useState('')
  const [workoutFocus, setWorkoutFocus] = useState('Chest & Shoulders')

  const currentExerciseRef = useRef<HTMLDivElement>(null)

  // Fetch client data
  const client = useQuery(
    api.users.getUserById,
    clientId ? { userId: clientId } : 'skip',
  )

  const workoutLogs = useQuery(
    api.workoutLogs.getWorkoutLogsByUser,
    clientId ? { userId: clientId } : 'skip',
  )

  const dietLogs = useQuery(
    api.dietLogs.getDietLogsByUser,
    clientId ? { userId: clientId, limit: 100 } : 'skip',
  )

  const weightLogs = useQuery(
    api.weightLogs.getWeightLogsByUser,
    clientId ? { userId: clientId } : 'skip',
  )

  // Mutations for workout logging
  const startSession = useMutation(api.workoutSessions.startSession)
  const updateSession = useMutation(api.workoutSessions.updateSessionProgress)
  const completeSession = useMutation(api.workoutSessions.completeSession)
  const cancelSession = useMutation(api.workoutSessions.cancelSession)

  /* -------------------------------------------------------------------------- */
  /*                                    Auth                                    */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      navigate({ to: '/' })
      return
    }
    if (!privilegedRoles.has(user.role)) {
      navigate({ to: '/app' })
    }
  }, [user, isLoading, navigate])

  // Timer effect
  useEffect(() => {
    if (!isPaused && showWorkoutSession) {
      const interval = setInterval(() => {
        setWorkoutTime((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isPaused, showWorkoutSession])

  // Early returns AFTER all hooks
  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!user || !privilegedRoles.has(user.role)) {
    return null
  }

  if (!client) {
    return <div className="p-4">Loading client...</div>
  }

  // Workout session functions (defined after all guards)
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
    setShowWorkoutSession(false)
    setWorkoutTime(0)
    setCompletedSets(new Set())
    setSessionId(null)
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
    setShowWorkoutSession(false)
    setWorkoutTime(0)
    setCompletedSets(new Set())
    setSessionId(null)
  }

  // This function is already defined above, removing duplicate

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6 p-4 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <header className="space-y-3">
        <Link
          to="/app/management/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">{client.name}</h1>
          <p className="text-muted-foreground">
            {client.goal?.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </p>
        </div>
      </header>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{client.email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{client.phoneNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium capitalize">
              {client.role === 'trainerManagedCustomer'
                ? 'Trainer Managed'
                : 'Self Managed'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {workoutLogs?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Workouts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-chart-2">
                {dietLogs?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Diet Logs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">
                {weightLogs?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Weight Logs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate({ to: `./logs/workout` })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="w-5 h-5 text-chart-1" />
              View Workouts
            </CardTitle>
            <CardDescription>
              {workoutLogs?.length || 0} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Logs
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate({ to: `./logs/diet` })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
              View Diet
            </CardTitle>
            <CardDescription>{dietLogs?.length || 0} entries</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Logs
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate({ to: `./logs/weight` })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-chart-2" />
              View Weight
            </CardTitle>
            <CardDescription>{weightLogs?.length || 0} entries</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Log Workout Button */}
      {!showWorkoutSession && (
        <Card>
          <CardHeader>
            <CardTitle>Log Workout Session</CardTitle>
            <CardDescription>
              Record a new workout for {client.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowWorkoutSession(true)}
              className="w-full h-10"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              Start Workout Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workout Session Component */}
      {showWorkoutSession && (
        <div className="space-y-6">
          {/* Workout Info Input */}
          <Card>
            <CardHeader>
              <CardTitle>Workout Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workout Title</label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-base"
                  placeholder="e.g., Push Day"
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

          {/* Workout Session Tracker */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Active Session</CardTitle>
                <CardDescription>
                  {workoutTitle || 'Workout'} - {workoutFocus}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={cancelWorkout}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timer Display */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary" />
                  <div>
                    <div className="text-3xl font-bold tabular-nums">
                      {formatTime(workoutTime)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Time
                    </div>
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

              {/* Completed Sets Counter */}
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Sets Completed
                </p>
                <p className="text-2xl font-bold">{completedSets.size}</p>
              </div>

              {/* Exercise List for Logging */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Log Exercises</p>
                <div className="space-y-2">
                  {['Exercise 1', 'Exercise 2', 'Exercise 3'].map(
                    (exercise, idx) => (
                      <Card
                        key={idx}
                        className="cursor-pointer hover:border-primary transition-colors"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{exercise}</p>
                              <p className="text-xs text-muted-foreground">
                                3 sets × 10 reps
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newKey = `set-${completedSets.size}`
                                setCompletedSets(
                                  new Set([...completedSets, newKey]),
                                )
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ),
                  )}
                </div>
              </div>

              {/* End Workout Button */}
              <div className="flex gap-3">
                <Button className="flex-1" onClick={endWorkout}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  End Workout
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={cancelWorkout}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Workout Progress</p>
            <p className="text-2xl font-bold text-primary">
              {workoutLogs?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total workouts logged
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Diet Progress</p>
            <p className="text-2xl font-bold text-chart-2">
              {dietLogs?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Diet logs recorded
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Weight Tracking</p>
            <p className="text-2xl font-bold text-emerald-600">
              {weightLogs?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Weight logs recorded
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
