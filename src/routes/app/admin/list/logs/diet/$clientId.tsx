import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Calendar, Camera, Flame, UtensilsCrossed } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/app/admin/list/logs/diet/$clientId')({
  component: AdminDietLogsRoute,
})

function AdminDietLogsRoute() {
  const { clientId } = Route.useParams()
  const [calorieDrafts, setCalorieDrafts] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const dietLogs = useQuery(
    api.dietLogs.getDietLogsByUser,
    clientId ? { userId: clientId as any, limit: 100 } : 'skip',
  )
  const updateDietLog = useMutation(api.dietLogs.updateDietLog)

  const handleSaveCalories = async (dietLogId: string) => {
    const rawValue = calorieDrafts[dietLogId]
    const parsedCalories = rawValue ? parseFloat(rawValue) : NaN
    if (isNaN(parsedCalories) || parsedCalories <= 0) {
      toast.error('Please enter valid calories')
      return
    }

    try {
      setSavingId(dietLogId)
      await updateDietLog({ dietLogId: dietLogId as any, calories: parsedCalories })
      toast.success('Calories updated')
      setCalorieDrafts((prev) => ({ ...prev, [dietLogId]: '' }))
    } catch {
      toast.error('Failed to update calories')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6 p-4 pb-20 max-w-4xl mx-auto">
      <header className="space-y-3">
        <Link
          to="/app/admin/list/$clientId"
          params={{ clientId }}
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
                        {log.calories != null && (
                          <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4" />
                            {log.calories} kcal
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-base font-semibold">{log.title}</p>
                    {log.description && (
                      <p className="text-sm text-muted-foreground">
                        {log.description}
                      </p>
                    )}
                  </div>

                  {log.imageUrl && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Meal photo</p>
                      <div className="relative overflow-hidden rounded-lg border">
                        <img
                          src={log.imageUrl}
                          alt="Meal"
                          className="h-40 w-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground">
                          <Camera className="h-3 w-3" />
                          Photo
                        </div>
                      </div>
                    </div>
                  )}

                  {log.calories != null ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg">
                      <Flame className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-emerald-700">{log.calories} calories</p>
                        <p className="text-xs text-emerald-600">Total for this meal</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Add calories for this meal</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="e.g., 450"
                          value={calorieDrafts[log._id] ?? ''}
                          onChange={(event) =>
                            setCalorieDrafts((prev) => ({
                              ...prev,
                              [log._id]: event.target.value,
                            }))
                          }
                          className="h-9"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSaveCalories(log._id as any)}
                          disabled={savingId === log._id}
                        >
                          {savingId === log._id ? 'Saving...' : 'Save'}
                        </Button>
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
