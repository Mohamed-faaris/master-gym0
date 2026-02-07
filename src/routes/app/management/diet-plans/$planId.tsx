import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import {
  ArrowLeft,
  Calendar,
  Droplets,
  Target,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'

import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/radix/tabs'
import { toast } from 'sonner'
import { api } from '@convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

const privilegedRoles = new Set(['trainer', 'admin'])

const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
type DayKey = (typeof dayOrder)[number]

type MealTemplateEntry = {
  day: DayKey
  mealType: string
  title: string
  description: string
  calories: number
}

const weekDayLabels: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  middaySnack: 'Midday Snack',
  lunch: 'Lunch',
  preWorkout: 'Pre-workout',
  postWorkout: 'Post-workout',
}

export const Route = createFileRoute('/app/management/diet-plans/$planId')({
  component: DietPlanDetailRoute,
})

function DietPlanDetailRoute() {
  const { planId } = Route.useParams()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  const dietPlan = useQuery(api.dietPlans.getDietPlanById, {
    dietPlanId: planId as Id<'dietPlans'>,
  })

  const deleteDietPlan = useMutation(api.dietPlans.deleteDietPlan)

  const mealTemplate: MealTemplateEntry[] = dietPlan?.mealTemplate ?? []

  const mealsByDay = useMemo(() => {
    const base = dayOrder.reduce<Record<DayKey, MealTemplateEntry[]>>(
      (acc, day) => {
        acc[day] = []
        return acc
      },
      {} as Record<DayKey, MealTemplateEntry[]>,
    )

    mealTemplate.forEach((meal) => {
      base[meal.day].push(meal)
    })

    return base
  }, [mealTemplate])

  const availableDays = useMemo<DayKey[]>(
    () => dayOrder.filter((day) => mealsByDay[day]?.length),
    [mealsByDay],
  )

  const [activeDay, setActiveDay] = useState<DayKey>(
    () => availableDays[0] ?? dayOrder[0],
  )

  useEffect(() => {
    if (!availableDays.length) return
    setActiveDay((prev) =>
      availableDays.includes(prev) ? prev : availableDays[0],
    )
  }, [availableDays])

  const dayTotals = useMemo<Record<DayKey, number>>(() => {
    const totals = {} as Record<DayKey, number>
    dayOrder.forEach((day) => {
      const meals = mealsByDay[day] ?? []
      totals[day] = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
    })
    return totals
  }, [mealsByDay])

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
      navigate({ to: '/app/_user' })
    }
  }, [user, isLoading, navigate])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this diet plan?')) return

    try {
      await deleteDietPlan({ dietPlanId: planId as Id<'dietPlans'> })
      toast.success('Diet plan deleted successfully')
      navigate({ to: '/app/management/diet-plans' })
    } catch (error) {
      console.error('Failed to delete diet plan:', error)
      toast.error('Failed to delete diet plan')
    }
  }

  if (isLoading || !dietPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4 space-y-4">
        <header className="space-y-3">
          <Link
            to="/app/management/diet-plans"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to diet plans
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">{dietPlan.name}</h1>
              <p className="text-sm text-muted-foreground">
                {dietPlan.description}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {dietPlan.goal && (
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              {dietPlan.goal}
            </div>
          )}
          {dietPlan.durationWeeks && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {dietPlan.durationWeeks} weeks
            </div>
          )}
          {dietPlan.dailyCalorieTarget && (
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed className="h-4 w-4" />
              {dietPlan.dailyCalorieTarget} cal/day
            </div>
          )}
          {dietPlan.hydrationTarget && (
            <div className="flex items-center gap-1.5">
              <Droplets className="h-4 w-4" />
              {dietPlan.hydrationTarget}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Active Days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Active Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dietPlan.activeDays.map((day) => (
                <span
                  key={day}
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  {weekDayLabels[day] || day}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coach Guidance */}
        {dietPlan.coachNote && (
          <Card>
            <CardHeader>
              <CardTitle>Coach Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {dietPlan.coachNote}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Meal Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Meal Template
            </CardTitle>
            <CardDescription>
              {mealTemplate.length} meal
              {mealTemplate.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeDay} onValueChange={setActiveDay}>
              <TabsList className="grid w-full grid-cols-7">
                {availableDays.map((day) => (
                  <TabsTrigger key={day} value={day}>
                    {weekDayLabels[day]?.slice(0, 3) ?? day}
                  </TabsTrigger>
                ))}
              </TabsList>

              {availableDays.map((day) => (
                <TabsContent key={day} value={day} className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {weekDayLabels[day] || day}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {mealsByDay[day].length} meal
                      {mealsByDay[day].length !== 1 ? 's' : ''} ·{' '}
                      {dayTotals[day] ?? 0} cal
                    </span>
                  </div>
                  <div className="space-y-3">
                    {mealsByDay[day].map((meal, index) => (
                      <div
                        key={`${day}-${index}`}
                        className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              {mealTypeLabels[meal.mealType] || meal.mealType}
                            </p>
                            <p className="text-base font-semibold mt-1">
                              {meal.title}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-primary">
                            {meal.calories} cal
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {meal.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {mealTemplate.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No meals configured in this template
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
