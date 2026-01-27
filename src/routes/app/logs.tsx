import { createFileRoute } from '@tanstack/react-router'
import { Plus, Target } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LineSpark } from '@/components/app/sparks'

export const Route = createFileRoute('/app/logs')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="px-4 pb-24 pt-4">
      <header className="app-reveal">
        <h1 className="app-title text-[24px] leading-tight">Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Diet + weight, clean and quick.
        </p>
      </header>

      <section className={cn('mt-4 app-reveal', 'app-reveal-delay-1')}>
        <div className="app-tabs" role="tablist" aria-label="Logs tabs">
          <a className="app-tab is-active" href="#diet" role="tab">
            Diet
          </a>
          <a className="app-tab" href="#weight" role="tab">
            Weight
          </a>
        </div>
      </section>

      <section
        id="diet"
        className={cn('mt-4 grid gap-3', 'app-reveal app-reveal-delay-2')}
      >
        <div className="app-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Daily Calories
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                1,980
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  kcal
                </span>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl" disabled>
              <Plus className="size-4" /> Add meal
            </Button>
          </div>

          <div className="mt-4 grid gap-2">
            {[
              ['Breakfast', '420 kcal'],
              ['Lunch', '610 kcal'],
              ['Dinner', '740 kcal'],
              ['Snacks', '210 kcal'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2"
              >
                <div className="text-sm font-medium">{k}</div>
                <div className="text-sm tabular-nums text-muted-foreground">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="app-card">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Weekly Intake</div>
            <div className="text-xs text-muted-foreground">kcal/day</div>
          </div>
          <div className="mt-3">
            <LineSpark
              values={[1900, 2050, 1720, 2100, 1980, 2250, 1880]}
              ariaLabel="Weekly calorie intake"
            />
          </div>
        </div>
      </section>

      <section
        id="weight"
        className={cn('mt-4 grid gap-3', 'app-reveal app-reveal-delay-3')}
      >
        <div className="app-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Weight Trend
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                78.6
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  kg
                </span>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl" disabled>
              <Plus className="size-4" /> Add weight
            </Button>
          </div>
          <div className="mt-3">
            <LineSpark
              values={[79.4, 79.1, 79.0, 78.8, 78.9, 78.7, 78.6]}
              ariaLabel="Weight over time"
              variant="cool"
            />
          </div>
        </div>
        <div className="app-card">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Target</div>
            <div className="app-chip tabular-nums">76.0 kg</div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="size-3.5" /> 2.6 kg to go
            </div>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted">
            <div
              className="h-2 w-[48%] rounded-full bg-[color:var(--app-accent-2)]"
              aria-hidden
            />
          </div>
        </div>
      </section>
    </main>
  )
}
