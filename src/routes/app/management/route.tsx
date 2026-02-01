import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

import { BottomBarAdmin } from '@/components/bottom-bar-admin'
import { useAuth } from '@/components/auth/useAuth'

export const Route = createFileRoute('/app/management')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in, redirect to sign-in
        navigate({ to: '/app/sign-in' })
      } else if (user.role !== 'admin' && user.role !== 'trainer') {
        // Regular users should go to app
        navigate({ to: '/app' })
      }
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || (user.role !== 'admin' && user.role !== 'trainer')) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-screen-sm">
        <Outlet />
      </div>
      <BottomBarAdmin />
    </div>
  )
}
