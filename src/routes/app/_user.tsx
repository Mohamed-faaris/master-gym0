import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { BottomNavigation } from '@/components/layout/BottomNavigation'
import { useAuth } from '@/components/auth/useAuth'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/app/_user')({
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
      } else if (user.role === 'admin') {
        // Admin should go to /admin
        navigate({ to: '/app/admin' })
      } else if (user.role === 'trainer') {
        // Trainer should go to management
        navigate({ to: '/app/management' })
      }
      // trainerManagedCustomer and selfManagedCustomer stay here
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.role === 'admin' || user.role === 'trainer') {
    return null
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: 'calc(5rem + var(--safe-bottom))' }}
    >
      <div className="max-w-screen-sm mx-auto">
        <Outlet />
      </div>
      <BottomNavigation />
    </div>
  )
}
