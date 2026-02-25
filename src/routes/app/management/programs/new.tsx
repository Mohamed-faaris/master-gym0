import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Plus,
  Trash2,
} from 'lucide-react'
import { useMutation as useConvexMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { useAuth } from '@/components/auth/useAuth'
import { ExerciseNameField } from '@/components/exercise-name-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'

export const Route = createFileRoute('/app/management/programs/new')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    step: typeof search.step === 'number' ? search.step : undefined,
  }),
})

type SetEntry = {
  reps: string
  weight: string
  restTime: string
}

type ExerciseEntry = {
  exerciseName: string
  sets: SetEntry[]
}

type DayMeta = {
  title: string
  description: string
}

type ParsedSetEntry = {
  reps?: number
  weight?: number
  restTime?: number
}

const weekDays = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
] as const

type DayKey = (typeof weekDays)[number]['key']

const EXERCISE_NAMES = [
  // CHEST (8)
  'Barbell Bench Press',
  'Incline Dumbbell Press',
  'Decline Bench Press',
  'Dumbbell Fly',
  'Cable Chest Fly',
  'Push-Ups',
  'Dumbbell Pullover',
  'Smith Machine Bench Press',
  // BACK (8)
  'Lat Pulldown',
  'Pull-Ups / Assisted Pull-Ups',
  'Seated Cable Row',
  'Bent-Over Barbell Row',
  'One-Arm Dumbbell Row',
  'T-Bar Row',
  'Deadlift',
  'Straight-Arm Pulldown',
  // SHOULDERS (7)
  'Barbell Overhead Press',
  'Dumbbell Lateral Raise',
  'Front Raise',
  'Rear Delt Fly',
  'Arnold Press',
  'Upright Row',
  'Face Pull',
  // BICEPS (6)
  'Barbell Curl',
  'Dumbbell Curl',
  'Hammer Curl',
  'Preacher Curl',
  'Concentration Curl',
  'Cable Biceps Curl',
  // TRICEPS (6)
  'Cable Triceps Pushdown',
  'Skull Crushers',
  'Overhead Dumbbell Triceps Extension',
  'Bench Dips',
  'Close-Grip Bench Press',
  'Triceps Kickbacks',
  // LEGS (10)
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
  // CORE / ABS (5)
  'Hanging Leg Raises',
  'Cable Crunch',
  'Ab Wheel Rollout',
  'Plank',
  'Russian Twist',
] as const

const steps = [
  { key: 'details', label: 'Program details' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'workouts', label: 'Workouts' },
  { key: 'review', label: 'Review' },
]

const privilegedRoles = new Set(['trainer', 'admin'])

const createEmptySet = (): SetEntry => ({
  reps: '',
  weight: '',
  restTime: '',
})

const createEmptyExercise = (): ExerciseEntry => ({
  exerciseName: '',
  sets: [createEmptySet()],
})

const parseOptionalNumber = (
  rawValue: string,
  parser: (value: string) => number,
) => {
  const trimmedValue = rawValue.trim()
  if (!trimmedValue) return { value: undefined as number | undefined }

  const parsedValue = parser(trimmedValue)
  if (!Number.isFinite(parsedValue)) {
    return { error: true as const }
  }

  return { value: parsedValue }
}

const isSchemaValidationError = (message: string) =>
  /argumentvalidationerror|validation error|does not match|missing required|invalid value|expected|validator/i.test(
    message,
  )

const createEmptyWorkoutsByDay = (): Record<DayKey, ExerciseEntry[]> =>
  weekDays.reduce(
    (acc, day) => {
      acc[day.key] = []
      return acc
    },
    {} as Record<DayKey, ExerciseEntry[]>,
  )

const createEmptyDayMetaByDay = (): Record<DayKey, DayMeta> =>
  weekDays.reduce(
    (acc, day) => {
      acc[day.key] = { title: '', description: '' }
      return acc
    },
    {} as Record<DayKey, DayMeta>,
  )

type ProgramFormMode = 'create' | 'edit'

interface ProgramFormScreenProps {
  mode: ProgramFormMode
  programId?: Id<'trainingPlans'>
  initialStep?: number
}

function RouteComponent() {
  const search = Route.useSearch()
  return <ProgramFormScreen mode="create" initialStep={search.step} />
}

export function ProgramFormScreen({
  mode,
  programId,
  initialStep = 0,
}: ProgramFormScreenProps) {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()
  const createTrainingPlan = useConvexMutation(
    api.trainingPlans.createTrainingPlan,
  )
  const updateTrainingPlan = useConvexMutation(
    api.trainingPlans.updateTrainingPlan,
  )
  const trainingPlan = useQuery(
    api.trainingPlans.getTrainingPlanById,
    mode === 'edit' && programId ? { trainingPlanId: programId } : 'skip',
  )

  const [stepIndex, setStepIndex] = useState(() =>
    Math.min(Math.max(initialStep, 0), steps.length - 1),
  )
  const [planName, setPlanName] = useState('')
  const [durationWeeks, setDurationWeeks] = useState('')
  const [selectedDays, setSelectedDays] = useState<DayKey[]>([])
  const [activeWorkoutDay, setActiveWorkoutDay] = useState<DayKey | null>(null)
  const [workoutsByDay, setWorkoutsByDay] = useState<
    Record<DayKey, ExerciseEntry[]>
  >(() => createEmptyWorkoutsByDay())
  const [dayMetaByDay, setDayMetaByDay] = useState<Record<DayKey, DayMeta>>(
    () => createEmptyDayMetaByDay(),
  )
  const [didHydrateEditData, setDidHydrateEditData] = useState(
    mode === 'create',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* -------------------------------------------------------------------------- */
  /*                                 Auth Guard                                 */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      navigate({ to: '/' })
      return
    }
    if (!privilegedRoles.has(user.role)) {
      navigate({ to: '/app' })
    }
  }, [user, isLoading, navigate])

  useEffect(() => {
    if (mode !== 'edit' || !trainingPlan || didHydrateEditData) return

    setPlanName(trainingPlan.name)
    setDurationWeeks(String(trainingPlan.durationWeeks))

    const nextSelectedDays = trainingPlan.days.map((day) => day.day as DayKey)
    setSelectedDays(nextSelectedDays)

    const nextWorkoutsByDay = createEmptyWorkoutsByDay()
    const nextDayMetaByDay = createEmptyDayMetaByDay()

    trainingPlan.days.forEach((day) => {
      const key = day.day as DayKey
      nextDayMetaByDay[key] = {
        title: day.dayTitle ?? '',
        description: day.dayDescription ?? '',
      }
      nextWorkoutsByDay[key] =
        day.exercises.length > 0
          ? day.exercises.map((exercise) => ({
              exerciseName: exercise.exerciseName,
              sets:
                exercise.sets.length > 0
                  ? exercise.sets.map((setEntry) => ({
                      reps:
                        typeof setEntry.reps === 'number'
                          ? String(setEntry.reps)
                          : '',
                      weight:
                        typeof setEntry.weight === 'number'
                          ? String(setEntry.weight)
                          : '',
                      restTime:
                        typeof setEntry.restTime === 'number'
                          ? String(setEntry.restTime)
                          : '',
                    }))
                  : [createEmptySet()],
            }))
          : []
    })

    setWorkoutsByDay(nextWorkoutsByDay)
    setDayMetaByDay(nextDayMetaByDay)
    setDidHydrateEditData(true)
  }, [mode, trainingPlan, didHydrateEditData])

  useEffect(() => {
    if (selectedDays.length === 0) {
      setActiveWorkoutDay(null)
      return
    }
    const current = activeWorkoutDay
    if (!current || !selectedDays.includes(current)) {
      setActiveWorkoutDay(selectedDays[0])
    }
  }, [selectedDays, activeWorkoutDay])

  const progressValue = useMemo(
    () => ((stepIndex + 1) / steps.length) * 100,
    [stepIndex],
  )
  const topRightDestination =
    user?.role === 'admin' ? '/app/admin' : '/app/management'
  const topRightLabel =
    user?.role === 'admin' ? 'Admin dashboard' : 'Management home'

  const toggleDay = (dayKey: DayKey) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey)
        ? prev.filter((day) => day !== dayKey)
        : [...prev, dayKey],
    )
  }

  const addExercise = (dayKey: DayKey) => {
    setWorkoutsByDay((prev) => ({
      ...prev,
      [dayKey]: [...prev[dayKey], createEmptyExercise()],
    }))
  }

  const updateDayMeta = (
    dayKey: DayKey,
    field: keyof DayMeta,
    value: string,
  ) => {
    setDayMetaByDay((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }))
  }

  const removeExercise = (dayKey: DayKey, exerciseIndex: number) => {
    setWorkoutsByDay((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey].filter((_, index) => index !== exerciseIndex),
    }))
  }

  const updateExerciseName = (
    dayKey: DayKey,
    exerciseIndex: number,
    value: string,
  ) => {
    setWorkoutsByDay((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey].map((exercise, index) =>
        index === exerciseIndex
          ? { ...exercise, exerciseName: value }
          : exercise,
      ),
    }))
  }

  const addSet = (dayKey: DayKey, exerciseIndex: number) => {
    setWorkoutsByDay((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey].map((exercise, index) =>
        index === exerciseIndex
          ? { ...exercise, sets: [...exercise.sets, createEmptySet()] }
          : exercise,
      ),
    }))
  }

  const removeSet = (
    dayKey: DayKey,
    exerciseIndex: number,
    setIndex: number,
  ) => {
    setWorkoutsByDay((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey].map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets:
                exercise.sets.length > 1
                  ? exercise.sets.filter((_, idx) => idx !== setIndex)
                  : exercise.sets,
            }
          : exercise,
      ),
    }))
  }

  const updateSetField = (
    dayKey: DayKey,
    exerciseIndex: number,
    setIndex: number,
    field: keyof SetEntry,
    value: string,
  ) => {
    setWorkoutsByDay((prev) => ({
      ...prev,
      [dayKey]: prev[dayKey].map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((setEntry, idx) =>
                idx === setIndex ? { ...setEntry, [field]: value } : setEntry,
              ),
            }
          : exercise,
      ),
    }))
  }

  const getDayLabel = (dayKey: DayKey) =>
    weekDays.find((entry) => entry.key === dayKey)?.label || dayKey

  const validateStep = (currentStep: number) => {
    if (currentStep === 0) {
      if (!planName.trim()) {
        toast.error('Program name is required')
        return false
      }

      const parsedDuration = parseInt(durationWeeks, 10)
      if (!parsedDuration || parsedDuration < 1) {
        toast.error('Duration must be at least 1 day')
        return false
      }
    }

    if (currentStep === 1) {
      if (selectedDays.length === 0) {
        toast.error('Please select at least one workout day')
        return false
      }
    }

    if (currentStep === 2) {
      const unnamedExercises = selectedDays.flatMap((dayKey) => {
        const exercises = workoutsByDay[dayKey]
        return exercises
          .map((exercise, index) =>
            exercise.exerciseName.trim() === ''
              ? { dayKey, index: index + 1 }
              : null,
          )
          .filter(Boolean) as Array<{ dayKey: DayKey; index: number }>
      })

      if (unnamedExercises.length > 0) {
        const byDay = unnamedExercises.reduce<Record<string, Array<number>>>(
          (acc, entry) => {
            acc[entry.dayKey] = acc[entry.dayKey] || []
            acc[entry.dayKey].push(entry.index)
            return acc
          },
          {},
        )
        const message = Object.entries(byDay)
          .map(([dayKey, indexes]) => `${getDayLabel(dayKey as DayKey)} (ex ${indexes.join(', ')})`)
          .join(', ')
        toast.error(`Name all exercises before saving: ${message}`)
        return false
      }

      const emptyDays = selectedDays.filter((dayKey) => {
        const exercises = workoutsByDay[dayKey]
        return !exercises.some((exercise) => exercise.exerciseName.trim() !== '')
      })

      if (emptyDays.length > 0) {
        const missingLabels = emptyDays.map((dayKey) => getDayLabel(dayKey)).join(', ')
        toast.error(`Add at least one exercise for: ${missingLabels}`)
        return false
      }

      const exercisesWithoutSets = selectedDays.flatMap((dayKey) => {
        const exercises = workoutsByDay[dayKey]
        return exercises
          .map((exercise, index) =>
            exercise.exerciseName.trim() !== '' && exercise.sets.length === 0
              ? { dayKey, index: index + 1 }
              : null,
          )
          .filter(Boolean) as Array<{ dayKey: DayKey; index: number }>
      })

      if (exercisesWithoutSets.length > 0) {
        const message = exercisesWithoutSets
          .map(({ dayKey, index }) => `${getDayLabel(dayKey)} (ex ${index})`)
          .join(', ')
        toast.error(`Each exercise must have at least one set: ${message}`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error(
        mode === 'edit'
          ? 'You must be logged in to edit a program'
          : 'You must be logged in to create a program',
      )
      return
    }

    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      return
    }

    const parsedDuration = parseInt(durationWeeks, 10)

    const invalidSetEntries: Array<{ dayKey: DayKey; exerciseIndex: number }> =
      []
    const daysPayload = selectedDays.map((dayKey) => {
      const dayMeta = dayMetaByDay[dayKey]
      const exercises = workoutsByDay[dayKey]
        .filter((exercise) => exercise.exerciseName.trim() !== '')
        .map((exercise, exerciseIndex) => {
          const parsedSets: ParsedSetEntry[] = exercise.sets.map((setEntry) => {
            const reps = parseOptionalNumber(setEntry.reps, (value) =>
              parseInt(value, 10),
            )
            const weight = parseOptionalNumber(setEntry.weight, (value) =>
              parseFloat(value),
            )
            const restTime = parseOptionalNumber(setEntry.restTime, (value) =>
              parseInt(value, 10),
            )

            if (reps.error || weight.error || restTime.error) {
              invalidSetEntries.push({ dayKey, exerciseIndex: exerciseIndex + 1 })
            }

            return {
              reps: reps.value,
              weight: weight.value,
              restTime: restTime.value,
            }
          })

          return {
            exerciseName: exercise.exerciseName,
            noOfSets: exercise.sets.length,
            sets: parsedSets,
          }
        })
      return {
        day: dayKey,
        dayTitle: dayMeta.title.trim() || undefined,
        dayDescription: dayMeta.description.trim() || undefined,
        exercises,
      }
    })

    if (invalidSetEntries.length > 0) {
      const invalidMessage = invalidSetEntries
        .map(({ dayKey, exerciseIndex }) => {
          const label =
            weekDays.find((entry) => entry.key === dayKey)?.label || dayKey
          return `${label} (ex ${exerciseIndex})`
        })
        .join(', ')
      toast.error(`Invalid set values. Check schema fields: ${invalidMessage}`)
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'edit') {
        if (!programId) {
          toast.error('Program id is missing')
          return
        }
        await updateTrainingPlan({
          trainingPlanId: programId,
          name: planName,
          description: planName,
          days: daysPayload as any,
          durationWeeks: parsedDuration,
        })
        toast.success('Program updated successfully!')
      } else {
        await createTrainingPlan({
          name: planName,
          description: planName,
          days: daysPayload as any,
          durationWeeks: parsedDuration,
          createdBy: user._id,
        })
        toast.success('Program created successfully!')
      }
      navigate({ to: '/app/management/programs' })
    } catch (error) {
      console.error(
        mode === 'edit'
          ? 'Failed to update program:'
          : 'Failed to create program:',
        error,
      )
      const errorMessage =
        error instanceof Error ? error.message : 'Please try again.'
      if (isSchemaValidationError(errorMessage)) {
        toast.error(
          'Failed to save program. Please check schema fields and value types.',
        )
        return
      }
      toast.error(
        `${
          mode === 'edit'
            ? 'Failed to update program'
            : 'Failed to create program'
        }: ${errorMessage}`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1
  const isEditing = mode === 'edit'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (mode === 'edit' && trainingPlan === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading program...</p>
      </div>
    )
  }

  if (mode === 'edit' && trainingPlan === null) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card>
          <CardHeader>
            <CardTitle>Program not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/app/management/programs' })}
            >
              Back to programs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 pt-6 pb-4 space-y-4">
        <header className="space-y-3">
          <Link
            to="/app/management/programs"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to programs
          </Link>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Step {stepIndex + 1} of {steps.length}
            </span>
            {user && privilegedRoles.has(user.role) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: topRightDestination })}
              >
                {topRightLabel}
              </Button>
            )}
          </div>
        </header>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {isEditing ? 'Edit program' : 'Create program'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? 'Update this training plan with day-by-day exercises and sets.'
              : 'Build a training plan with day-by-day exercises and sets.'}
          </p>
          <Progress value={progressValue} />
        </div>

        <div className="grid w-full grid-cols-4 gap-2 text-xs text-muted-foreground">
          {steps.map((step, index) => (
            <button
              key={step.key}
              type="button"
              onClick={() => {
                if (index <= stepIndex) {
                  setStepIndex(index)
                  return
                }
                const canMoveForward = Array.from(
                  { length: index - stepIndex },
                  (_, offset) => stepIndex + offset,
                ).every((stepToValidate) => validateStep(stepToValidate))
                if (canMoveForward) {
                  setStepIndex(index)
                }
              }}
              className={cn(
                'w-full rounded-full border border-border px-3 text-center transition-colors',
                index === stepIndex
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 hover:bg-muted',
              )}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-36 space-y-4">
        {stepIndex === 0 && (
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Program details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Program name</label>
                <Input
                  placeholder="e.g. Strength Foundations"
                  value={planName}
                  onChange={(event) => setPlanName(event.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Duration (days)
                  </label>
                  <Input
                    type="number"
                    placeholder='e.g. 28'
                    min={1}
                    value={durationWeeks}
                    onChange={(event) => setDurationWeeks(event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stepIndex === 1 && (
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Schedule cadence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Workout days</label>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const isSelected = selectedDays.includes(day.key)
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => toggleDay(day.key)}
                        className={cn(
                          'rounded-lg border px-2 py-3 text-xs font-semibold uppercase transition',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground',
                        )}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pick the days this program should cover.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {stepIndex === 2 && (
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Workouts template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Build workouts for each selected day.
              </p>

              {selectedDays.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                  Select workout days first to add exercises.
                </div>
              ) : (
                <Tabs
                  value={activeWorkoutDay ?? undefined}
                  onValueChange={(value) =>
                    setActiveWorkoutDay(value as DayKey)
                  }
                  className="gap-4"
                >
                  <TabsList className="w-full flex-wrap">
                    {weekDays
                      .filter((day) => selectedDays.includes(day.key))
                      .map((day) => (
                        <TabsTrigger key={day.key} value={day.key}>
                          {day.label}
                        </TabsTrigger>
                      ))}
                  </TabsList>
                  <TabsContents>
                    {weekDays
                      .filter((day) => selectedDays.includes(day.key))
                      .map((day) => (
                        <TabsContent key={day.key} value={day.key}>
                          <div className="space-y-3">
                            <p className="text-sm font-semibold">{day.label}</p>

                            <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                              <div className="space-y-2">
                                <label className="text-xs font-medium uppercase text-muted-foreground">
                                  Day title
                                </label>
                                <Input
                                  placeholder="e.g. Lower body strength"
                                  value={dayMetaByDay[day.key].title}
                                  onChange={(event) =>
                                    updateDayMeta(
                                      day.key,
                                      'title',
                                      event.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>

                            {workoutsByDay[day.key].length === 0 ? (
                              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground">
                                No exercises yet for {day.label}.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {workoutsByDay[day.key].map(
                                  (exercise, index) => (
                                    <div
                                      key={`${day.key}-${index}`}
                                      className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">
                                          Exercise {index + 1}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removeExercise(day.key, index)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase text-muted-foreground">
                                          Exercise name
                                        </label>
                                        <ExerciseNameField
                                          value={exercise.exerciseName}
                                          options={EXERCISE_NAMES}
                                          onValueChange={(value) =>
                                            updateExerciseName(
                                              day.key,
                                              index,
                                              value,
                                            )
                                          }
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <label className="text-xs font-medium uppercase text-muted-foreground">
                                            Sets
                                          </label>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              addSet(day.key, index)
                                            }
                                          >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add set
                                          </Button>
                                        </div>
                                        <div className="space-y-2">
                                          {exercise.sets.map(
                                            (setEntry, setIndex) => (
                                              <div
                                                key={`${day.key}-${index}-${setIndex}`}
                                                className="rounded-xl border border-border bg-background p-3 space-y-2"
                                              >
                                                <div className="flex items-center justify-between">
                                                  <span className="text-xs font-semibold text-muted-foreground">
                                                    Set {setIndex + 1}
                                                  </span>
                                                  {exercise.sets.length > 1 && (
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() =>
                                                        removeSet(
                                                          day.key,
                                                          index,
                                                          setIndex,
                                                        )
                                                      }
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  )}
                                                </div>
                                                <div className="grid gap-2 sm:grid-cols-3">
                                                  <div className="space-y-1">
                                                    <label className="text-[10px] font-medium uppercase text-muted-foreground">
                                                      Reps
                                                    </label>
                                                    <Input
                                                      type="number"
                                                      min={0}
                                                      placeholder="8"
                                                      value={setEntry.reps}
                                                      onChange={(event) =>
                                                        updateSetField(
                                                          day.key,
                                                          index,
                                                          setIndex,
                                                          'reps',
                                                          event.target.value,
                                                        )
                                                      }
                                                    />
                                                  </div>
                                                  <div className="space-y-1">
                                                    <label className="text-[10px] font-medium uppercase text-muted-foreground">
                                                      Weight
                                                    </label>
                                                    <Input
                                                      type="number"
                                                      min={0}
                                                      placeholder="60"
                                                      value={setEntry.weight}
                                                      onChange={(event) =>
                                                        updateSetField(
                                                          day.key,
                                                          index,
                                                          setIndex,
                                                          'weight',
                                                          event.target.value,
                                                        )
                                                      }
                                                    />
                                                  </div>
                                                  <div className="space-y-1">
                                                    <label className="text-[10px] font-medium uppercase text-muted-foreground">
                                                      Rest (sec)
                                                    </label>
                                                    <Input
                                                      type="number"
                                                      min={0}
                                                      placeholder="60"
                                                      value={setEntry.restTime}
                                                      onChange={(event) =>
                                                        updateSetField(
                                                          day.key,
                                                          index,
                                                          setIndex,
                                                          'restTime',
                                                          event.target.value,
                                                        )
                                                      }
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => addExercise(day.key)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add exercise
                            </Button>
                          </div>
                        </TabsContent>
                      ))}
                  </TabsContents>
                </Tabs>
              )}
            </CardContent>
          </Card>
        )}

        {stepIndex === 3 && (
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-semibold">Program summary</p>
                <p className="text-sm text-muted-foreground">
                  {planName || 'Untitled program'} · {durationWeeks || '--'}{' '}
                  days
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-semibold">Schedule</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDays.length
                    ? selectedDays
                        .map(
                          (day) =>
                            weekDays.find((entry) => entry.key === day)?.label,
                        )
                        .join(', ')
                    : 'No days selected yet'}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold">Workouts snapshot</p>
                {selectedDays.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No days selected yet.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {weekDays
                      .filter((day) => selectedDays.includes(day.key))
                      .map((day) => (
                        <div key={day.key} className="space-y-2">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            {day.label}
                          </p>
                          {dayMetaByDay[day.key].title && (
                            <p className="text-sm font-medium">
                              {dayMetaByDay[day.key].title}
                            </p>
                          )}
                          {workoutsByDay[day.key].length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No exercises yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {workoutsByDay[day.key].map((exercise, index) => (
                                <div
                                  key={`${day.key}-summary-${index}`}
                                  className="text-sm"
                                >
                                  <span className="font-medium">
                                    {exercise.exerciseName || 'Untitled'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {' '}
                                    · {exercise.sets.length} sets
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      <div className="fixed inset-x-0 z-50 bottom-[calc(4rem+env(safe-area-inset-bottom))] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto w-full max-w-screen-sm px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
              disabled={isFirstStep || isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (isLastStep) {
                  handleSubmit()
                } else if (validateStep(stepIndex)) {
                  setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
                }
              }}
              disabled={isSubmitting}
            >
              {isLastStep
                ? isSubmitting
                  ? isEditing
                    ? 'Saving changes...'
                    : 'Saving...'
                  : isEditing
                    ? 'Save changes'
                    : 'Save Program'
                : 'Continue'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
