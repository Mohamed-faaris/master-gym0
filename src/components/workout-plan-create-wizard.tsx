import { useEffect, useMemo, useState } from 'react'
import { useMutation } from 'convex/react'
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Target,
  Trophy,
} from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { WorkoutExerciseBuilder } from '@/components/workout-exercise-builder'
import {
  DAYS_OF_WEEK,
  ensureWorkoutDayPlans,
  type DayKey,
  type WorkoutDayPlan,
} from '@/lib/workout-plan-helpers'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'

type WorkoutPlanCreateWizardProps = {
  mode: 'routine' | 'weekPlan'
  authorId: string
  scope: 'all' | 'trainer_clients' | 'single_client'
  userId?: string
  onBack: () => void
  onCreated: (result: { kind: 'routine' | 'weekPlan'; id: string }) => void
}

export function WorkoutPlanCreateWizard({
  mode,
  authorId,
  scope,
  userId,
  onBack,
  onCreated,
}: WorkoutPlanCreateWizardProps) {
  const createRoutine = useMutation(api.routines.createRoutine)
  const createWorkoutWeekPlan = useMutation(
    api.workoutWeekPlans.createWorkoutWeekPlan,
  )

  const isWeekPlan = mode === 'weekPlan'
  const steps = isWeekPlan
    ? ['details', 'schedule', 'workouts', 'review']
    : ['details', 'workout', 'review']
  const [stepIndex, setStepIndex] = useState(0)

  const [name, setName] = useState('')
  const [focus, setFocus] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState<DayKey | ''>('')
  const [routineExercises, setRoutineExercises] = useState<WorkoutDayPlan['exercises']>(
    [],
  )

  const [goal, setGoal] = useState('')
  const [notes, setNotes] = useState('')
  const [activeDays, setActiveDays] = useState<Array<DayKey>>([])
  const [dayPlans, setDayPlans] = useState<Array<WorkoutDayPlan>>([])
  const [activeWeekDay, setActiveWeekDay] = useState<DayKey | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setDayPlans((prev) => ensureWorkoutDayPlans(activeDays, prev))
    setActiveWeekDay((prev) => {
      if (prev && activeDays.includes(prev as DayKey)) return prev
      return activeDays[0] || ''
    })
  }, [activeDays])

  const progressValue = useMemo(
    () => ((stepIndex + 1) / steps.length) * 100,
    [stepIndex, steps.length],
  )

  const toggleDay = (day: DayKey) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((entry) => entry !== day) : [...prev, day],
    )
  }

  const updateWeekDayPlan = (
    day: DayKey,
    updater: (plan: WorkoutDayPlan) => WorkoutDayPlan,
  ) => {
    setDayPlans((prev) =>
      prev.map((entry) => (entry.day === day ? updater(entry) : entry)),
    )
  }

  const validateStep = (index: number) => {
    if (index === 0 && !name.trim()) {
      toast.error(`${isWeekPlan ? 'Week plan' : 'Routine'} name is required`)
      return false
    }

    if (isWeekPlan && index === 1 && activeDays.length === 0) {
      toast.error('Select at least one active day')
      return false
    }

    if (isWeekPlan && index === 2) {
      const missing = ensureWorkoutDayPlans(activeDays, dayPlans).filter(
        (plan) => plan.exercises.length === 0,
      )
      if (missing.length > 0) {
        toast.error('Add at least one exercise for each active day')
        return false
      }
    }

    return true
  }

  const handleNextStep = () => {
    if (stepIndex >= steps.length - 1) return
    if (!validateStep(stepIndex)) return
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePreviousStep = () => {
    if (stepIndex === 0) return
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    if (!validateStep(0)) return
    if (isWeekPlan && (!validateStep(1) || !validateStep(2))) return

    setIsSubmitting(true)
    try {
      if (isWeekPlan) {
        const planId = await createWorkoutWeekPlan({
          name,
          authorId: authorId as any,
          userId: userId as any,
          scope,
          goal: goal || undefined,
          notes: notes || undefined,
          activeDays: activeDays as any,
          dayPlans: ensureWorkoutDayPlans(activeDays, dayPlans) as any,
        })
        toast.success('Week plan created')
        onCreated({ kind: 'weekPlan', id: planId })
        return
      }

      const routineId = await createRoutine({
        name,
        userId: userId as any,
        authorId: authorId as any,
        type: userId ? 'custom' : 'trainer',
        scope,
        dayOfWeek: (dayOfWeek || undefined) as any,
        focus: focus || undefined,
        exercises: routineExercises as any,
      })
      toast.success('Routine created')
      onCreated({ kind: 'routine', id: routineId })
    } catch (error) {
      console.error(error)
      toast.error('Failed to create workout plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 pt-6 pb-4 space-y-4">
        <header className="space-y-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Step {stepIndex + 1} of {steps.length}
            </span>
          </div>
        </header>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            Create {isWeekPlan ? 'workout week plan' : 'routine'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isWeekPlan
              ? 'Build full weekly training structure in focused steps.'
              : 'Build single workout routine with same guided flow.'}
          </p>
          <Progress value={progressValue} />
        </div>

        <div
          className={`grid w-full gap-2 text-xs text-muted-foreground ${
            isWeekPlan ? 'grid-cols-4' : 'grid-cols-3'
          }`}
        >
          {steps.map((step, index) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                if (index <= stepIndex) {
                  setStepIndex(index)
                  return
                }

                const canAdvance = Array.from(
                  { length: index - stepIndex },
                  (_, offset) => stepIndex + offset,
                ).every((currentIndex) => validateStep(currentIndex))

                if (canAdvance) setStepIndex(index)
              }}
              className={`w-full rounded-full border px-3 py-1 text-center transition-colors ${
                index === stepIndex
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/40 hover:bg-muted'
              }`}
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-36 space-y-4 max-w-4xl mx-auto">
        {stepIndex === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                {isWeekPlan ? 'Plan details' : 'Routine details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    isWeekPlan ? 'e.g. Strength Week A' : 'e.g. Push Day'
                  }
                />
              </div>

              {isWeekPlan ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Goal</label>
                    <Input
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g. 4-day upper/lower progression"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Coach notes</label>
                    <textarea
                      className="w-full min-h-[110px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Progression notes, RPE targets, rest guidance."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Focus</label>
                    <Input
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      placeholder="e.g. Chest + triceps"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Day of week</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value as DayKey | '')}
                    >
                      <option value="">Flexible</option>
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {isWeekPlan && stepIndex === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {DAYS_OF_WEEK.map((day) => {
                  const selected = activeDays.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {day.label.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {!isWeekPlan && stepIndex === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Workout builder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkoutExerciseBuilder
                exercises={routineExercises}
                onChange={setRoutineExercises}
              />
            </CardContent>
          </Card>
        )}

        {isWeekPlan && stepIndex === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Daily workouts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeDays.length > 0 ? (
                <Tabs
                  value={activeWeekDay || undefined}
                  onValueChange={(value) => setActiveWeekDay(value as DayKey)}
                  className="gap-4"
                >
                  <TabsList className="w-full flex-wrap">
                    {ensureWorkoutDayPlans(activeDays, dayPlans).map((plan) => (
                      <TabsTrigger key={plan.day} value={plan.day}>
                        {DAYS_OF_WEEK.find((day) => day.value === plan.day)?.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContents>
                    {ensureWorkoutDayPlans(activeDays, dayPlans).map((plan) => (
                      <TabsContent key={plan.day} value={plan.day}>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Focus</label>
                            <Input
                              value={plan.focus || ''}
                              onChange={(e) =>
                                updateWeekDayPlan(plan.day, (entry) => ({
                                  ...entry,
                                  focus: e.target.value,
                                }))
                              }
                              placeholder="e.g. Pull, Legs, Conditioning"
                            />
                          </div>
                          <WorkoutExerciseBuilder
                            exercises={plan.exercises}
                            onChange={(exercises) =>
                              updateWeekDayPlan(plan.day, (entry) => ({
                                ...entry,
                                exercises,
                              }))
                            }
                            emptyText="No exercises for this day yet."
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </TabsContents>
                </Tabs>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/10 p-8 text-center text-muted-foreground">
                  Select active days first.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {stepIndex === steps.length - 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                <p className="font-semibold">{name || 'Unnamed plan'}</p>
                {isWeekPlan ? (
                  <>
                    {goal && <p className="text-muted-foreground">{goal}</p>}
                    <p>{activeDays.length} active days</p>
                    <p>
                      {ensureWorkoutDayPlans(activeDays, dayPlans).reduce(
                        (sum, plan) => sum + plan.exercises.length,
                        0,
                      )}{' '}
                      exercises across week
                    </p>
                  </>
                ) : (
                  <>
                    {focus && <p className="text-muted-foreground">{focus}</p>}
                    <p>{routineExercises.length} exercises in routine</p>
                    {dayOfWeek && (
                      <p>
                        Suggested day:{' '}
                        {DAYS_OF_WEEK.find((day) => day.value === dayOfWeek)?.label}
                      </p>
                    )}
                  </>
                )}
              </div>
              {!isWeekPlan && (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Creating...' : 'Create Routine'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {isWeekPlan && (
          <div className="sticky bottom-4 z-10">
            <Card className="border-border/80 bg-background/95 backdrop-blur">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={stepIndex === 0 || isSubmitting}
                >
                  Previous
                </Button>

                {stepIndex < steps.length - 1 ? (
                  <Button type="button" onClick={handleNextStep}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Week Plan'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
