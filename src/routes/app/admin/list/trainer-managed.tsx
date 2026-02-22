import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { ClientDetailView } from '../-detail-views'
import { useAdminConsole } from '../_components/-admin-shell'
import { PeopleList } from '../_components/-people-list'

export const Route = createFileRoute('/app/admin/list/trainer-managed')({
  component: TrainerManagedListPage,
})

function TrainerManagedListPage() {
  const { clients, trainers, isUsersLoading, openEditDrawer } = useAdminConsole()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const list = useMemo(
    () => clients.filter((client) => client.role === 'trainerManagedCustomer'),
    [clients],
  )

  const selectedClient = list.find((client) => client._id === selectedClientId)

  if (selectedClient) {
    return (
      <ClientDetailView
        client={selectedClient}
        trainers={trainers}
        onBack={() => setSelectedClientId(null)}
        onEditClient={openEditDrawer}
      />
    )
  }

  return (
    <PeopleList
      backTo="/app/admin/list"
      heading="Trainer Managed"
      subheading="Client Segment"
      emptyLabel="No trainer-managed clients yet."
      people={list}
      isLoading={isUsersLoading}
      onSelect={setSelectedClientId}
      kind="client"
    />
  )
}
