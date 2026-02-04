import { useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useQuery } from 'convex/react'

import { useAuth } from '@/components/auth/useAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { api } from '@convex/_generated/api'

const privilegedRoles = new Set(['trainer', 'admin'])

const weightChartConfig = {
  weight: {
    label: 'Weight',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export const Route = createFileRoute(
  '/app/management/clients/$clientId/logs/weight',
)({
  component: WeightLogsRoute,
})

function WeightLogsRoute() {
  const navigate = useNavigate()
  const { clientId } = Route.useParams()
  const { user, isLoading } = useAuth()

  // Fetch weight logs for the client
  const weightLogs = useQuery(
    api.weightLogs.getWeightLogsByUser,
    clientId ? { userId: clientId } : 'skip',
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

  const chartData = weightLogs
    ? [...weightLogs].reverse().map((log) => ({
        date: new Date(log.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        weight: log.weight,
      }))
    : []

  const currentWeight = weightLogs?.[weightLogs.length - 1]?.weight
  const previousWeight = weightLogs?.[weightLogs.length - 2]?.weight
  const weightChange =
    currentWeight && previousWeight ? currentWeight - previousWeight : 0
  const weightChangePercent = previousWeight
    ? ((weightChange / previousWeight) * 100).toFixed(1)
    : 0

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
          <h1 className="text-2xl font-semibold">Weight Logs</h1>
          <p className="text-muted-foreground">
            {weightLogs?.length || 0} log
            {(weightLogs?.length || 0) !== 1 ? 's' : ''} recorded
          </p>
        </div>
      </header>

      {/* Weight Stats */}
      {weightLogs && weightLogs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Weight</p>
                <p className="text-3xl font-bold">{currentWeight} kg</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Change from Last
                </p>
                <div className="flex items-center gap-2">
                  {weightChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-red-500" />
                  ) : weightChange < 0 ? (
                    <TrendingDown className="w-5 h-5 text-green-500" />
                  ) : null}
                  <p
                    className={`text-2xl font-bold ${
                      weightChange > 0
                        ? 'text-red-500'
                        : weightChange < 0
                          ? 'text-green-500'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {weightChange > 0 ? '+' : ''}
                    {weightChange.toFixed(1)} kg
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  ({weightChangePercent}%)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-3xl font-bold">{weightLogs.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weight Chart */}
      {!weightLogs ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading weight logs...</p>
          </CardContent>
        </Card>
      ) : weightLogs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-chart-1/10 flex items-center justify-center mx-auto">
                <BarChart3 className="h-8 w-8 text-chart-1" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">No weight logs yet</h3>
                <p className="text-sm text-muted-foreground">
                  Weight entries will appear here once logged.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Weight Trend</CardTitle>
              <CardDescription>Weight changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={weightChartConfig}
                className="h-80 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="date"
                      stroke="var(--muted-foreground)"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--chart-1)', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Weight Logs List */}
          <Card>
            <CardHeader>
              <CardTitle>Weight Log History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...weightLogs].reverse().map((log, index, reversedLogs) => {
                const previousLog = reversedLogs[index + 1]
                return (
                <div
                  key={log._id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-chart-1/10 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-chart-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{log.weight} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  {previousLog && (
                    <div className="flex items-center gap-1 ml-4">
                      {log.weight > previousLog.weight ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-red-500">
                            +{(log.weight - previousLog.weight).toFixed(1)} kg
                          </span>
                        </>
                      ) : log.weight < previousLog.weight ? (
                        <>
                          <TrendingDown className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-green-500">
                            {(log.weight - previousLog.weight).toFixed(1)} kg
                          </span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              )})}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
