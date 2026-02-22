import { Link } from '@tanstack/react-router'
import type { ComponentType } from 'react'

interface ListCardProps {
  to: string
  title: string
  description: string
  count: number
  icon: ComponentType<{ className?: string }>
}

export function ListCard({
  to,
  title,
  description,
  count,
  icon: Icon,
}: ListCardProps) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/40"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_55%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">
            {title}
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            {count}
          </h2>
          <p className="max-w-[24ch] text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-background text-primary transition-colors group-hover:bg-primary/5">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Link>
  )
}
