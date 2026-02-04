import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import {
  Calendar,
  Droplets,
  Target,
  UtensilsCrossed,
  Utensils,
} from 'lucide-react'

import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const Route = createFileRoute('/app/_user/diet-plan')({
  component: DietPlanRoute,
})

function DietPlanRoute() {
  const { user } = useAuth()

  const planOwnerId = user?.trainerId ?? user?._id

  const dietPlans = useQuery(
    api.dietPlans.getDietPlansByUser,
    planOwnerId ? { userId: planOwnerId } : 'skip',
  )

  const dietPlan = dietPlans?.[0] ?? null

  const weekDayLabels: Record<string, string> = {
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
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    postWorkout: 'Post-workout',
  }

  const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

  if (!dietPlans) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading diet plan...</p>
      </div>
    )
  }

  if (!dietPlan) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Diet Plan</h1>
          <p className="text-muted-foreground">
            Your assigned nutrition plan will appear here.
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Utensils className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">No plan assigned</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Ask your trainer to assign a diet plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Link to="/app/_user/diet-logs" className="fixed inset-x-4 bottom-6 z-30">
          <Button className="h-14 w-full rounded-full shadow-lg">
            <UtensilsCrossed className="w-5 h-5 mr-2" />
            Log Diet
          </Button>
        </Link>
      </div>
    )
  }

  const mealsByDay = dietPlan.mealTemplate.reduce(
    (acc, meal) => {
      const dayKey = meal.day || 'unknown'
      if (!acc[dayKey]) acc[dayKey] = []
      acc[dayKey].push(meal)
      return acc
    },
    {} as Record<string, typeof dietPlan.mealTemplate>,
  )

  const availableDays = dayOrder.filter((day) => mealsByDay[day]?.length)
  const [activeDay, setActiveDay] = useState(
    availableDays[0] ?? dayOrder[0],
  )

  useEffect(() => {
    if (!availableDays.length) return
    setActiveDay((prev) => (availableDays.includes(prev) ? prev : availableDays[0]))
  }, [availableDays])

  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    Object.entries(mealsByDay).forEach(([day, meals]) => {
      totals[day] = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0)
    })
    return totals
  }, [mealsByDay])

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4 space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">{dietPlan.name}</h1>
          <p className="text-sm text-muted-foreground">
            {dietPlan.description}
          </p>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Meal Template
            </CardTitle>
            <CardDescription>
              {dietPlan.mealTemplate.length} meal
              {dietPlan.mealTemplate.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeDay} onValueChange={setActiveDay}>
              <TabsList className="grid w-full grid-cols-4">
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

            {dietPlan.mealTemplate.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No meals configured in this template
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Link to="/app/_user/diet-logs" className="fixed inset-x-4 bottom-6 z-30">
        <Button className="h-14 w-full rounded-full shadow-lg">
          <UtensilsCrossed className="w-5 h-5 mr-2" />
          Log Diet
        </Button>
      </Link>
    </div>
  )
}
