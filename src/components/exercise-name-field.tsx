import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const hasValue = value.trim().length > 0
  const suggestions = React.useMemo(
    () => getExerciseSuggestions(value, options),
    [options, value],
  )

  return (
    <div className="space-y-2">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />

      {hasValue && (
        <div className="rounded-md border border-border bg-background p-2">
          {suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No close match found. Using custom value:{' '}
              <span className="font-medium text-foreground">{value}</span>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((name) => (
                <Button
                  key={name}
                  type="button"
                  variant={name === value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onValueChange(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
