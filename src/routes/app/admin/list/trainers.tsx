import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/animate-ui/components/base/alert-dialog'

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
    openEditDrawer,
    deleteUserById,
  } = useAdminConsole()
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const selectedTrainer = trainers.find(
    (trainer) => trainer._id === selectedTrainerId,
  )

  const content = selectedTrainer ? (
    <TrainerDetailView
      trainer={selectedTrainer}
      clientCount={clients.length}
      clients={clients}
      onBack={() => setSelectedTrainerId(null)}
      onChangePin={openChangePinDrawer}
      onEditTrainer={openEditDrawer}
      onDeleteTrainer={() => {
        setDeleteDialogOpen(true)
      }}
    />
  ) : (
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

  return (
    <>
      {content}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trainer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will remove the trainer account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={async () => {
                if (!selectedTrainerId) return
                setIsDeleting(true)
                try {
                  await deleteUserById(selectedTrainerId)
                  setSelectedTrainerId(null)
                } finally {
                  setIsDeleting(false)
                }
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  )
}
