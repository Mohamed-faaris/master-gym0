import { Link, createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, MapPin, Phone, Timer } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const gymDetails = `Master Gym

Location: Downtown (Main St.)

Hours:
- Mon–Fri: 05:30–23:00
- Sat–Sun: 07:00–21:00

Amenities:
- Free weights + racks
- Machines + cables
- Showers + lockers
- Water refill station

Contact:
- Phone: +1 (555) 010-1020
- Email: hello@mastergym.example
`

export const Route = createFileRoute('/app/account/about')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="px-4 pb-24 pt-4">
      <header className="app-reveal">
        <Button variant="ghost" className="-ml-2 rounded-xl" asChild>
          <Link to="/app/account">
            <ChevronLeft className="size-4" /> Back
          </Link>
        </Button>
        <h1 className="app-title mt-2 text-[24px] leading-tight">About</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gym info pulled from `gym-details.md`.
        </p>
      </header>

      <section
        className={cn('mt-4 grid gap-3', 'app-reveal app-reveal-delay-1')}
      >
        <div className="app-card">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" /> Location
              </div>
              <div className="app-chip">Downtown</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Timer className="size-4" /> Hours
              </div>
              <div className="app-chip">05:30–23:00</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" /> Contact
              </div>
              <div className="app-chip">+1 (555) 010-1020</div>
            </div>
          </div>
        </div>

        <div className="app-card">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Details
          </div>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {gymDetails.trim()}
          </pre>
        </div>
      </section>
    </main>
  )
}
