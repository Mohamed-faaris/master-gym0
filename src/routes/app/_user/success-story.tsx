import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { ArrowLeft, CalendarDays, Quote } from 'lucide-react'
import { api } from 'convex/_generated/api'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute('/app/_user/success-story')({
  validateSearch: (search: Record<string, unknown>) => ({
    slug: typeof search.slug === 'string' ? search.slug : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { slug } = Route.useSearch()
  const activeStories = useQuery(api.successStories.listActiveStories)

  const selectedStory =
    (slug
      ? activeStories?.find((story) => story.slug === slug)
      : undefined) ?? activeStories?.[0]

  if (!activeStories) {
    return (
      <div className="px-4 pb-8 pt-5">
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Loading story...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!selectedStory) {
    return (
      <div className="px-4 pb-8 pt-5">
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No success stories are published yet.
            </p>
            <Link to="/app/account" className="text-sm font-medium text-primary">
              Back to account
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold tracking-tight">{selectedStory.title}</h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {selectedStory.paragraph}
            </p>
          </div>
        </header>

        <div className="space-y-8 px-5 py-6">
          {selectedStory.imageUrl ? (
            <section className="overflow-hidden rounded-xl border">
              <img
                src={selectedStory.imageUrl}
                alt={selectedStory.title}
                className="h-56 w-full object-cover"
              />
            </section>
          ) : null}

          <section>
            <h2 className="mb-4 text-lg font-semibold">Key Points</h2>
            <div className="space-y-3">
              {selectedStory.points.map((point) => (
                <Card key={point}>
                  <CardContent className="px-4 py-3 text-sm text-muted-foreground">
                    {point.startsWith('•') ? point : `• ${point}`}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Quote className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm italic text-muted-foreground">
                Consistency turns training into transformation.
              </p>
            </div>
          </section>
        </div>
      </article>
    </div>
  )
}
