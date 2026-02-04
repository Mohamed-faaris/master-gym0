import type { DateScope } from './date-context-selector'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DayActivity {
  day: string
  date: string
  workouts: number
  diets: number
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{getScopeLabel()} Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between gap-1">
          {days.map((day, index) => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-2 flex-1"
            >
              <div className="text-xs font-medium text-muted-foreground">
                {dayLabels[index]}
              </div>
              <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${
                  day.isActive
                    ? dataType === 'workout'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-chart-2 text-chart-2-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {dataType === 'workout' ? day.workouts : day.diets}
              </div>
              <div className="text-xs text-muted-foreground">{day.date}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
