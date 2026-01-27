import { createFileRoute } from '@tanstack/react-router'
import { Flame, Timer, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { BarSpark } from '@/components/app/sparks'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/app/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="px-4 pb-24 pt-4">
      <header className="app-reveal">
        <div className="flex items-baseline justify-between">
          <h1 className="app-title text-[28px] leading-tight tracking-[-0.02em]">
            Today
          </h1>
          <div className="app-chip">Wed</div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep it tight. Small wins compound.
        </p>
      </header>

      <section className="mt-4 grid gap-3">
        <div className={cn('app-card app-reveal', 'app-reveal-delay-1')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Calories Burned
              </div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-3xl font-semibold tabular-nums">612</div>
                <div className="text-xs text-muted-foreground">kcal</div>
              </div>
            </div>
            <div className="app-iconRing">
              <Flame className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <BarSpark
              values={[5, 8, 7, 10, 6, 11, 9]}
              ariaLabel="Calories burned over the last 7 days"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={cn('app-card app-reveal', 'app-reveal-delay-2')}>
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Workout Time
              </div>
              <Timer className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-2xl font-semibold tabular-nums">52</div>
              <div className="text-xs text-muted-foreground">min</div>
            </div>
            <div className="mt-3">
              <BarSpark
                values={[2, 4, 3, 6, 4, 7, 5]}
                ariaLabel="Workout duration over the last 7 days"
                variant="cool"
              />
            </div>
          </div>
          <div className={cn('app-card app-reveal', 'app-reveal-delay-3')}>
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Goal Progress
              </div>
              <TrendingUp className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <div className="text-sm">Strength</div>
                <div className="text-sm tabular-nums text-muted-foreground">
                  72%
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-2 w-[72%] rounded-full bg-[color:var(--app-accent)]"
                  aria-hidden
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm">Consistency</div>
                <div className="text-sm tabular-nums text-muted-foreground">
                  61%
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-2 w-[61%] rounded-full bg-[color:var(--app-accent-2)]"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={cn('mt-5 app-reveal', 'app-reveal-delay-4')}>
        <div className="flex items-center justify-between">
          <h2 className="app-subtitle">Weekly Summary</h2>
          <div className="text-xs text-muted-foreground">Last 7 days</div>
        </div>

        <div className="mt-3 grid gap-3">
          <div className="app-card">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Calories</div>
              <div className="text-xs text-muted-foreground tabular-nums">
                3,940 kcal
              </div>
            </div>
            <div className="mt-3">
              <BarSpark
                values={[9, 6, 8, 10, 7, 11, 8]}
                ariaLabel="Weekly calories burned"
              />
            </div>
          </div>
          <div className="app-card">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Duration</div>
              <div className="text-xs text-muted-foreground tabular-nums">
                4h 12m
              </div>
            </div>
            <div className="mt-3">
              <BarSpark
                values={[5, 7, 6, 9, 7, 10, 8]}
                ariaLabel="Weekly workout duration"
                variant="cool"
              />
            </div>
          </div>
          <div className="app-card">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Workouts</div>
              <div className="text-xs text-muted-foreground tabular-nums">
                5/7
              </div>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {[1, 1, 0, 1, 1, 1, 0].map((v, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-9 rounded-md border',
                    v
                      ? 'bg-[color:color-mix(in_oklab,var(--app-accent),white_72%)] border-[color:color-mix(in_oklab,var(--app-accent),black_80%)]'
                      : 'bg-muted/40 border-border',
                  )}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={cn('mt-5 app-reveal', 'app-reveal-delay-5')}>
        <div className="flex items-center justify-between">
          <h2 className="app-subtitle">Quick Start</h2>
          <div className="text-xs text-muted-foreground">One tap</div>
        </div>
        <div className="mt-3">
          <Button
            className="w-full rounded-xl bg-[color:var(--app-accent)] text-black hover:bg-[color:color-mix(in_oklab,var(--app-accent),black_10%)]"
            onClick={() => {
              ;(
                document.getElementById(
                  'app-drawer-trigger',
                ) as HTMLButtonElement | null
              )?.click()
            }}
          >
            Open actions
          </Button>
        </div>
      </section>

      <section className={cn('mt-5 app-reveal', 'app-reveal-delay-6')}>
        <div className="flex items-center justify-between">
          <h2 className="app-subtitle">Recent Activity</h2>
          <div className="text-xs text-muted-foreground">Today</div>
        </div>
        <div className="mt-3 grid gap-2">
          {[
            {
              title: 'Leg Day 1',
              meta: '42 min · 320 kcal',
            },
            {
              title: 'Lunch logged',
              meta: '610 kcal · protein-heavy',
            },
            {
              title: 'Weight check-in',
              meta: '78.6 kg',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="app-card flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium">{item.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {item.meta}
                </div>
              </div>
              <div className="app-chip">New</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
