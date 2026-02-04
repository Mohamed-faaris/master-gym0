import type { DateScope } from './date-context-selector'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DayActivity {
  day: string
  date: string
  workouts: number
  diets: number
  workoutMinutes: number
  dietCalories: number
  isActive: boolean
}

interface ActivityWeekCardProps {
  scope: DateScope
  days: Array<DayActivity>
  dataType: 'workout' | 'diet'
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function ActivityWeekCard({
  scope,
  days,
  dataType,
}: ActivityWeekCardProps) {
  const getScopeLabel = () => {
    if (scope === 'today') return 'Today'
    if (scope === 'this-week') return 'This Week'
    return 'Last Week'
  }

  const values = days.map((day) =>
    dataType === 'workout' ? day.workoutMinutes : day.dietCalories,
  )
  const maxValue = Math.max(1, ...values)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{getScopeLabel()} Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between gap-2">
          {days.map((day, index) => {
            const value =
              dataType === 'workout' ? day.workoutMinutes : day.dietCalories
            const heightPercent = Math.max(
              6,
              Math.round((value / maxValue) * 100),
            )
            const barClasses =
              day.isActive || value > 0
                ? dataType === 'workout'
                  ? 'bg-primary'
                  : 'bg-chart-2'
                : 'bg-muted'

            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-2 flex-1"
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {dayLabels[index]}
                </div>
                <div className="flex items-end h-28 w-full">
                  <div
                    className={`w-full rounded-md transition-all ${barClasses}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <div className="text-xs font-semibold">
                  {dataType === 'workout' ? `${value}m` : `${value}`}
                </div>
                <div className="text-xs text-muted-foreground">{day.date}</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
