import { useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ClipboardList, Plus, ArrowLeft, Calendar, Pencil } from 'lucide-react'
import { useQuery } from 'convex/react'

import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@convex/_generated/api'

const privilegedRoles = new Set(['trainer', 'admin'])

export const Route = createFileRoute('/app/management/programs/')({
  component: ProgramsRoute,
})

function ProgramsRoute() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  // Fetch training plans
  const trainingPlans = useQuery(api.trainingPlans.getAllTrainingPlans)
  const visibleTrainingPlans = trainingPlans?.filter((plan) => !plan.isCopy)

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

  /* -------------------------------------------------------------------------- */
  /*                                 UI Helpers                                 */
  /* -------------------------------------------------------------------------- */

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading programs…
      </div>
    )
  }

  const isPrivileged = !!user && privilegedRoles.has(user.role)
  if (!user || !isPrivileged) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Restricted area</CardTitle>
            <CardDescription>
              Only trainers and admins can manage programs.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6 p-4">
      {/* --------------------------- Header --------------------------- */}
      <header className="space-y-3">
        <Link
          to="/app/management"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Program list · {todayLabel}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Programs</h1>
            <p className="text-muted-foreground">
              {visibleTrainingPlans?.length || 0} training programs
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate({ to: '/app/management/programs/new' })}
            >
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
        </div>
      </header>

      {/* ----------------------------- Program List ----------------------------- */}
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Training Programs</CardTitle>
            <CardDescription>Create, edit, and assign plans.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!trainingPlans && (
            <div className="text-center py-8 text-muted-foreground">
              Loading programs...
            </div>
          )}

          {trainingPlans && visibleTrainingPlans?.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">No programs yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Create your first training program to get started.
                </p>
              </div>
              <Button
                onClick={() => navigate({ to: '/app/management/programs/new' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Program
              </Button>
            </div>
          )}

          {trainingPlans && visibleTrainingPlans && visibleTrainingPlans.length > 0 && (
            <div className="space-y-3">
              {visibleTrainingPlans.map((program) => (
                <Card
                  key={program._id}
                  className="hover:border-primary transition-colors cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: '/app/management/programs/$programId',
                      params: { programId: program._id },
                    })
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {program.description}
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate({
                            to: '/app/management/programs/$programId/edit',
                            params: { programId: program._id },
                          })
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {program.durationWeeks} weeks
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4" />
                        {program.days.length} workout days
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
