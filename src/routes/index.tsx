import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/components/auth/useAuth'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate({ to: '/app/sign-in' })
      } else {
        // Redirect based on role
        switch (user.role) {
          case 'admin':
            navigate({ to: '/app/management/superadmin' })
            break
          case 'trainer':
            navigate({ to: '/app/management' })
            break
          case 'trainerManagedCustomer':
          case 'selfManagedCustomer':
          default:
            navigate({ to: '/app' })
            break
        }
      }
    }
  }, [user, isLoading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
