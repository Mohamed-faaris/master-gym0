import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Droplets,
  UtensilsCrossed,
  ArrowLeft,
} from 'lucide-react'
import { useMutation as useConvexMutation } from 'convex/react'
import { useAuth } from '@/components/auth/useAuth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { api } from '@convex/_generated/api'
import { Link } from '@tanstack/react-router'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'

export const Route = createFileRoute('/app/management/diet-plans/new')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    step: typeof search.step === 'number' ? search.step : undefined,
  }),
})

type MealEntry = {
  title: string
  description: string
  calories: string
}

type MealType =
  | 'breakfast'
  | 'middaySnack'
  | 'lunch'
  | 'preWorkout'
  | 'postWorkout'

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  middaySnack: 'Midday Snack',
  lunch: 'Lunch',
  preWorkout: 'Pre-workout',
  postWorkout: 'Post-workout',
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

const steps = [
  { key: 'details', label: 'Plan details' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'meals', label: 'Meals' },
  { key: 'review', label: 'Review' },
]

const privilegedRoles = new Set(['trainer', 'admin'])

function RouteComponent() {
  const navigate = useNavigate({ from: '/app/management/diet-plans/new' })
  const { user, isLoading } = useAuth()
  const createDietPlan = useConvexMutation(api.dietPlans.createDietPlan)

  const search = Route.useSearch()
  const stepIndex = Math.min(Math.max(search.step ?? 0, 0), steps.length - 1)
  const [planName, setPlanName] = useState('')
  const [goal, setGoal] = useState('')
  const [durationDays, setDurationDays] = useState('4')
  const [selectedDays, setSelectedDays] = useState<DayKey[]>([])
  const [activeMealDay, setActiveMealDay] = useState<DayKey | null>(null)
  const [calorieTarget, setCalorieTarget] = useState('')
  const [hydrationTarget, setHydrationTarget] = useState('')
  const [coachNote, setCoachNote] = useState('')
  const createEmptyDayMeals = (): Record<MealType, MealEntry> => ({
    breakfast: { title: '', description: '', calories: '' },
    middaySnack: { title: '', description: '', calories: '' },
    lunch: { title: '', description: '', calories: '' },
    preWorkout: { title: '', description: '', calories: '' },
    postWorkout: { title: '', description: '', calories: '' },
  })

  const [mealsByDay, setMealsByDay] = useState<
    Record<DayKey, Record<MealType, MealEntry>>
  >(() =>
    weekDays.reduce(
      (acc, day) => {
        acc[day.key] = createEmptyDayMeals()
        return acc
      },
      {} as Record<DayKey, Record<MealType, MealEntry>>,
    ),
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
      navigate({ to: '/app/management' })
    }
  }, [user, isLoading, navigate])

  const progressValue = useMemo(
    () => ((stepIndex + 1) / steps.length) * 100,
    [stepIndex],
  )

  useEffect(() => {
    if (selectedDays.length === 0) {
      setActiveMealDay(null)
      return
    }
    if (!activeMealDay || !selectedDays.includes(activeMealDay)) {
      setActiveMealDay(selectedDays[0])
    }
  }, [selectedDays, activeMealDay])

  const getDayLabel = (dayKey: DayKey) =>
    weekDays.find((entry) => entry.key === dayKey)?.label || dayKey

  const toggleDay = (dayKey: DayKey) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey)
        ? prev.filter((day) => day !== dayKey)
        : [...prev, dayKey],
    )
  }

  const validateStep = (currentStep: number) => {
    if (currentStep === 0) {
      if (!planName.trim()) {
        toast.error('Plan name is required')
        return false
      }
      const parsedDuration = parseInt(durationDays, 10)
      if (!parsedDuration || parsedDuration < 1) {
        toast.error('Duration must be at least 1 day')
        return false
      }
    }

    if (currentStep === 1) {
      if (selectedDays.length === 0) {
        toast.error('Please select at least one active day')
        return false
      }
    }

    if (currentStep === 2) {
      const missingDays = selectedDays.filter((dayKey) => {
        const mealsForDay = mealsByDay[dayKey]
        return !Object.values(mealsForDay).some(
          (meal) => meal.title.trim() !== '',
        )
      })

      if (missingDays.length > 0) {
        const missingLabels = missingDays.map((day) => getDayLabel(day)).join(', ')
        toast.error(`Add at least one meal for: ${missingLabels}`)
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to create a diet plan')
      return
    }

    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      return
    }

    // Convert meals to array format for backend
    const mealTemplate = selectedDays.flatMap((dayKey) => {
      const mealsForDay = mealsByDay[dayKey as DayKey]
      return Object.entries(mealsForDay)
        .filter(([_, meal]) => meal.title.trim() !== '')
        .map(([mealType, meal]) => ({
          day: dayKey as any,
          mealType: mealType as any,
          title: meal.title,
          description: meal.description,
          calories: parseFloat(meal.calories) || 0,
        }))
    })

    setIsSubmitting(true)

    try {
      await createDietPlan({
        name: planName,
        description: planName,
        goal: goal || undefined,
        durationDays: parseInt(durationDays) || undefined,
        activeDays: selectedDays as any,
        dailyCalorieTarget: calorieTarget
          ? parseFloat(calorieTarget)
          : undefined,
        hydrationTarget: hydrationTarget || undefined,
        coachNote: coachNote || undefined,
        mealTemplate: mealTemplate as any,
        createdBy: user._id,
      })

      toast.success('Diet plan created successfully!')
      navigate({ to: '/app/management/diet-plans' })
    } catch (error) {
      console.error('Failed to create diet plan:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Please try again.'
      toast.error(`Failed to create diet plan: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 pt-6 pb-4 space-y-4">
        <header className="space-y-3">
          <Link
            to="/app/management/diet-plans"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to diet plans
          </Link>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Step {stepIndex + 1} of {steps.length}
            </span>
          </div>
        </header>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Create diet plan</h1>
          <p className="text-sm text-muted-foreground">
            Build a multi-day meal template in a few focused steps.
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
                  navigate({
                    search: (prev) => ({ ...prev, step: index }),
                  })
                  return
                }

                const canMoveForward = Array.from(
                  { length: index - stepIndex },
                  (_, offset) => stepIndex + offset,
                ).every((stepToValidate) => validateStep(stepToValidate))

                if (canMoveForward) {
                  navigate({
                    search: (prev) => ({ ...prev, step: index }),
                  })
                }
              }}
              className={cn(
                'w-full rounded-full border border-border px-3 py-1 text-center transition-colors',
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
                Plan details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Plan name</label>
                <Input
                  placeholder="e.g. Lean strength cut"
                  value={planName}
                  onChange={(event) => setPlanName(event.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary goal</label>
                  <Input
                    placeholder="e.g. Fat loss with energy"
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Duration (days)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={durationDays}
                    onChange={(event) => setDurationDays(event.target.value)}
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
                <label className="text-sm font-medium">Active days</label>
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
                  Pick the days this template should cover.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Daily calorie target
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 2100"
                    value={calorieTarget}
                    onChange={(event) => setCalorieTarget(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Hydration target
                  </label>
                  <Input
                    placeholder="e.g. 3.5 L"
                    value={hydrationTarget}
                    onChange={(event) => setHydrationTarget(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Coach guidance</label>
                <textarea
                  className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Macro notes, timing rules, or fueling reminders."
                  value={coachNote}
                  onChange={(event) => setCoachNote(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {stepIndex === 2 && (
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Meals template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Build meal templates for each active day.
              </p>

              {selectedDays.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                  Select active days first to add meals per day.
                </div>
              ) : (
                <Tabs
                  value={activeMealDay ?? undefined}
                  onValueChange={(value) => setActiveMealDay(value as DayKey)}
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
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">{day.label}</p>
                              <span className="text-xs text-muted-foreground">
                                Daily template
                              </span>
                            </div>

                            <div className="space-y-4">
                              {(Object.keys(mealsByDay[day.key]) as MealType[]).map(
                                (mealType) => (
                                  <div
                                    key={`${day.key}-${mealType}`}
                                    className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold">
                                        {mealTypeLabels[mealType]}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Template entry
                                      </span>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium uppercase text-muted-foreground">
                                        Meal title
                                      </label>
                                      <Input
                                        placeholder="e.g. Protein oats"
                                        value={mealsByDay[day.key][mealType].title}
                                        onChange={(event) =>
                                          setMealsByDay((prev) => ({
                                            ...prev,
                                            [day.key]: {
                                              ...prev[day.key],
                                              [mealType]: {
                                                ...prev[day.key][mealType],
                                                title: event.target.value,
                                              },
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium uppercase text-muted-foreground">
                                        Description
                                      </label>
                                      <textarea
                                        className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                        placeholder="Ingredients, timing, or portion notes."
                                        value={mealsByDay[day.key][mealType].description}
                                        onChange={(event) =>
                                          setMealsByDay((prev) => ({
                                            ...prev,
                                            [day.key]: {
                                              ...prev[day.key],
                                              [mealType]: {
                                                ...prev[day.key][mealType],
                                                description: event.target.value,
                                              },
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-medium uppercase text-muted-foreground">
                                        Calories
                                      </label>
                                      <Input
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        value={mealsByDay[day.key][mealType].calories}
                                        onChange={(event) =>
                                          setMealsByDay((prev) => ({
                                            ...prev,
                                            [day.key]: {
                                              ...prev[day.key],
                                              [mealType]: {
                                                ...prev[day.key][mealType],
                                                calories: event.target.value,
                                              },
                                            },
                                          }))
                                        }
                                      />
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
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
                <Droplets className="h-5 w-5 text-primary" />
                Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-semibold">Plan summary</p>
                <p className="text-sm text-muted-foreground">
                  {planName || 'Untitled plan'} · {durationDays || '--'} days
                </p>
                <p className="text-sm text-muted-foreground">
                  {goal || 'No primary goal yet'}
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
                <p className="text-sm text-muted-foreground">
                  Calories: {calorieTarget || '--'} · Hydration:{' '}
                  {hydrationTarget || '--'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {coachNote || 'Add optional coaching notes.'}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold">Meals snapshot</p>
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
                          <div className="grid gap-2">
                            {(
                              Object.keys(mealsByDay[day.key]) as MealType[]
                            ).map((mealType) => (
                              <div key={`${day.key}-${mealType}`}>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">
                                  {mealTypeLabels[mealType]}
                                </p>
                                <p className="text-sm">
                                  {mealsByDay[day.key][mealType].title ||
                                    'No title yet'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {mealsByDay[day.key][mealType].description ||
                                    'Add meal notes.'}
                                </p>
                              </div>
                            ))}
                          </div>
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
              onClick={() =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    step: Math.max(stepIndex - 1, 0),
                  }),
                })
              }
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
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      step: Math.min(stepIndex + 1, steps.length - 1),
                    }),
                  })
                }
              }}
              disabled={isSubmitting}
            >
              {isLastStep
                ? isSubmitting
                  ? 'Saving...'
                  : 'Save Plan'
                : 'Continue'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
