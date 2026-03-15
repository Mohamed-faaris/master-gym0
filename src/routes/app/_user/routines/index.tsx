import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from '@convex/_generated/api'
import { useQuery, useMutation } from 'convex/react'
import { Dumbbell, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/app/_user/routines/')({
  component: RoutinesRouteComponent,
})

function RoutinesRouteComponent() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const routines = useQuery(
    api.routines.getRoutinesByUser,
    user ? { userId: user._id } : 'skip',
  )
  
  const createRoutine = useMutation(api.routines.createRoutine)

  const handleCreateNewRoutine = async () => {
    if (!user) return
    try {
      const newRoutineId = await createRoutine({
        name: 'New Routine',
        type: 'custom',
        authorId: user._id,
        userId: user._id,
        exercises: [],
      })
      navigate({ to: `/app/routines/${newRoutineId}` })
    } catch (error) {
      toast.error('Failed to create a new routine.')
      console.error(error)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur p-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Routines</h1>
          <p className="text-sm text-muted-foreground">Manage your workout plans</p>
        </div>
        <Button onClick={handleCreateNewRoutine} size="icon" aria-label="Create new routine">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {!routines && (
          <div className="flex justify-center py-12">
            <span className="text-muted-foreground">Loading routines...</span>
          </div>
        )}

        {routines?.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No routines found</CardTitle>
              <CardDescription>
                You don't have any saved routines yet. Create one to get started!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Dumbbell className="h-8 w-8 text-primary" />
                </div>
                <Button onClick={handleCreateNewRoutine}>Create Routine</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {routines?.map((routine) => (
          <Card key={routine._id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate({ to: `/app/routines/${routine._id}` })}>
            <CardHeader className="pb-2">
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
              <div className="text-sm text-muted-foreground mb-4">
                {routine.exercises.length} Exercises
              </div>
              <div className="text-sm font-medium">
                {routine.exercises.slice(0, 3).map(ex => ex.exerciseName).join(', ')}
                {routine.exercises.length > 3 && '...'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
