import { useEffect } from 'react'
import { Id } from '@convex/_generated/dataModel';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Calendar, Clock, Dumbbell, Play, Edit, Plus, Copy, CheckCircle } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { useState } from 'react'

import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

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
  
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  // Fetch workout sessions for the client
  const workoutSessions = useQuery(
    api.workoutSessions.getSessionHistory,
    clientId ? { userId: clientId as Id<'users'>, limit: 100 } : 'skip',
  )

  // Fetch routines assigned to this client
  const routines = useQuery(
    api.routines.getRoutinesByUser,
    clientId ? { userId: clientId as Id<'users'> } : 'skip',
  )

  const templates = useQuery(
    api.routines.getReusableRoutinesByAuthor,
    user ? { authorId: user._id } : 'skip'
  )
  const availableTemplates = templates || []

  const createRoutine = useMutation(api.routines.createRoutine)
  const copyRoutine = useMutation(api.routines.copyRoutineToUser)

  const handleCreateRoutine = async () => {
    if (!user || !clientId) return
    try {
      const routineId = await createRoutine({
        name: 'New Client Routine ' + new Date().toLocaleDateString(),
        type: 'custom',
        scope: 'single_client',
        authorId: user._id,
        userId: clientId as Id<'users'>,
        exercises: [],
      })
      navigate({ to: `/app/management/clients/${clientId}/routines/${routineId}` })
    } catch (error) {
      console.error('Failed to create routine', error)
    }
  }

  const handleCopyTemplate = async (templateId: Id<'routines'>) => {
    if (!clientId || !user) return
    setIsCopying(true)
    try {
      await copyRoutine({
        routineId: templateId,
        targetUserId: clientId as Id<'users'>,
        authorId: user._id,
      })
      setIsTemplateDrawerOpen(false)
    } catch (error) {
      console.error('Failed to copy template', error)
    } finally {
      setIsCopying(false)
    }
  }

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
          to="/app/management/clients/$clientId"
          params={{ clientId }}
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

      {/* Client Routines Section */}
      <h2 className="text-xl font-bold mb-4">Client's Routines & Workouts</h2>

      <div className="space-y-4 mb-8">
        {/* Quick Start Blank Workout */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Start an empty workout session right now</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/app/management/clients/$clientId/workout-session" params={{ clientId }} className="block">
              <Button className="w-full gap-2 font-semibold h-12">
                <Dumbbell className="w-5 h-5" /> Start Blank Session
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <h3 className="text-lg font-semibold">Saved Routines</h3>
          <div className="flex gap-2">
            <Button onClick={() => setIsTemplateDrawerOpen(true)} size="sm" variant="outline" className="gap-2">
              <Copy className="w-4 h-4" /> From Template
            </Button>
            <Button onClick={handleCreateRoutine} size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> New Routine
            </Button>
          </div>
        </div>
        
        {routines && routines.length > 0 ? (
          <div className="space-y-4">
            {routines.map((routine) => (
              <Card key={routine._id}>
                <CardHeader>
                  <CardTitle>{routine.name}</CardTitle>
                  {(routine.focus || routine.dayOfWeek) && (
                    <CardDescription className="flex items-center gap-2">
                      {routine.dayOfWeek && (
                        <span className="font-medium text-primary">
                          {{ mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }[routine.dayOfWeek as string]}
                        </span>
                      )}
                      {routine.dayOfWeek && routine.focus && <span>•</span>}
                      {routine.focus && <span>{routine.focus}</span>}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Dumbbell className="h-4 w-4" />
                      <span>{routine.exercises.length} Exercises total</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Link to="/app/management/clients/$clientId/workout-session" params={{ clientId }} search={{ routineId: routine._id }} className="flex-1">
                      <Button className="w-full gap-2">
                        <Play className="w-4 h-4" /> Start Workout
                      </Button>
                    </Link>
                    <Link to="/app/management/clients/$clientId/routines/$routineId" params={{ clientId, routineId: routine._id }} className="flex-1">
                      <Button variant="outline" className="w-full gap-2">
                        <Edit className="w-4 h-4" /> Edit Routine
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              This client does not have any assigned routines.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="border-t pt-6" />

      {/* Logs List */}
      <h2 className="text-xl font-bold mb-4">Past Sessions</h2>
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
                              {exercise.sets?.length || 0}{' '}
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

      <Drawer open={isTemplateDrawerOpen} onOpenChange={setIsTemplateDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Assign Routine Template</DrawerTitle>
              <DrawerDescription>
                Copy a global template to {clientId}'s profile.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0 space-y-3 max-h-[50vh] overflow-y-auto">
              {availableTemplates.length > 0 ? (
                availableTemplates.map((template) => (
                  <Card key={template._id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleCopyTemplate(template._id)}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base flex items-center justify-between">
                        {template.name}
                        {isCopying ? (
                          <span className="text-xs text-muted-foreground animate-pulse">Copying...</span>
                        ) : (
                          <CheckCircle className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {template.exercises.length} Exercises
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  No trainer templates found.
                </div>
              )}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" disabled={isCopying}>Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
