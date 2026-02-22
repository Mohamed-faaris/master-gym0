import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays, Quote, Sparkles, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/app/_user/success-story')({
  component: RouteComponent,
})

const storyHighlights = [
  {
    title: '12 Week Cut',
    summary:
      'A structured fat-loss block with progressive resistance and steady nutrition control.',
  },
  {
    title: 'Muscle Gain Block',
    summary:
      'Lean bulk phases focused on strength milestones and form-first training quality.',
  },
  {
    title: 'Post Pregnancy Rebuild',
    summary:
      'A careful return-to-strength system with coaching support and flexible progress checks.',
  },
]

const milestones = [
  'Master Fitness opened on 22 Aug 2022.',
  'Expanded to 3 active branches across the city.',
  'Built specialized coaching tracks for women, working professionals, and beginners.',
  'Created a hybrid coaching model: in-gym monitoring + app-based progress tracking.',
]

function RouteComponent() {
  return (
    <div className="px-4 pb-8 pt-5">
      <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <header className="relative border-b bg-linear-to-br from-primary/10 via-background to-chart-3/10 px-5 py-8">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
          <Link
            to="/app/account"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to account
          </Link>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Published for members
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Success Story</h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              The Master Fitness journey from one focused gym floor to a
              complete coaching ecosystem for transformation, consistency, and
              long-term health.
            </p>
          </div>
        </header>

        <div className="space-y-8 px-5 py-6">
          <section className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Master Fitness began with one simple idea: most people do not fail
              because of effort, they fail because they do not have a clear
              system. From day one, the focus has been building structure that
              members can actually follow.
            </p>
            <p>
              Under CEO Nagaraj and the coaching team, each member journey is
              tracked with purpose. Strength, fat loss, mobility, recovery, and
              food habits are reviewed together so progress stays realistic and
              sustainable.
            </p>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Trophy className="h-4 w-4 text-primary" />
              Key Milestones
            </h2>
            <div className="space-y-3">
              {milestones.map((item) => (
                <Card key={item}>
                  <CardContent className="px-4 py-3 text-sm text-muted-foreground">
                    {item}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-4 w-4 text-chart-2" />
              Featured Transformations
            </h2>
            <div className="space-y-4">
              {storyHighlights.map((story) => (
                <div
                  key={story.title}
                  className="rounded-xl border bg-muted/20 p-4"
                >
                  <h3 className="text-base font-semibold">{story.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {story.summary}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Quote className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm italic text-muted-foreground">
                Transformation is not a 30-day event. It is a repeatable
                routine, supported by coaching, accountability, and patience.
              </p>
            </div>
          </section>
        </div>
      </article>
    </div>
  )
}
