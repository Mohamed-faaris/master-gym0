import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Dumbbell,
  Flame,
  Plus,
} from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from '@convex/_generated/api'

import type {ExerciseData} from '@/components/add-exercise-drawer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/useAuth'

import {
  AddExerciseDrawer
  
} from '@/components/add-exercise-drawer'

export const Route = createFileRoute('/app/_user/workouts')({
  component: RouteComponent,
})

function RouteComponent() {
  const today = new Date()
  const { user } = useAuth()
  const isSelfManaged = user?.role === 'selfManagedCustomer'
  const [isAddExerciseDrawerOpen, setIsAddExerciseDrawerOpen] = useState(false)
  const addSelfManagedExercise = useMutation(
    api.workoutSessions.addSelfManagedExerciseToToday,
  )

  // We'll fetch all routines assigned to the user, and display them for selection.
  const routines = useQuery(
    api.routines.getRoutinesByUser,
    user ? { userId: user._id } : 'skip',
  )

  const dayOfWeek = (
    ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  )[today.getDay()]
  const dayStart = new Date(today)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(today)
  dayEnd.setHours(23, 59, 59, 999)

  const todaysSession = useQuery(
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

  // Fetch today's ongoing session for stats
  const todaySession = useQuery(
    api.workoutSessions.getOngoingSession,
    user ? { userId: user._id } : 'skip',
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTodayStats = () => {
    let totalTime = 0
    let totalCalories = 0
    let completedSets = 0

    if (todaySession) {
      totalTime = todaySession.totalTime || 0
      totalCalories = todaySession.totalCaloriesBurned || 0
      completedSets = todaySession.exercises.reduce((sum, ex) => {
        return sum + ex.sets.filter((s) => s.completed).length
      }, 0)
    }

    return { totalTime, totalCalories, completedSets }
  }

  const todayStats = getTodayStats()

  // Since routines don't have strict scheduling days by default in the new schema,
  // we'll just show the routine exercises directly.
  // The 'add self-managed exercise' still works on a per-day basis as a diary.

  const handleAddExercise = async (data: ExerciseData) => {
    if (!user || !isSelfManaged) return

    try {
      await addSelfManagedExercise({
        userId: user._id,
        dayOfWeek,
        dayStart: dayStart.getTime(),
        dayEnd: dayEnd.getTime(),
        exerciseName: data.exerciseName,
        sets: data.sets,
      })
      toast.success("Exercise added to today's session")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to add exercise')
      }
    }
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header with date and day */}
      <div className="sticky top-0 z-10 bg-background p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workouts</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>
                {today.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
          {isSelfManaged && routines?.length === 0 && (
            <Button
              variant="outline"
              size="icon"
              aria-label="Add workout exercise"
              onClick={() => setIsAddExerciseDrawerOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        <Link to="/app/routines" className="block">
          <Button variant="outline" className="w-full h-12 shadow-sm border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
            <ClipboardList className="w-5 h-5 mr-3" />
            My Routines
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {!user && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Please sign in to view workouts
            </p>
          </div>
        )}

        {user && (
          <>
            {/* Today's Stats Card */}
            {todayStats.totalTime > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Today's Workout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Total Time</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {formatTime(todayStats.totalTime)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Flame className="h-4 w-4" />
                        <span className="text-xs">Calories</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {todayStats.totalCalories}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">Sets Done</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {todayStats.completedSets}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {user && routines?.length === 0 && !isSelfManaged && (
          <Card>
            <CardHeader>
              <CardTitle>No Training Program Assigned</CardTitle>
              <CardDescription>
                Contact your trainer to get a workout program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <ClipboardList className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">No Program Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Your trainer will assign you a personalized training
                    program.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user && routines?.length === 0 && isSelfManaged && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Session</CardTitle>
              <CardDescription>
                Add and track today&apos;s self-managed exercises
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todaysSession?.exercises.length ? (
                todaysSession.exercises.map((exercise, exIndex) => (
                  <div
                    key={exIndex}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <h4 className="font-medium">{exercise.exerciseName}</h4>
                    <div className="text-sm text-muted-foreground">
                      {exercise.sets?.length || 0} sets
                    </div>
                    <div className="space-y-1">
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className="text-sm flex items-center gap-2"
                        >
                          <span className="text-muted-foreground">
                            Set {setIndex + 1}:
                          </span>
                          <span>{set.reps} reps</span>
                          {set.weight !== undefined && (
                            <span>@ {set.weight}kg</span>
                          )}
                          <span
                            className={
                              set.completed
                                ? 'text-green-600 text-xs'
                                : 'text-muted-foreground text-xs'
                            }
                          >
                            {set.completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No exercises added for today yet. Use the + button to add one.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {user && routines && routines.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mt-8 mb-4">Your Routines</h2>
            {routines.map(routine => (
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
                  <div className="flex items-center gap-4 text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      <span>{routine.exercises.length} Exercises total</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-medium">
                      {routine.exercises.slice(0, 3).map((ex: any) => ex.exerciseName).join(', ')}
                      {routine.exercises.length > 3 && '...'}
                    </div>
                    
                    <Link to="/app/workout-session" search={{ routineId: routine._id }} className="block pt-2">
                      <Button className="w-full" variant="secondary">
                        Start Routine
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {user && (
        <div 
          className="fixed left-0 right-0 z-30 bg-background/95 backdrop-blur border-t p-4"
          style={{ bottom: 'calc(4rem + var(--safe-bottom))', paddingBottom: 'calc(1rem + var(--safe-bottom))' }}
        >
          <div className="max-w-screen-sm mx-auto">
            <Link to="/app/workout-session">
              <Button className="h-14 w-full rounded-full shadow-lg text-lg font-semibold">
                <Plus className="w-5 h-5 mr-2" />
                Start Blank Workout
              </Button>
            </Link>
          </div>
        </div>
      )}

      <AddExerciseDrawer
        open={isAddExerciseDrawerOpen}
        onOpenChange={setIsAddExerciseDrawerOpen}
        onSave={handleAddExercise}
      />
    </div>
  )
}
