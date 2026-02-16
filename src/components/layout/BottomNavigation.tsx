import * as React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Home, Dumbbell, User, Scale, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const navItems: NavItem[] = [
  { to: '/app/', icon: Home, label: 'Dashboard' },
  { to: '/app/diet-plan', icon: Utensils, label: 'Diets' },
  { to: '/app/workouts', icon: Dumbbell, label: 'Workout' },
  { to: '/app/weight', icon: Scale, label: 'Weight' },
  { to: '/app/account', icon: User, label: 'Account' },
]

export function BottomNavigation() {
  const router = useRouterState()
  const currentPath = router.location.pathname

  const normalizePath = (path: string) =>
    path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path

  const isActive = (path: string) => {
    const normalizedPath = normalizePath(path)
    const normalizedCurrent = normalizePath(currentPath)

    if (normalizedPath === '/app' || normalizedPath === '/app/_user') {
      return normalizedCurrent === normalizedPath
    }

    return (
      normalizedCurrent === normalizedPath ||
      normalizedCurrent.startsWith(`${normalizedPath}/`)
    )
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg pb-safe">
        <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto px-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors',
                isActive(item.to)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
