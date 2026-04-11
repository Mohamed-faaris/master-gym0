import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

interface ExerciseNameFieldProps {
  value: string
  onValueChange: (value: string) => void
  options: ReadonlyArray<string>
  placeholder?: string
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
  limit = 5,
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

export function ExerciseNameField({
  value,
  onValueChange,
  options,
  placeholder = 'Type exercise name',
}: ExerciseNameFieldProps) {
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const suggestions = React.useMemo(
    () => getExerciseSuggestions(value, options),
    [options, value],
  )
  const hasExactMatch = options.some(
    (exerciseName) => exerciseName.toLowerCase() === value.trim().toLowerCase(),
  )

  const handleSelect = (exerciseName: string) => {
    onValueChange(exerciseName)
    setOpen(false)
  }

  const handleUseTypedValue = () => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    onValueChange(trimmedValue)
    setOpen(false)
  }

  React.useEffect(() => {
    if (!open) return

    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [open])

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-11 w-full justify-start px-3 py-2 text-left font-normal"
        onClick={() => setOpen(true)}
      >
        <span
          className={value.trim() ? 'text-foreground' : 'text-muted-foreground'}
        >
          {value.trim() || placeholder}
        </span>
      </Button>

      <DrawerContent className="flex max-h-[85vh] flex-col">
        <DrawerHeader>
          <DrawerTitle>Select Exercise</DrawerTitle>
          <DrawerDescription>
            Search for an existing exercise or type a custom one.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Exercise</label>
            <Input
              ref={inputRef}
              placeholder="Search or type..."
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleUseTypedValue()
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Matches</p>
            <div className="max-h-56 overflow-y-auto rounded-lg border">
              {suggestions.length > 0 ? (
                suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-3 text-left text-sm transition-colors hover:bg-accent"
                    onClick={() => handleSelect(name)}
                  >
                    <span>{name}</span>
                    {name === value.trim() && (
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

        <DrawerFooter className="border-t bg-background">
          <Button
            type="button"
            onClick={handleUseTypedValue}
            disabled={!value.trim()}
          >
            {hasExactMatch ? 'Use selected exercise' : `Use "${value.trim()}"`}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
