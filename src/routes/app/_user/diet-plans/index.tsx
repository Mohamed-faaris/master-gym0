import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useAuth } from '@/components/auth/useAuth'
import { Plus, UtensilsCrossed, Calendar, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '../../../../../convex/_generated/api'

export const Route = createFileRoute('/app/_user/diet-plans/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuth()
  const dietPlans = useQuery(
    api.dietPlans.getDietPlansByUser,
    user ? { userId: user._id } : 'skip',
  )

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">
          Please sign in to view diet plans
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Diet Plans</h1>
            <p className="text-sm text-muted-foreground">
              Your meal templates and nutrition guides
            </p>
          </div>
          <Link to="/app/diet-plans/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </Link>
        </header>

        <div className="space-y-3">
          {!dietPlans && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}

          {dietPlans && dietPlans.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UtensilsCrossed className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">No diet plans yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Create your first meal template to start organizing your
                    nutrition strategy.
                  </p>
                </div>
                <Link to="/app/diet-plans/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create diet plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {dietPlans &&
            dietPlans.map((plan) => (
              <Card
                key={plan._id}
                className="hover:border-primary transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {plan.goal && (
                      <div className="flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        {plan.goal}
                      </div>
                    )}
                    {plan.durationWeeks && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {plan.durationWeeks} weeks
                      </div>
                    )}
                    {plan.dailyCalorieTarget && (
                      <div className="flex items-center gap-1.5">
                        <UtensilsCrossed className="h-4 w-4" />
                        {plan.dailyCalorieTarget} cal/day
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Active days:
                    </span>
                    <div className="flex gap-1">
                      {plan.activeDays.map((day) => (
                        <span
                          key={day}
                          className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {plan.mealTemplate.length} meal
                      {plan.mealTemplate.length !== 1 ? 's' : ''} in template
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}
