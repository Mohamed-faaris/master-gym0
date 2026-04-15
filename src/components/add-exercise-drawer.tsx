import * as React from 'react'
import { X } from 'lucide-react'
import { api } from '@convex/_generated/api'
import { useQuery } from 'convex/react'
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

export interface ExerciseSet {
  reps: number
  weight?: number
}

export interface ExerciseData {
  exerciseName: string
  sets: Array<ExerciseSet>
}

interface ExerciseFormDefaults {
  exerciseName: string
  sets: Array<{
    reps?: number
    weight?: number
  }>
}

interface AddExerciseDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ExerciseData) => Promise<void> | void
  initialData?: ExerciseFormDefaults | null
  title?: string
  description?: string
  saveLabel?: string
}

const scoreExerciseMatch = (exerciseName: string, query: string) => {
  const normalizedName = exerciseName.toLowerCase()
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) return Number.POSITIVE_INFINITY

  if (normalizedName === normalizedQuery) return 0
  if (normalizedName.startsWith(normalizedQuery)) return 1

  const wordIndex = normalizedName.indexOf(` ${normalizedQuery}`)
  if (wordIndex !== -1) return 2 + wordIndex / 100

  const includesIndex = normalizedName.indexOf(normalizedQuery)
  if (includesIndex !== -1) return 3 + includesIndex / 100

  const queryTokens = normalizedQuery.split(/\s+/)
  const tokenMatches = queryTokens.filter((token) =>
    normalizedName.includes(token),
  ).length
  if (tokenMatches > 0) return 10 - tokenMatches

  return Number.POSITIVE_INFINITY
}

const getExerciseSuggestions = (
  query: string,
  options: ReadonlyArray<string>,
  limit = 6,
) => {
  if (!query.trim()) {
    return [...options].slice(0, limit)
  }

  return options
    .map((exerciseName) => ({
      exerciseName,
      score: scoreExerciseMatch(exerciseName, query),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((entry) => entry.exerciseName)
}

export function AddExerciseDrawer({
  open,
  onOpenChange,
  onSave,
  initialData = null,
  title = 'Add Exercise for Today',
  description = 'Add sets and reps to your current day session',
  saveLabel = 'Save Exercise',
}: AddExerciseDrawerProps) {
  const exerciseNames = useQuery(api.exercises.getNames) ?? []
  const [exerciseName, setExerciseName] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)
  const exerciseInputRef = React.useRef<HTMLInputElement>(null)
  const suggestions = React.useMemo(
    () => getExerciseSuggestions(exerciseName, exerciseNames),
    [exerciseName, exerciseNames],
  )

  const resetForm = React.useCallback(() => {
    if (initialData) {
      setExerciseName(initialData.exerciseName)
      return
    }

    setExerciseName('')
  }, [initialData])

  const handleSave = async (nextExerciseName?: string) => {
    const resolvedExerciseName = (nextExerciseName ?? exerciseName).trim()

    if (!resolvedExerciseName) {
      throw new Error('Exercise name is required')
    }

    const data: ExerciseData = {
      exerciseName: resolvedExerciseName,
      sets: initialData?.sets.length
        ? initialData.sets.map((set) => ({
            reps: set.reps ?? 8,
            weight: set.weight,
          }))
        : [{ reps: 8 }],
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
    if (open) {
      requestAnimationFrame(() => {
        exerciseInputRef.current?.focus()
        exerciseInputRef.current?.select()
      })
      return
    }

    resetForm()
  }, [initialData, open, resetForm])

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
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Exercise</label>
            <Input
              ref={exerciseInputRef}
              value={exerciseName}
              onChange={(event) => setExerciseName(event.target.value)}
              placeholder="Search or type exercise name"
            />
            <div className="max-h-48 overflow-y-auto rounded-lg border">
              {suggestions.length > 0 ? (
                suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-3 text-left text-sm transition-colors hover:bg-accent"
                    disabled={isSaving}
                    onClick={() => {
                      setExerciseName(name)
                      void handleSave(name)
                    }}
                  >
                    <span>{name}</span>
                    {name.toLowerCase() === exerciseName.trim().toLowerCase() && (
                      <span className="text-xs text-muted-foreground">
                        Selected
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  No matches found.
                </p>
              )}
            </div>
          </div>

        </div>

        <DrawerFooter className="shrink-0 border-t bg-background">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : saveLabel}
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
