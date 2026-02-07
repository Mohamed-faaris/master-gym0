import { useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Users, ChevronRight } from 'lucide-react'
import { useQuery } from 'convex/react'

import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@convex/_generated/api'

const privilegedRoles = new Set(['trainer', 'admin'])

export const Route = createFileRoute('/app/management/clients/')({
  component: ClientsRoute,
})

function ClientsRoute() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  // Fetch clients assigned to this trainer
  const clients = useQuery(
    api.users.getUsersByTrainer,
    user?._id ? { trainerId: user._id } : 'skip',
  )

  /* -------------------------------------------------------------------------- */
  /*                                    Auth                                    */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      navigate({ to: '/' })
      return
    }
    if (!privilegedRoles.has(user.role)) {
      navigate({ to: '/app' })
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!user || !privilegedRoles.has(user.role)) {
    return null
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  const todayLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 p-4 pb-20">
      {/* --------------------------- Header --------------------------- */}
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Client roster · {todayLabel}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Clients</h1>
            <p className="text-muted-foreground">Manage roster and progress.</p>
          </div>
          {user?.role === 'admin' && (
            <Button asChild size="sm" variant="outline">
              <Link to="/app/admin">Admin</Link>
            </Button>
          )}
        </div>
      </header>

      {/* ----------------------------- Client List ----------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Client Roster</CardTitle>
          <CardDescription>
            {clients?.length ?? 0} client{clients?.length !== 1 ? 's' : ''}{' '}
            assigned
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {!clients ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Loading clients...
              </p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">No clients yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Clients assigned to you will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <Link
                  key={client._id}
                  to={`/app/management/clients/${client._id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{client.name}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
