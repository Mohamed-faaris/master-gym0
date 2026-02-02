import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Plus, Trash2, TrendingDown, Dumbbell, UtensilsCrossed, Scale } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { toast } from 'sonner'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { api } from '../../../../../convex/_generated/api'

const privilegedRoles = new Set(['trainer', 'admin'])

const weightChartConfig = {
  weight: {
    label: 'Weight',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export const Route = createFileRoute('/app/management/clients/$clientId')({
  component: ClientDetailRoute,
})

function ClientDetailRoute() {
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  // Local state
  const [isAddingWorkout, setIsAddingWorkout] = useState(false)
  const [workoutForm, setWorkoutForm] = useState({
    title: '',
    notes: '',
    duration: '',
    intensity: 'moderate' as 'light' | 'moderate' | 'heavy',
  })

  // Queries
  const clientData = useQuery(api.users.getUserById, clientId ? { userId: clientId } : 'skip')
  const workoutLogs = useQuery(
    api.workoutLogs.getWorkoutLogsByUser,
    clientId ? { userId: clientId, limit: 10 } : 'skip'
  )
  const dietLogs = useQuery(
    api.dietLogs.getDietLogsByUser,
    clientId ? { userId: clientId, limit: 10 } : 'skip'
  )
  const weightLogs = useQuery(
    api.weightLogs.getWeightLogsByUser,
    clientId ? { userId: clientId } : 'skip'
  )

  // Mutations
  const logWorkout = useMutation(api.workoutLogs.addWorkoutLog)
  const deleteWorkoutLog = useMutation(api.workoutLogs.deleteWorkoutLog)
  const deleteDietLog = useMutation(api.dietLogs.deleteDietLog)

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

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!user || !privilegedRoles.has(user.role)) {
    return null
  }

  /* -------------------------------------------------------------------------- */
  /*                              Handle Submissions                            */
  /* -------------------------------------------------------------------------- */

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientId || !workoutForm.title || !workoutForm.duration) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await logWorkout({
        userId: clientId,
        title: workoutForm.title,
        duration: parseInt(workoutForm.duration),
        intensity: workoutForm.intensity,
        notes: workoutForm.notes,
      })

      toast.success('Workout logged successfully!')
      setWorkoutForm({ title: '', notes: '', duration: '', intensity: 'moderate' })
      setIsAddingWorkout(false)
    } catch (error) {
      toast.error('Failed to log workout')
      console.error(error)
    }
  }

  const handleDeleteWorkout = async (logId: string) => {
    try {
      await deleteWorkoutLog({ logId })
      toast.success('Workout deleted')
    } catch (error) {
      toast.error('Failed to delete workout')
    }
  }

  const handleDeleteDietLog = async (logId: string) => {
    try {
      await deleteDietLog({ logId })
      toast.success('Diet log deleted')
    } catch (error) {
      toast.error('Failed to delete diet log')
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              Chart Data Prep                               */
  /* -------------------------------------------------------------------------- */

  const weightChartData = weightLogs
    ? [...weightLogs].reverse().map((log) => ({
        date: new Date(log.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        weight: log.weight,
      }))
    : []

  const currentWeight = weightLogs?.[0]?.weight ?? 0
  const targetWeight = weightLogs?.[weightLogs.length - 1]?.weight ?? 0
  const weightProgress = Math.round(((currentWeight - targetWeight) / Math.abs(targetWeight)) * 100) || 0

  const totalWorkouts = workoutLogs?.length ?? 0
  const totalDietLogs = dietLogs?.length ?? 0

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6 p-4 pb-20">
      {/* --------------------------- Header --------------------------- */}
      <header className="space-y-3">
        <Link
          to="/app/management/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to clients
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{clientData?.name ?? 'Loading...'}</h1>
          <p className="text-muted-foreground text-sm">
            {clientData?.goal?.replace(/([A-Z])/g, ' $1').trim()}
          </p>
        </div>
      </header>

      {/* ----------------------- Summary Cards ----------------------- */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Workouts Logged</p>
              <p className="text-2xl font-bold text-primary">{totalWorkouts}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Diet Logs</p>
              <p className="text-2xl font-bold text-emerald-600">{totalDietLogs}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Weight</p>
              <p className="text-2xl font-bold text-chart-1">{currentWeight} kg</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------- Weight Progress ----------------------- */}
      {weightChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Weight Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weightChartConfig} className="h-[200px]">
              <AreaChart data={weightChartData}>
                <defs>
                  <linearGradient id="fillWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--chart-1)"
                  fill="url(#fillWeight)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* ----------------------- Log Workout ----------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="w-4 h-4" />
            Log Workout
          </CardTitle>
          <CardDescription>Record a workout session for this client</CardDescription>
        </CardHeader>

        <CardContent>
          {!isAddingWorkout ? (
            <Button
              onClick={() => setIsAddingWorkout(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log New Workout
            </Button>
          ) : (
            <form onSubmit={handleLogWorkout} className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Workout Title *</label>
                <Input
                  placeholder="e.g., Chest & Triceps"
                  value={workoutForm.title}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, title: e.target.value })
                  }
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (minutes) *</label>
                <Input
                  type="number"
                  placeholder="45"
                  value={workoutForm.duration}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, duration: e.target.value })
                  }
                />
              </div>

              {/* Intensity */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Intensity</label>
                <Select
                  value={workoutForm.intensity}
                  onValueChange={(value) =>
                    setWorkoutForm({
                      ...workoutForm,
                      intensity: value as 'light' | 'moderate' | 'heavy',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="How did the workout go?"
                  value={workoutForm.notes}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, notes: e.target.value })
                  }
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Log Workout
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingWorkout(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ----------------------- Workout Logs ----------------------- */}
      {workoutLogs && workoutLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workout History</CardTitle>
            <CardDescription>{workoutLogs.length} workouts logged</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {workoutLogs.map((log) => (
              <div
                key={log._id}
                className="flex items-start justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{log.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {log.duration} min • {log.intensity}
                  </p>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteWorkout(log._id)}
                  className="ml-2 p-2 hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ----------------------- Diet Logs ----------------------- */}
      {dietLogs && dietLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Diet Logs
            </CardTitle>
            <CardDescription>{dietLogs.length} meals logged</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {dietLogs.map((log) => (
              <div
                key={log._id}
                className="flex items-start justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium capitalize">{log.mealType}</p>
                  <p className="text-sm">{log.title}</p>
                  {log.description && (
                    <p className="text-xs text-muted-foreground">{log.description}</p>
                  )}
                  <p className="text-sm font-semibold mt-1">{log.calories} kcal</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteDietLog(log._id)}
                  className="ml-2 p-2 hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ----------------------- Empty States ----------------------- */}
      {!workoutLogs?.length && !dietLogs?.length && !weightLogs?.length && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No logs yet</p>
            <p className="text-xs text-muted-foreground">
              Start logging workouts and diet for this client
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
