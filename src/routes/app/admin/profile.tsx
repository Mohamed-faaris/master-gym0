import { createFileRoute } from '@tanstack/react-router'

import type { Id } from '@convex/_generated/dataModel'
import { useAdminConsole } from './_components/-admin-shell'
import { ProfileForm } from './_components/-profile-form'

export const Route = createFileRoute('/app/admin/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user, signOut } = useAdminConsole()

  return <ProfileForm userId={user._id as Id<'users'>} onSignOut={signOut} />
}
