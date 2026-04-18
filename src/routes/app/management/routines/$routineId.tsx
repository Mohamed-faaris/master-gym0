import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from '@convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { ChevronLeft, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Id } from '@convex/_generated/dataModel'

import { WorkoutExerciseBuilder } from '@/components/workout-exercise-builder'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DAYS_OF_WEEK,
  type RoutineExercise,
} from '@/lib/workout-plan-helpers'

export const Route = createFileRoute('/app/management/routines/$routineId')({
  component: ManagementRoutineEditorComponent,
})

function ManagementRoutineEditorComponent() {
  const { routineId } = Route.useParams()
  const navigate = useNavigate()

  const routine = useQuery(api.routines.getRoutineById, {
    routineId: routineId as Id<'routines'>,
  })
  const updateRoutine = useMutation(api.routines.updateRoutine)
  const deleteRoutine = useMutation(api.routines.deleteRoutine)

  const [name, setName] = useState('')
  const [focus, setFocus] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState<string | undefined>()
  const [exercises, setExercises] = useState<Array<RoutineExercise>>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!routine) return
    setName(routine.name)
    setFocus(routine.focus || '')
    setDayOfWeek(routine.dayOfWeek)
    setExercises(routine.exercises)
  }, [routine])

  if (routine === undefined) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  if (routine === null) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Routine template not found
      </div>
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Routine name is required')
      return
    }

    setIsSaving(true)
    try {
      await updateRoutine({
        routineId: routineId as Id<'routines'>,
        name,
        focus: focus || undefined,
        dayOfWeek: dayOfWeek as any,
        exercises,
      })
      toast.success('Template saved!')
      navigate({ to: '/app/management/routines' })
    } catch (error) {
      console.error(error)
      toast.error('Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await deleteRoutine({ routineId: routineId as Id<'routines'> })
      toast.success('Template deleted')
      navigate({ to: '/app/management/routines' })
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-4 pb-32">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/app/management/routines' })}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Edit Template</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Push Day, Full Body Starter"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Focus Area (Optional)</label>
              <Input
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="e.g. Arms, Chest & Triceps"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Day of Week (Optional)</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={dayOfWeek || ''}
                onChange={(e) => setDayOfWeek(e.target.value || undefined)}
              >
                <option value="">None (Flexible)</option>
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <WorkoutExerciseBuilder exercises={exercises} onChange={setExercises} />
      </div>
    </div>
  )
}
