import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'

import { useAdminConsole } from '../_components/-admin-shell'
import { PeopleList } from '../_components/-people-list'

export const Route = createFileRoute('/app/admin/list/self-managed')({
  component: SelfManagedListPage,
})

function SelfManagedListPage() {
  const { clients, isUsersLoading } = useAdminConsole()

  const list = useMemo(
    () => clients.filter((client) => client.role === 'selfManagedCustomer'),
    [clients],
  )

  return (
    <PeopleList
      backTo="/app/admin/list"
      heading="Self Managed"
      subheading="Client Segment"
      emptyLabel="No self-managed clients yet."
      people={list}
      isLoading={isUsersLoading}
      getTo={(clientId) => `/app/admin/list/${clientId}`}
      kind="client"
    />
  )
}
