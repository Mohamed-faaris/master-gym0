import { useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, UtensilsCrossed, Calendar, Flame } from 'lucide-react'
import { useQuery } from 'convex/react'

import { useAuth } from '@/components/auth/useAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@convex/_generated/api'

const privilegedRoles = new Set(['trainer', 'admin'])

export const Route = createFileRoute(
  '/app/management/clients/$clientId/logs/diet',
)({
  component: DietLogsRoute,
})

function DietLogsRoute() {
  const navigate = useNavigate()
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()

  // Fetch diet logs for the client
  const dietLogs = useQuery(
    api.dietLogs.getDietLogsByUser,
    clientId ? { userId: clientId, limit: 100 } : 'skip',
  )

  useEffect(() => {
    if (isLoading) return
    if (!user || !privilegedRoles.has(user.role)) {
      navigate({ to: '/' })
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!user || !privilegedRoles.has(user.role)) {
    return null
  }

  return (
    <div className="space-y-6 p-4 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <header className="space-y-3">
        <Link
          to={`/app/management/clients/${clientId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to client
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Diet Logs</h1>
          <p className="text-muted-foreground">
            {dietLogs?.length || 0} log
            {(dietLogs?.length || 0) !== 1 ? 's' : ''} recorded
          </p>
        </div>
      </header>

      {/* Logs List */}
      <div className="space-y-3">
        {!dietLogs ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Loading diet logs...</p>
            </CardContent>
          </Card>
        ) : dietLogs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <UtensilsCrossed className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">No diet logs yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Diet entries will appear here once logged.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          dietLogs.map((log) => (
            <Card key={log._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-lg capitalize">
                        {log.mealType || 'Meal'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(log.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        {log.calories && (
                          <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4" />
                            {log.calories} kcal
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {log.items && log.items.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Items ({log.items.length})
                      </p>
                      <div className="space-y-1">
                        {log.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="text-sm p-2 bg-muted rounded flex items-center justify-between"
                          >
                            <span>{item.name}</span>
                            {item.calories && (
                              <span className="text-muted-foreground text-xs">
                                {item.calories} kcal
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {log.notes && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">{log.notes}</p>
                    </div>
                  )}

                  {log.calories && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg">
                      <Flame className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-700">
                          {log.calories} calories
                        </p>
                        <p className="text-xs text-emerald-600">
                          Total for this meal
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
