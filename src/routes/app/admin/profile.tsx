import { Link, createFileRoute } from '@tanstack/react-router'
import { BookOpenText, FileText, Image as ImageIcon } from 'lucide-react'

import type { Id } from '@convex/_generated/dataModel'
import { useAdminConsole } from './_components/-admin-shell'
import { ProfileForm } from './_components/-profile-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/app/admin/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user, signOut } = useAdminConsole()

  return (
    <div className="space-y-5">
      <ProfileForm userId={user._id as Id<'users'>} onSignOut={signOut} />

      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/app/admin/profile-about">
              <BookOpenText className="mr-2 h-4 w-4" />
              About Us
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/app/admin/profile-images">
              <ImageIcon className="mr-2 h-4 w-4" />
              Images
            </Link>
          </Button>
          <Button asChild>
            <Link to="/app/admin/profile-stories">
              <FileText className="mr-2 h-4 w-4" />
              Stories
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
