import { createFileRoute } from '@tanstack/react-router'
import { Clock, Dumbbell, Flame, Trash2 } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import type { Id } from '@convex/_generated/dataModel'

import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/app/_user/sessions')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuth()

  const sessions = useQuery(
    api.workoutSessions.getSessionHistory,
    user ? { userId: user._id, limit: 100 } : 'skip',
  )
  const deleteSession = useMutation(api.workoutSessions.deleteSession)

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Please sign in to view sessions</p>
      </div>
    )
  }

  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.round(seconds / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const handleDeleteSession = async (sessionId: Id<'workoutSessions'>) => {
    if (!confirm('Delete this workout session?')) return

    try {
      await deleteSession({ sessionId })
      toast.success('Workout session deleted')
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete workout session')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <p className="text-muted-foreground">View and manage your workout history</p>
      </div>

      {!sessions ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading workout sessions...
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Workout Sessions</CardTitle>
            <CardDescription>Track your completed workouts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">No workout sessions yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Start a workout to build your session history.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session._id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="font-semibold text-lg">
                        {session.status === 'completed'
                          ? 'Completed workout'
                          : session.status === 'ongoing'
                            ? 'Ongoing workout'
                            : 'Cancelled workout'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.startTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Dumbbell className="h-4 w-4" />
                        {session.exercises.length} exercises
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {formatDuration(session.totalTime || 0)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Flame className="h-4 w-4" />
                        {session.totalCaloriesBurned || 0} cal
                      </span>
                    </div>

                    {session.exercises.length > 0 ? (
                      <div className="text-sm text-muted-foreground">
                        {session.exercises
                          .slice(0, 3)
                          .map((exercise) => exercise.exerciseName)
                          .join(', ')}
                        {session.exercises.length > 3 ? '...' : ''}
                      </div>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteSession(session._id)}
                    aria-label="Delete workout session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
