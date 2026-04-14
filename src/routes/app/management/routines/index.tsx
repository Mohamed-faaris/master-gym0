import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from '@convex/_generated/api'
import { useQuery, useMutation } from 'convex/react'
import { Dumbbell, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/useAuth'

export const Route = createFileRoute('/app/management/routines/')({
  component: ManagementRoutinesIndexComponent,
})

function ManagementRoutinesIndexComponent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const createRoutine = useMutation(api.routines.createRoutine)

  const routines = useQuery(
    api.routines.getReusableRoutinesByAuthor,
    user ? { authorId: user._id } : 'skip'
  )

  const isAdmin = user?.role === 'admin'

  const handleCreateRoutine = async () => {
    if (!user) return
    try {
      const routineId = await createRoutine({
        name: 'New Premade ' + new Date().toLocaleDateString(),
        type: 'trainer',
        scope: isAdmin ? 'all' : 'trainer_clients',
        authorId: user._id,
        exercises: [],
      })
      navigate({ to: `/app/management/routines/${routineId}` })
    } catch (error) {
      console.error('Failed to create routine template', error)
    }
  }

  return (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdmin ? 'Global Premade Routines' : 'Routine Library'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin
              ? 'Manage premade routines available across the app.'
              : 'Manage reusable routines for all of your clients.'}
          </p>
        </div>
        <Button onClick={handleCreateRoutine} className="gap-2">
          <Plus className="w-4 h-4" /> Create
        </Button>
      </div>

      <div className="space-y-4">
        {routines?.map((routine) => (
          <Card key={routine._id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate({ to: `/app/management/routines/${routine._id}` })}>
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
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  <span>{routine.exercises.length} Exercises total</span>
                </div>
              </div>
              <div className="text-sm font-medium">
                {routine.exercises.slice(0, 3).map((ex: any) => ex.exerciseName).join(', ')}
                {routine.exercises.length > 3 && '...'}
              </div>
            </CardContent>
          </Card>
        ))}

        {routines?.length === 0 && (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <h3 className="text-lg font-medium">No templates yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first reusable routine.
            </p>
            <Button onClick={handleCreateRoutine} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Create Premade
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
