import * as React from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'

const EXERCISE_NAMES = [
  'Barbell Bench Press',
  'Incline Dumbbell Press',
  'Decline Bench Press',
  'Dumbbell Fly',
  'Cable Chest Fly',
  'Push-Ups',
  'Dumbbell Pullover',
  'Smith Machine Bench Press',
  'Lat Pulldown',
  'Pull-Ups / Assisted Pull-Ups',
  'Seated Cable Row',
  'Bent-Over Barbell Row',
  'One-Arm Dumbbell Row',
  'T-Bar Row',
  'Deadlift',
  'Straight-Arm Pulldown',
  'Barbell Overhead Press',
  'Dumbbell Lateral Raise',
  'Front Raise',
  'Rear Delt Fly',
  'Arnold Press',
  'Upright Row',
  'Face Pull',
  'Barbell Curl',
  'Dumbbell Curl',
  'Hammer Curl',
  'Preacher Curl',
  'Concentration Curl',
  'Cable Biceps Curl',
  'Cable Triceps Pushdown',
  'Skull Crushers',
  'Overhead Dumbbell Triceps Extension',
  'Bench Dips',
  'Close-Grip Bench Press',
  'Triceps Kickbacks',
  'Barbell Squat',
  'Leg Press',
  'Walking Lunges',
  'Leg Extension',
  'Leg Curl',
  'Romanian Deadlift',
  'Standing Calf Raises',
  'Seated Calf Raises',
  'Bulgarian Split Squat',
  'Hack Squat',
  'Hanging Leg Raises',
  'Cable Crunch',
  'Ab Wheel Rollout',
  'Plank',
  'Russian Twist',
] as const

export interface ExerciseSet {
  reps: number
  weight?: number
}

export interface ExerciseData {
  exerciseName: string
  sets: Array<ExerciseSet>
}

interface AddExerciseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ExerciseData) => Promise<void> | void
}

export function AddExerciseDrawer({
  open,
  onOpenChange,
  onSave,
}: AddExerciseDrawerProps) {
  const [exerciseName, setExerciseName] = React.useState('')
  const [setReps, setSetReps] = React.useState([''])
  const [setWeights, setSetWeights] = React.useState([''])
  const [isSaving, setIsSaving] = React.useState(false)

  const resetForm = React.useCallback(() => {
    setExerciseName('')
    setSetReps([''])
    setSetWeights([''])
  }, [])

  const handleAddSet = () => {
    setSetReps((prev) => [...prev, ''])
    setSetWeights((prev) => [...prev, ''])
  }

  const handleRemoveSet = (index: number) => {
    if (setReps.length <= 1) return
    setSetReps((prev) => prev.filter((_, i) => i !== index))
    setSetWeights((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (
      !EXERCISE_NAMES.includes(exerciseName as (typeof EXERCISE_NAMES)[number])
    ) {
      throw new Error('Select an exercise from the list')
    }

    const repsValues = setReps.map((reps, index) => {
      const parsedReps = Number.parseInt(reps, 10)
      if (Number.isNaN(parsedReps) || parsedReps <= 0) {
        throw new Error(`Set ${index + 1} reps must be a positive number`)
      }
      return parsedReps
    })

    const weightValues = setWeights.map((weight) => {
      const trimmedWeight = weight.trim()
      if (!trimmedWeight) return undefined
      const parsedWeight = Number.parseFloat(trimmedWeight)
      if (Number.isNaN(parsedWeight) || parsedWeight < 0) {
        throw new Error('Weight must be a non-negative number')
      }
      return parsedWeight
    })

    const data: ExerciseData = {
      exerciseName,
      sets: repsValues.map((reps, index) => ({
        reps,
        weight: weightValues[index],
      })),
    }

    setIsSaving(true)
    try {
      await onSave(data)
      onOpenChange(false)
      resetForm()
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    resetForm()
  }

  React.useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm])

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[85vh] flex-col">
        <DrawerHeader className="shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
          <DrawerTitle>Add Exercise for Today</DrawerTitle>
          <DrawerDescription>
            Add sets and reps to your current day session
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Exercise</label>
            <Input
              list="add-exercise-options"
              value={exerciseName}
              onChange={(event) => setExerciseName(event.target.value)}
              placeholder="Search and select exercise"
            />
            <datalist id="add-exercise-options">
              {EXERCISE_NAMES.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Set Details</p>
            {setReps.map((reps, index) => (
              <div key={index} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">
                    Set {index + 1}
                  </p>
                  {setReps.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveSet(index)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Reps
                    </label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g. 10"
                      value={reps}
                      onChange={(event) => {
                        const updatedReps = [...setReps]
                        updatedReps[index] = event.target.value
                        setSetReps(updatedReps)
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Weight (kg)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      placeholder="Optional"
                      value={setWeights[index] ?? ''}
                      onChange={(event) => {
                        const updatedWeights = [...setWeights]
                        updatedWeights[index] = event.target.value
                        setSetWeights(updatedWeights)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAddSet}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Set
            </Button>
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t bg-background">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Exercise'}
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
