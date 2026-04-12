import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from '@convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Link2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  Unlink2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Id } from '@convex/_generated/dataModel'

import type { ExerciseData } from '@/components/add-exercise-drawer'
import { AddExerciseDrawer } from '@/components/add-exercise-drawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
] as const;

type RoutineSet = {
  reps?: number
  weight?: number
  restTime?: number
}

type RoutineExercise = {
  exerciseId?: Id<'exercises'>
  exerciseName: string
  supersetGroupId?: string
  sets: Array<RoutineSet>
}

const cloneExercises = (exercises: Array<RoutineExercise>) =>
  exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => ({ ...set })),
  }))

const normalizeExerciseGroups = (
  exercises: Array<RoutineExercise>,
) => {
  const normalized = cloneExercises(exercises)
  let index = 0

  while (index < normalized.length) {
    const groupId = normalized[index].supersetGroupId
    if (!groupId) {
      normalized[index].supersetGroupId = undefined
      index += 1
      continue
    }

    let endIndex = index + 1
    while (
      endIndex < normalized.length &&
      normalized[endIndex].supersetGroupId === groupId
    ) {
      endIndex += 1
    }

    if (endIndex - index < 2) {
      normalized[index].supersetGroupId = undefined
      index = endIndex
      continue
    }

    const normalizedGroupId = crypto.randomUUID()
    for (let current = index; current < endIndex; current += 1) {
      normalized[current].supersetGroupId = normalizedGroupId
    }
    index = endIndex
  }

  return normalized
}

const splitExerciseGroupAt = (
  exercises: Array<RoutineExercise>,
  exerciseIndex: number,
) => {
  const updated = cloneExercises(exercises)
  const sharedGroupId = updated[exerciseIndex].supersetGroupId
  if (!sharedGroupId) return updated

  let groupStart = exerciseIndex
  while (
    groupStart > 0 &&
    updated[groupStart - 1].supersetGroupId === sharedGroupId
  ) {
    groupStart -= 1
  }

  let groupEnd = exerciseIndex + 1
  while (
    groupEnd < updated.length - 1 &&
    updated[groupEnd + 1].supersetGroupId === sharedGroupId
  ) {
    groupEnd += 1
  }

  const leftSize = exerciseIndex - groupStart + 1
  const rightSize = groupEnd - exerciseIndex
  const leftGroupId = leftSize >= 2 ? crypto.randomUUID() : undefined
  const rightGroupId = rightSize >= 2 ? crypto.randomUUID() : undefined

  for (let current = groupStart; current <= exerciseIndex; current += 1) {
    updated[current].supersetGroupId = leftGroupId
  }
  for (let current = exerciseIndex + 1; current <= groupEnd; current += 1) {
    updated[current].supersetGroupId = rightGroupId
  }

  return updated
}

const mergeExerciseGroupsAt = (
  exercises: Array<RoutineExercise>,
  exerciseIndex: number,
) => {
  const updated = cloneExercises(exercises)
  const leftGroupId = updated[exerciseIndex].supersetGroupId
  const rightGroupId = updated[exerciseIndex + 1].supersetGroupId
  const mergedGroupId = leftGroupId ?? rightGroupId ?? crypto.randomUUID()

  if (leftGroupId) {
    for (const exercise of updated) {
      if (exercise.supersetGroupId === leftGroupId) {
        exercise.supersetGroupId = mergedGroupId
      }
    }
  }

  if (rightGroupId) {
    for (const exercise of updated) {
      if (exercise.supersetGroupId === rightGroupId) {
        exercise.supersetGroupId = mergedGroupId
      }
    }
  }

  updated[exerciseIndex].supersetGroupId = mergedGroupId
  updated[exerciseIndex + 1].supersetGroupId = mergedGroupId
  return normalizeExerciseGroups(updated)
}

const hasGroupedNeighbor = (
  exercises: Array<RoutineExercise>,
  exerciseIndex: number,
) =>
  exerciseIndex < exercises.length - 1 &&
  !!exercises[exerciseIndex].supersetGroupId &&
  exercises[exerciseIndex].supersetGroupId ===
    exercises[exerciseIndex + 1]?.supersetGroupId

const getGroupedExerciseCount = (
  exercises: Array<RoutineExercise>,
  groupId?: string,
) => exercises.filter((exercise) => exercise.supersetGroupId === groupId).length
 

export const Route = createFileRoute('/app/management/clients/$clientId/routines/$routineId')({
  component: ClientRoutineEditorComponent,
})

function ClientRoutineEditorComponent() {
  const { clientId, routineId } = Route.useParams()
  const navigate = useNavigate()

  const routine = useQuery(api.routines.getRoutineById, { routineId: routineId as Id<'routines'> })
  const updateRoutine = useMutation(api.routines.updateRoutine)
  const deleteRoutine = useMutation(api.routines.deleteRoutine)

  const [name, setName] = useState('')
  const [focus, setFocus] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState<string | undefined>()
  const [exercises, setExercises] = useState<Array<RoutineExercise>>([])
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [replaceExerciseIndex, setReplaceExerciseIndex] = useState<number | null>(null)

  useEffect(() => {
    if (routine) {
      setName(routine.name)
      setFocus(routine.focus || '')
      setDayOfWeek(routine.dayOfWeek)
      setExercises(routine.exercises)
    }
  }, [routine])

  if (routine === undefined) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  }

  if (routine === null) {
    return <div className="p-8 text-center text-muted-foreground">Routine not found</div>
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
      toast.success('Routine saved!')
      navigate({ to: `/app/management/clients/${clientId}/logs/workout` })
    } catch (error) {
      console.error(error)
      toast.error('Failed to save routine')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this routine?')) {
      try {
        await deleteRoutine({ routineId: routineId as Id<'routines'> })
        toast.success('Routine deleted')
        navigate({ to: `/app/management/clients/${clientId}/logs/workout` })
      } catch (error) {
        toast.error('Failed to delete')
      }
    }
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = cloneExercises(exercises)
    if (direction === 'up' && index > 0) {
      ;[newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]]
    } else if (direction === 'down' && index < newExercises.length - 1) {
      ;[newExercises[index + 1], newExercises[index]] = [newExercises[index], newExercises[index + 1]]
    }
    setExercises(normalizeExerciseGroups(newExercises))
  }
  
  const removeExercise = (index: number) => {
    const newExercises = cloneExercises(exercises)
    newExercises.splice(index, 1)
    setExercises(normalizeExerciseGroups(newExercises))
  }

  const addSet = (exerciseIndex: number) => {
    const newExercises = cloneExercises(exercises)
    const lastSet = newExercises[exerciseIndex].sets.slice(-1)[0] || { reps: 8, weight: 0, restTime: 90 }
    newExercises[exerciseIndex].sets.push({ ...lastSet })
    setExercises(newExercises)
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = cloneExercises(exercises)
    newExercises[exerciseIndex].sets.splice(setIndex, 1)
    setExercises(newExercises)
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    const numValue = value === '' ? undefined : Number(value)
    const newExercises = cloneExercises(exercises)
    newExercises[exerciseIndex].sets[setIndex][field] = numValue
    setExercises(newExercises)
  }

  const toggleSuperset = (exerciseIndex: number) => {
    if (exerciseIndex >= exercises.length - 1) {
      toast.error('Move this exercise higher to superset it with the next exercise')
      return
    }

    const updated = hasGroupedNeighbor(exercises, exerciseIndex)
      ? splitExerciseGroupAt(exercises, exerciseIndex)
      : mergeExerciseGroupsAt(exercises, exerciseIndex)
    setExercises(updated)
  }

  const onAddExercise = (data: ExerciseData) => {
    const nextExercise: RoutineExercise = {
      exerciseName: data.exerciseName,
      supersetGroupId: undefined,
      sets: data.sets.length ? data.sets : [{ reps: 8, weight: 0, restTime: 90 }],
    }

    const updated = cloneExercises(exercises)

    if (replaceExerciseIndex === null) {
      updated.push(nextExercise)
    } else {
      updated[replaceExerciseIndex] = {
        ...nextExercise,
        exerciseId: exercises[replaceExerciseIndex].exerciseId,
        supersetGroupId: exercises[replaceExerciseIndex].supersetGroupId,
      }
    }

    setExercises(updated)
    setReplaceExerciseIndex(null)
    setIsAddDrawerOpen(false)
  }

  return (
    <div className="space-y-4 pb-32">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/app/management/clients/${clientId}/logs/workout` })}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Edit Client Routine</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDelete}>
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
              <label className="text-sm font-medium">Routine Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Push Day, Upper Body" 
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Exercises</h2>
            <Button variant="outline" size="sm" onClick={() => setIsAddDrawerOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          {exercises.map((exercise, exIndex) => (
            <Card
              key={exIndex}
              className={`overflow-hidden ${exercise.supersetGroupId ? 'border-primary/50' : ''}`}
            >
              <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-semibold">{exercise.exerciseName}</span>
                  {exercise.supersetGroupId && (
                    <div className="text-xs font-medium text-primary">
                      Superset ({getGroupedExerciseCount(exercises, exercise.supersetGroupId)})
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveExercise(exIndex, 'up')} disabled={exIndex === 0}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveExercise(exIndex, 'down')} disabled={exIndex === exercises.length - 1}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setReplaceExerciseIndex(exIndex)
                      setIsAddDrawerOpen(true)
                    }}
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleSuperset(exIndex)}
                    disabled={exIndex === exercises.length - 1}
                  >
                    {hasGroupedNeighbor(exercises, exIndex) ? (
                      <Unlink2 className="w-4 h-4" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeExercise(exIndex)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="py-2 px-3 pl-4 text-left font-medium w-16">Set</th>
                      <th className="py-2 px-3 text-left font-medium">kg</th>
                      <th className="py-2 px-3 text-left font-medium">Reps</th>
                      <th className="py-2 px-3 text-left font-medium max-w-[80px]">Rest (s)</th>
                      <th className="py-2 px-3 text-right font-medium w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercise.sets.map((set: any, setIndex: number) => (
                      <tr key={setIndex} className="border-t">
                        <td className="py-2 px-3 pl-4 font-medium">{setIndex + 1}</td>
                        <td className="py-2 px-3">
                          <Input 
                            type="number" 
                            className="h-8 w-16 px-2"
                            value={set.weight ?? ''} 
                            onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)} 
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input 
                            type="number" 
                            className="h-8 w-16 px-2"
                            value={set.reps ?? ''} 
                            onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)} 
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input 
                            type="number" 
                            className="h-8 w-16 px-2"
                            value={set.restTime ?? ''} 
                            onChange={(e) => updateSet(exIndex, setIndex, 'restTime', e.target.value)} 
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeSet(exIndex, setIndex)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 border-t bg-muted/10">
                  <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary" onClick={() => addSet(exIndex)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Set
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {exercises.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-muted/10 text-muted-foreground">
              No exercises added yet.
            </div>
          )}
        </div>
      </div>

      <AddExerciseDrawer
        open={isAddDrawerOpen}
        onOpenChange={(open) => {
          setIsAddDrawerOpen(open)
          if (!open) setReplaceExerciseIndex(null)
        }}
        onSave={onAddExercise}
        initialData={
          replaceExerciseIndex === null
            ? null
            : {
                exerciseName: exercises[replaceExerciseIndex].exerciseName,
                sets: exercises[replaceExerciseIndex].sets,
              }
        }
        title={replaceExerciseIndex === null ? 'Add Exercise' : 'Replace Exercise'}
        description={
          replaceExerciseIndex === null
            ? 'Add sets and reps to this routine'
            : 'Replace the exercise in this routine slot'
        }
        saveLabel={replaceExerciseIndex === null ? 'Save Exercise' : 'Replace Exercise'}
      />
    </div>
  )
}
