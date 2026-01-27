import { Link, createFileRoute } from '@tanstack/react-router'
import { Bell, Info, LogOut, User } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/app/account/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="px-4 pb-24 pt-4">
      <header className="app-reveal">
        <h1 className="app-title text-[24px] leading-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile, settings, and gym info.
        </p>
      </header>

      <section
        className={cn('mt-4 grid gap-3', 'app-reveal app-reveal-delay-1')}
      >
        <div className="app-card">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl border border-border/60 bg-background/60">
              <User className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">Faaris A.</div>
              <div className="truncate text-xs text-muted-foreground">
                faaris@example.com
              </div>
            </div>
          </div>
        </div>

        <div className="app-card">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Notifications</div>
            <div className="app-chip">On</div>
          </div>
          <div className="mt-3 grid gap-2">
            {[
              ['Workout reminders', 'Enabled'],
              ['Meal nudges', 'Enabled'],
              ['Weekly report', 'Enabled'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2"
              >
                <div className="inline-flex items-center gap-2 text-sm">
                  <Bell className="size-4 text-muted-foreground" /> {k}
                </div>
                <div className="text-xs text-muted-foreground">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="app-card">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-medium">
              <Info className="size-4 text-muted-foreground" /> About
            </div>
            <Button variant="outline" className="rounded-xl" asChild>
              <Link to="/app/account/about">Open</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Hours, location, amenities, and contact.
          </p>
        </div>
      </section>

      <section className={cn('mt-5 app-reveal', 'app-reveal-delay-2')}>
        <Button
          variant="outline"
          className="w-full rounded-xl border-border/70 bg-background/60"
          onClick={() => {
            // Wiring to auth is optional for this task.
          }}
        >
          <LogOut className="size-4" /> Logout
        </Button>
      </section>
    </main>
  )
}
