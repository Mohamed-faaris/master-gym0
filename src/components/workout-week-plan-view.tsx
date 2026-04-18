import { Link } from '@tanstack/react-router'
import { CalendarDays, ChevronLeft, Play, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import { DAYS_OF_WEEK } from '@/lib/workout-plan-helpers'

type WorkoutWeekPlanViewProps = {
  title: string
  backTo: string
  backParams?: Record<string, string>
  plan: {
    _id: string
    name: string
    goal?: string
    notes?: string
    activeDays: string[]
    dayPlans: Array<{
      day: string
      focus?: string
      exercises: Array<{
        exerciseName: string
        sets: Array<{
          reps?: number
          weight?: number
          restTime?: number
        }>
      }>
    }>
  }
}

export function WorkoutWeekPlanView({
  title,
  backTo,
  backParams,
  plan,
}: WorkoutWeekPlanViewProps) {
  return (
    <div className="space-y-4 pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={backTo as any} params={backParams as any}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      </div>

      <div className="px-4 space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan.goal ? (
              <div className="flex items-start gap-2 text-sm">
                <Target className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Goal</p>
                  <p className="text-muted-foreground">{plan.goal}</p>
                </div>
              </div>
            ) : null}

            <div className="flex items-start gap-2 text-sm">
              <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Active days</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {plan.activeDays.map((day) => (
                    <span
                      key={day}
                      className="rounded-full border px-2 py-1 text-xs text-muted-foreground"
                    >
                      {DAYS_OF_WEEK.find((entry) => entry.value === day)?.label || day}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {plan.notes ? (
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm font-medium">Coach notes</p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Tabs defaultValue={plan.dayPlans[0]?.day} className="gap-4">
          <TabsList className="w-full flex-wrap">
            {plan.dayPlans.map((dayPlan) => (
              <TabsTrigger key={dayPlan.day} value={dayPlan.day}>
                {DAYS_OF_WEEK.find((day) => day.value === dayPlan.day)?.label ||
                  dayPlan.day}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContents>
            {plan.dayPlans.map((dayPlan) => (
              <TabsContent key={dayPlan.day} value={dayPlan.day}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {DAYS_OF_WEEK.find((day) => day.value === dayPlan.day)?.label ||
                        dayPlan.day}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link
                      to="/app/workout-session"
                      search={{
                        routineId: undefined,
                        weekPlanId: plan._id,
                        day: dayPlan.day,
                      }}
                      className="block"
                    >
                      <Button className="w-full gap-2">
                        <Play className="h-4 w-4" />
                        Start workout
                      </Button>
                    </Link>

                    {dayPlan.focus ? (
                      <div className="text-sm">
                        <p className="font-medium">Focus</p>
                        <p className="text-muted-foreground">{dayPlan.focus}</p>
                      </div>
                    ) : null}

                    {dayPlan.exercises.length > 0 ? (
                      <div className="space-y-3">
                        {dayPlan.exercises.map((exercise, index) => (
                          <div
                            key={`${dayPlan.day}-${exercise.exerciseName}-${index}`}
                            className="rounded-xl border bg-muted/10 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium">{exercise.exerciseName}</p>
                              <span className="text-xs text-muted-foreground">
                                {exercise.sets.length} sets
                              </span>
                            </div>
                            <div className="mt-3 space-y-2">
                              {exercise.sets.map((set, setIndex) => (
                                <div
                                  key={setIndex}
                                  className="grid grid-cols-4 gap-2 rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground"
                                >
                                  <span>Set {setIndex + 1}</span>
                                  <span>{set.weight ?? '-'} kg</span>
                                  <span>{set.reps ?? '-'} reps</span>
                                  <span>{set.restTime ?? '-'} s rest</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No exercises added for this day.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </TabsContents>
        </Tabs>
      </div>
    </div>
  )
}
