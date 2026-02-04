import { useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Dumbbell, Calendar, Clock } from 'lucide-react'
import { useQuery } from 'convex/react'

import { useAuth } from '@/components/auth/useAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@convex/_generated/api'

const privilegedRoles = new Set(['trainer', 'admin'])

export const Route = createFileRoute(
  '/app/management/clients/$clientId/logs/workout',
)({
  component: WorkoutLogsRoute,
})

function WorkoutLogsRoute() {
  const navigate = useNavigate()
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()

  // Fetch workout sessions for the client
  const workoutSessions = useQuery(
    api.workoutSessions.getSessionHistory,
    clientId ? { userId: clientId, limit: 100 } : 'skip',
  )

  useEffect(() => {
    if (isLoading) return
    if (!user || !privilegedRoles.has(user.role)) {
      navigate({ to: '/' })
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!user || !privilegedRoles.has(user.role)) {
    return null
  }

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
          <h1 className="text-2xl font-semibold">Workout Sessions</h1>
          <p className="text-muted-foreground">
            {workoutSessions?.length || 0} session
            {(workoutSessions?.length || 0) !== 1 ? 's' : ''} recorded
          </p>
        </div>
      </header>

      {/* Logs List */}
      <div className="space-y-3">
        {!workoutSessions ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Loading workout sessions...
              </p>
            </CardContent>
          </Card>
        ) : workoutSessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Dumbbell className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">No workout sessions yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Workout sessions will appear here once logged.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          workoutSessions.map((session) => (
            <Card
              key={session._id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        {session.status} session
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(session.startTime).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {Math.round((session.totalTime || 0) / 60) ||
                            'N/A'}{' '}
                          min
                        </div>
                      </div>
                    </div>
                  </div>

                  {session.exercises && session.exercises.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {session.exercises.length} exercise
                        {session.exercises.length !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-2">
                        {session.exercises.map((exercise, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                          >
                            <Dumbbell className="w-4 h-4 text-muted-foreground" />
                            <span className="flex-1">
                              {exercise.exerciseName || 'Exercise'}
                            </span>
                            <span className="text-muted-foreground">
                              {exercise.sets?.length || 0 || exercise.noOfSets}{' '}
                              sets
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
