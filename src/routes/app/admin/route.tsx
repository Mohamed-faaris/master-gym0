import { createFileRoute } from '@tanstack/react-router'

import { AdminShell } from './_components/-admin-shell'

export const Route = createFileRoute('/app/admin')({
  component: AdminShell,
})
