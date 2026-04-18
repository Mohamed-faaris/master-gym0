import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Link2,
  Plus,
  RefreshCcw,
  Trash2,
  Unlink2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import type { ExerciseData } from '@/components/add-exercise-drawer'
import { AddExerciseDrawer } from '@/components/add-exercise-drawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  cloneExercises,
  getGroupedExerciseCount,
  hasGroupedNeighbor,
  mergeExerciseGroupsAt,
  normalizeExerciseGroups,
  splitExerciseGroupAt,
  type RoutineExercise,
} from '@/lib/workout-plan-helpers'

type WorkoutExerciseBuilderProps = {
  exercises: Array<RoutineExercise>
  onChange: (exercises: Array<RoutineExercise>) => void
  emptyText?: string
}

export function WorkoutExerciseBuilder({
  exercises,
  onChange,
  emptyText = 'No exercises added yet.',
}: WorkoutExerciseBuilderProps) {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [replaceExerciseIndex, setReplaceExerciseIndex] = useState<number | null>(
    null,
  )

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = cloneExercises(exercises)
    if (direction === 'up' && index > 0) {
      ;[newExercises[index - 1], newExercises[index]] = [
        newExercises[index],
        newExercises[index - 1],
      ]
    } else if (direction === 'down' && index < newExercises.length - 1) {
      ;[newExercises[index + 1], newExercises[index]] = [
        newExercises[index],
        newExercises[index + 1],
      ]
    }
    onChange(normalizeExerciseGroups(newExercises))
  }

  const removeExercise = (index: number) => {
    const newExercises = cloneExercises(exercises)
    newExercises.splice(index, 1)
    onChange(normalizeExerciseGroups(newExercises))
  }

  const addSet = (exerciseIndex: number) => {
    const newExercises = cloneExercises(exercises)
    const lastSet = newExercises[exerciseIndex].sets.slice(-1)[0] || {
      reps: 8,
      weight: 0,
      restTime: 90,
    }
    newExercises[exerciseIndex].sets.push({ ...lastSet })
    onChange(newExercises)
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = cloneExercises(exercises)
    newExercises[exerciseIndex].sets.splice(setIndex, 1)
    onChange(newExercises)
  }

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'reps' | 'restTime',
    value: string,
  ) => {
    const numValue = value === '' ? undefined : Number(value)
    const newExercises = cloneExercises(exercises)
    newExercises[exerciseIndex].sets[setIndex][field] = numValue
    onChange(newExercises)
  }

  const toggleSuperset = (exerciseIndex: number) => {
    if (exerciseIndex >= exercises.length - 1) {
      toast.error('Move this exercise higher to superset it with next exercise')
      return
    }

    const updated = hasGroupedNeighbor(exercises, exerciseIndex)
      ? splitExerciseGroupAt(exercises, exerciseIndex)
      : mergeExerciseGroupsAt(exercises, exerciseIndex)
    onChange(updated)
  }

  const onAddExercise = (data: ExerciseData) => {
    const nextExercise: RoutineExercise = {
      exerciseName: data.exerciseName,
      supersetGroupId: undefined,
      sets: data.sets.length
        ? data.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
            restTime: 90,
          }))
        : [{ reps: 8, weight: 0, restTime: 90 }],
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

    onChange(updated)
    setReplaceExerciseIndex(null)
    setIsAddDrawerOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Exercises</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddDrawerOpen(true)}
          className="gap-2"
        >
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
                  Superset (
                  {getGroupedExerciseCount(exercises, exercise.supersetGroupId)})
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => moveExercise(exIndex, 'up')}
                disabled={exIndex === 0}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => moveExercise(exIndex, 'down')}
                disabled={exIndex === exercises.length - 1}
              >
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeExercise(exIndex)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="py-2 px-3 pl-4 text-left font-medium w-16">
                    Set
                  </th>
                  <th className="py-2 px-3 text-left font-medium">kg</th>
                  <th className="py-2 px-3 text-left font-medium">Reps</th>
                  <th className="py-2 px-3 text-left font-medium max-w-[80px]">
                    Rest (s)
                  </th>
                  <th className="py-2 px-3 text-right font-medium w-12"></th>
                </tr>
              </thead>
              <tbody>
                {exercise.sets.map((set, setIndex) => (
                  <tr key={setIndex} className="border-t">
                    <td className="py-2 px-3 pl-4 font-medium">{setIndex + 1}</td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        className="h-8 w-16 px-2"
                        value={set.weight ?? ''}
                        onChange={(e) =>
                          updateSet(exIndex, setIndex, 'weight', e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        className="h-8 w-16 px-2"
                        value={set.reps ?? ''}
                        onChange={(e) =>
                          updateSet(exIndex, setIndex, 'reps', e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        className="h-8 w-16 px-2"
                        value={set.restTime ?? ''}
                        onChange={(e) =>
                          updateSet(exIndex, setIndex, 'restTime', e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSet(exIndex, setIndex)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t bg-muted/10">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-primary hover:text-primary"
                onClick={() => addSet(exIndex)}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Set
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {exercises.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/10 text-muted-foreground">
          {emptyText}
        </div>
      )}

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
            ? 'Add sets and reps to this workout'
            : 'Replace exercise in this workout slot'
        }
        saveLabel={replaceExerciseIndex === null ? 'Save Exercise' : 'Replace Exercise'}
      />
    </div>
  )
}
