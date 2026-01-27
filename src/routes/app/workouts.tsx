import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown, ListChecks, Play, Timer } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/app/workouts')({
  component: RouteComponent,
})

const plan = {
  dayLabel: 'Leg Day 1',
  dateLabel: 'Wed · Jan 28',
  workouts: [
    {
      name: 'Back Squat + Accessories',
      durationMin: 48,
      calories: 360,
      details: '5x5 · RPE 7–8 · 2 min rests',
      exercises: [
        { name: 'Back Squat', sets: '5x5', load: '70–80% 1RM' },
        { name: 'Romanian Deadlift', sets: '3x8', load: 'moderate' },
        { name: 'Walking Lunges', sets: '3x10', load: 'DBs' },
        { name: 'Calf Raises', sets: '4x12', load: 'slow tempo' },
      ],
    },
    {
      name: 'Core + Conditioning',
      durationMin: 22,
      calories: 180,
      details: 'Intervals · 30/30 · 12 rounds',
      exercises: [
        { name: 'Hanging Knee Raises', sets: '3x12', load: 'bodyweight' },
        { name: 'Plank', sets: '3x45s', load: 'tight form' },
        { name: 'Bike Intervals', sets: '12 rounds', load: 'hard/easy' },
      ],
    },
  ],
}

function RouteComponent() {
  return (
    <main className="px-4 pb-28 pt-4">
      <header className="app-reveal">
        <div className="flex items-center justify-between">
          <div>
            <div className="app-title text-[22px] leading-tight">
              {plan.dayLabel}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {plan.dateLabel}
            </div>
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-border/70 bg-background/60"
          >
            Day
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </header>

      <section
        className={cn('mt-4 grid gap-3', 'app-reveal app-reveal-delay-1')}
      >
        {plan.workouts.map((w) => (
          <details key={w.name} className="app-card group overflow-hidden">
            <summary className="list-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-snug">
                    {w.name}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {w.details}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Timer className="size-3.5" /> {w.durationMin} min
                    </span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="tabular-nums">{w.calories} kcal</span>
                  </div>
                </div>
                <div className="app-chip shrink-0 group-open:bg-[color:color-mix(in_oklab,var(--app-accent),white_74%)]">
                  Details
                </div>
              </div>
            </summary>
            <div className="mt-4 border-t border-border/60 pt-3">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Exercise List
                </div>
                <ListChecks className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-3 grid gap-2">
                {w.exercises.map((ex) => (
                  <div
                    key={ex.name}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {ex.name}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {ex.sets}
                      </div>
                    </div>
                    <div className="app-chip tabular-nums">{ex.load}</div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </section>

      <div className="pointer-events-none fixed bottom-[88px] left-0 right-0 z-10">
        <div className="mx-auto w-full max-w-[430px] px-4">
          <Button className="pointer-events-auto w-full rounded-2xl bg-black text-white hover:bg-black/90">
            <Play className="size-4" /> Start Today’s Workout
          </Button>
        </div>
      </div>
    </main>
  )
}
