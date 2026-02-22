import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ChevronRight,
  Dumbbell,
  Loader2,
  UserRound,
} from 'lucide-react'

import type { AdminUser } from './-admin-types'

interface PeopleListProps {
  backTo?: string
  heading: string
  subheading: string
  emptyLabel: string
  people: AdminUser[]
  isLoading: boolean
  onSelect: (id: string) => void
  kind: 'client' | 'trainer'
}

export function PeopleList({
  backTo,
  heading,
  subheading,
  emptyLabel,
  people,
  isLoading,
  onSelect,
  kind,
}: PeopleListProps) {
  return (
    <section className="space-y-4">
      {backTo ? (
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      ) : null}
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {subheading}
        </p>
        <h1 className="text-3xl font-semibold text-foreground">{heading}</h1>
      </header>

      <div className="rounded-2xl border border-border bg-card p-3">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : people.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          <div className="space-y-2">
            {people.map((person) => (
              <button
                key={person._id}
                type="button"
                onClick={() => onSelect(person._id)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{person.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {person.phoneNumber}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
