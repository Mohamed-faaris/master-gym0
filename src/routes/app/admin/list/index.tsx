import { createFileRoute } from '@tanstack/react-router'
import { Dumbbell, ShieldUser, Users } from 'lucide-react'

import { ListCard } from '../_components/-list-card'
import { useAdminConsole } from '../_components/-admin-shell'

export const Route = createFileRoute('/app/admin/list/')({
  component: ListsHubPage,
})

function ListsHubPage() {
  const { clients, trainers, isUsersLoading } = useAdminConsole()

  const selfManagedCount = clients.filter(
    (client) => client.role === 'selfManagedCustomer',
  ).length
  const trainerManagedCount = clients.filter(
    (client) => client.role === 'trainerManagedCustomer',
  ).length

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Navigator</p>
        <h1 className="text-3xl font-semibold text-foreground">People Lists</h1>
        <p className="text-sm text-muted-foreground">Choose a roster and drill into details.</p>
      </header>

      <div className="grid gap-3">
        <ListCard
          to="/app/admin/list/self-managed"
          title="Self Managed"
          description="Clients training independently."
          count={isUsersLoading ? 0 : selfManagedCount}
          icon={ShieldUser}
        />
        <ListCard
          to="/app/admin/list/trainer-managed"
          title="Trainer Managed"
          description="Clients assigned to trainers."
          count={isUsersLoading ? 0 : trainerManagedCount}
          icon={Users}
        />
        <ListCard
          to="/app/admin/list/trainers"
          title="Trainers"
          description="Active coaching staff roster."
          count={isUsersLoading ? 0 : trainers.length}
          icon={Dumbbell}
        />
      </div>
    </section>
  )
}
