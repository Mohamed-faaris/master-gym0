import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import { Scale, TrendingDown, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

export const Route = createFileRoute('/app/_user/weight')({
  component: WeightRoute,
})

const weightChartConfig = {
  weight: {
    label: 'Weight',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

function WeightRoute() {
  const { user } = useAuth()

  const [weightDrawerOpen, setWeightDrawerOpen] = useState(false)
  const [weight, setWeight] = useState('')

  const weightLogs = useQuery(
    api.weightLogs.getWeightLogsByUser,
    user ? { userId: user._id } : 'skip',
  )

  const addWeightLog = useMutation(api.weightLogs.addWeightLog)

  const weightChartData = weightLogs
    ? [...weightLogs].reverse().map((log) => ({
        date: new Date(log.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        weight: log.weight,
      }))
    : []

  const handleLogWeight = async () => {
    if (!user) {
      toast.error('Please sign in first')
      return
    }

    const weightValue = parseFloat(weight)
    if (isNaN(weightValue) || weightValue <= 0) {
      toast.error('Please enter a valid weight')
      return
    }

    try {
      await addWeightLog({ userId: user._id, weight: weightValue })
      toast.success(`Weight logged: ${weightValue} kg`)
      setWeight('')
      setWeightDrawerOpen(false)
    } catch {
      toast.error('Failed to log weight')
    }
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Please sign in to view weight</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Weight</h1>
        <p className="text-muted-foreground">Track your weight progress</p>
      </div>

      {weightChartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weight Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={weightChartConfig}
              className="h-[180px] w-full"
            >
              <AreaChart data={weightChartData} accessibilityLayer>
                <defs>
                  <linearGradient
                    id="fillWeight"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-weight)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-weight)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  width={40}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="weight"
                  type="monotone"
                  fill="url(#fillWeight)"
                  stroke="var(--color-weight)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Weight Logs</CardTitle>
          <CardDescription>Recent weigh-ins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!weightLogs && (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          )}

          {weightLogs && weightLogs.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">No weight logs yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Start tracking your weight progress.
                </p>
              </div>
            </div>
          )}

          {weightLogs && weightLogs.length > 0 && (
            <div className="space-y-3">
              {weightLogs.map((log, index) => {
                const prevWeight =
                  index < weightLogs.length - 1
                    ? weightLogs[index + 1].weight
                    : null
                const change = prevWeight ? log.weight - prevWeight : 0

                return (
                  <div
                    key={log._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {new Date(log.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-2xl font-bold">
                        {log.weight} kg
                      </div>
                    </div>
                    {change !== 0 && (
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          change < 0 ? 'text-green-600' : 'text-orange-600'
                        }`}
                      >
                        <TrendingDown
                          className={`h-4 w-4 ${change > 0 ? 'rotate-180' : ''}`}
                        />
                        {Math.abs(change).toFixed(1)} kg
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={() => setWeightDrawerOpen(true)}
        className="h-14 w-[calc(100%-2rem)] max-w-screen-sm rounded-full shadow-lg fixed left-1/2 -translate-x-1/2 bottom-20 z-30"
      >
        <Scale className="w-5 h-5 mr-2" />
        Log Weight
      </Button>

      <Drawer open={weightDrawerOpen} onOpenChange={setWeightDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setWeightDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Scale className="h-7 w-7 text-primary" />
            </div>
            <DrawerTitle className="text-center text-xl">
              Log Your Weight
            </DrawerTitle>
            <DrawerDescription className="text-center">
              Track your weight progress over time
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <label
                  htmlFor="weight"
                  className="block text-sm font-medium text-muted-foreground text-center"
                >
                  Current Weight
                </label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const current = parseFloat(weight) || 70
                      setWeight((current - 0.5).toFixed(1))
                    }}
                    className="h-14 w-14 rounded-full p-0"
                  >
                    <span className="text-xl font-semibold">-</span>
                  </Button>

                  <div className="relative flex-1 max-w-[200px]">
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleLogWeight()
                        }
                      }}
                      className="pr-12 text-2xl h-14 text-center font-bold"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg">
                      kg
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const current = parseFloat(weight) || 70
                      setWeight((current + 0.5).toFixed(1))
                    }}
                    className="h-14 w-14 rounded-full p-0"
                  >
                    <span className="text-xl font-semibold">+</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="pt-2">
            <Button
              onClick={handleLogWeight}
              size="lg"
              className="w-full"
              disabled={!weight || parseFloat(weight) <= 0}
            >
              <Scale className="mr-2 h-4 w-4" />
              Log Weight
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
