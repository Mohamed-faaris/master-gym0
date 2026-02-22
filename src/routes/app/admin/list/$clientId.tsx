import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { ClientDetailView } from '../-detail-views'
import { useAdminConsole } from '../_components/-admin-shell'
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

export const Route = createFileRoute('/app/admin/list/$clientId')({
  component: AdminClientDetailPage,
})

function AdminClientDetailPage() {
  const navigate = useNavigate()
  const { clientId } = Route.useParams()
  const { clients, trainers, openEditDrawer, deleteUserById } = useAdminConsole()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const client = clients.find((entry) => entry._id === clientId)

  if (!client) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Client not found.
      </div>
    )
  }

  const backTo =
    client.role === 'selfManagedCustomer'
      ? '/app/admin/list/self-managed'
      : '/app/admin/list/trainer-managed'

  return (
    <>
      <ClientDetailView
        client={client}
        trainers={trainers}
        onBack={() => navigate({ to: backTo })}
        onEditClient={openEditDrawer}
        onDeleteClient={() => setDeleteDialogOpen(true)}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will remove the client account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true)
                try {
                  await deleteUserById(client._id)
                  navigate({ to: backTo })
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
