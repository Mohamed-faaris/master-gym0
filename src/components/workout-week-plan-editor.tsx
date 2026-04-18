import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, Save, Target, Trash2 } from 'lucide-react'

import { WorkoutExerciseBuilder } from '@/components/workout-exercise-builder'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import {
  DAYS_OF_WEEK,
  ensureWorkoutDayPlans,
  type DayKey,
  type WorkoutDayPlan,
} from '@/lib/workout-plan-helpers'

type WorkoutWeekPlanEditorProps = {
  heading: string
  saveLabel?: string
  isSaving?: boolean
  plan: {
    name: string
    goal?: string
    notes?: string
    activeDays: Array<DayKey>
    dayPlans: Array<WorkoutDayPlan>
  }
  onBack: () => void
  onDelete: () => void
  onSave: (payload: {
    name: string
    goal?: string
    notes?: string
    activeDays: Array<DayKey>
    dayPlans: Array<WorkoutDayPlan>
  }) => void | Promise<void>
}

export function WorkoutWeekPlanEditor({
  heading,
  saveLabel = 'Save',
  isSaving = false,
  plan,
  onBack,
  onDelete,
  onSave,
}: WorkoutWeekPlanEditorProps) {
  const [name, setName] = useState(plan.name)
  const [goal, setGoal] = useState(plan.goal || '')
  const [notes, setNotes] = useState(plan.notes || '')
  const [activeDays, setActiveDays] = useState<Array<DayKey>>(plan.activeDays)
  const [dayPlans, setDayPlans] = useState<Array<WorkoutDayPlan>>(
    ensureWorkoutDayPlans(plan.activeDays, plan.dayPlans),
  )
  const [activeTab, setActiveTab] = useState<DayKey | ''>(plan.activeDays[0] || '')

  useEffect(() => {
    setName(plan.name)
    setGoal(plan.goal || '')
    setNotes(plan.notes || '')
    setActiveDays(plan.activeDays)
    setDayPlans(ensureWorkoutDayPlans(plan.activeDays, plan.dayPlans))
  }, [plan])

  useEffect(() => {
    setDayPlans((prev) => ensureWorkoutDayPlans(activeDays, prev))
    setActiveTab((prev) => {
      if (prev && activeDays.includes(prev as DayKey)) return prev
      return activeDays[0] || ''
    })
  }, [activeDays])

  const sortedDayPlans = useMemo(
    () => ensureWorkoutDayPlans(activeDays, dayPlans),
    [activeDays, dayPlans],
  )

  const toggleDay = (day: DayKey) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((entry) => entry !== day) : [...prev, day],
    )
  }

  const updateDayPlan = (day: DayKey, updater: (plan: WorkoutDayPlan) => WorkoutDayPlan) => {
    setDayPlans((prev) =>
      prev.map((entry) => (entry.day === day ? updater(entry) : entry)),
    )
  }

  return (
    <div className="space-y-4 pb-32">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">{heading}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button
            onClick={() =>
              onSave({
                name,
                goal: goal || undefined,
                notes: notes || undefined,
                activeDays,
                dayPlans: sortedDayPlans,
              })
            }
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saveLabel}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Week plan details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Strength Week A"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal</label>
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Upper/lower strength split"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Coach notes</label>
              <textarea
                className="w-full min-h-[110px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Progression notes, rest rules, warmup guidance."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Active days
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {DAYS_OF_WEEK.map((day) => {
                const isActive = activeDays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                      isActive
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

        {activeDays.length > 0 ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DayKey)}>
            <TabsList className="flex w-full flex-wrap gap-2 rounded-xl border bg-muted/30 p-2">
              {sortedDayPlans.map((dayPlan) => (
                <TabsTrigger
                  key={dayPlan.day}
                  value={dayPlan.day}
                  className="rounded-lg px-3 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {DAYS_OF_WEEK.find((day) => day.value === dayPlan.day)?.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContents>
              {sortedDayPlans.map((dayPlan) => (
                <TabsContent key={dayPlan.day} value={dayPlan.day} className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {DAYS_OF_WEEK.find((day) => day.value === dayPlan.day)?.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Focus</label>
                        <Input
                          value={dayPlan.focus || ''}
                          onChange={(e) =>
                            updateDayPlan(dayPlan.day, (entry) => ({
                              ...entry,
                              focus: e.target.value,
                            }))
                          }
                          placeholder="e.g. Push, Pull, Legs"
                        />
                      </div>
                      <WorkoutExerciseBuilder
                        exercises={dayPlan.exercises}
                        onChange={(exercises) =>
                          updateDayPlan(dayPlan.day, (entry) => ({
                            ...entry,
                            exercises,
                          }))
                        }
                        emptyText="No exercises for this day yet."
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </TabsContents>
          </Tabs>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/10 p-8 text-center text-muted-foreground">
            Select at least one active day to build week plan.
          </div>
        )}
      </div>
    </div>
  )
}
