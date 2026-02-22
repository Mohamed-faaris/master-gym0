import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { TrainerDetailView } from '../-detail-views'
import { useAdminConsole } from '../_components/-admin-shell'
import { PeopleList } from '../_components/-people-list'

export const Route = createFileRoute('/app/admin/list/trainers')({
  component: TrainersListPage,
})

function TrainersListPage() {
  const {
    trainers,
    clients,
    isUsersLoading,
    openChangePinDrawer,
  } = useAdminConsole()
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null)

  const selectedTrainer = trainers.find(
    (trainer) => trainer._id === selectedTrainerId,
  )

  if (selectedTrainer) {
    return (
      <TrainerDetailView
        trainer={selectedTrainer}
        clientCount={clients.length}
        clients={clients}
        onBack={() => setSelectedTrainerId(null)}
        onChangePin={openChangePinDrawer}
      />
    )
  }

  return (
    <PeopleList
      backTo="/app/admin/list"
      heading="Trainers"
      subheading="Coach Roster"
      emptyLabel="No trainers registered yet."
      people={trainers}
      isLoading={isUsersLoading}
      onSelect={setSelectedTrainerId}
      kind="trainer"
    />
  )
}
