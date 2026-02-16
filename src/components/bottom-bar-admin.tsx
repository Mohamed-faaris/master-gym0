import { Link, useRouterState } from '@tanstack/react-router'
import {
  ClipboardList,
  Plus,
  User,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import { useState } from 'react'
import type { ComponentType } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type AdminNavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const primaryNav: Array<AdminNavItem> = [
  { to: '/app/management/clients', label: 'Clients', icon: Users },
]

const secondaryNav: Array<AdminNavItem> = [
  { to: '/app/management/profile', label: 'Profile', icon: User },
]

interface BottomBarAdminProps {
  showUserIndicator?: boolean
  onPrimaryClick?: () => void
}

export function BottomBarAdmin({
  showUserIndicator = false,
  onPrimaryClick,
}: BottomBarAdminProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const router = useRouterState()
  const currentPath = router.location.pathname

  const isActive = (path: string) => {
    if (path === '/app/management') {
      return (
        currentPath === '/app/management' || currentPath === '/app/management/'
      )
    }
    return currentPath.startsWith(path)
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/90 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto px-2">
        {primaryNav.map((item) => (
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

        <button
          type="button"
          aria-label={
            onPrimaryClick ? 'Trigger primary action' : 'Open quick actions'
          }
          onClick={() => {
            if (onPrimaryClick) {
              onPrimaryClick()
              return
            }
            setDrawerOpen(true)
          }}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors hover:text-foreground"
        >
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Plus className="w-6 h-6" />
          </div>
        </button>

        {secondaryNav.map((item, index) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'relative flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors',
              isActive(item.to)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {showUserIndicator && index === secondaryNav.length - 1 && (
              <span className="absolute -top-1 right-5 h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </Link>
        ))}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Launch quick action</DrawerTitle>
            <DrawerDescription>
              Create program or diet plan for your clients.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 p-6">
            <Link to="/app/management/programs">
              <Button
                variant="outline"
                className="w-full h-16 justify-start gap-4"
                onClick={() => setDrawerOpen(false)}
              >
                <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-chart-2" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Create training program</p>
                  <p className="text-sm text-muted-foreground">
                    Design a new workout program.
                  </p>
                </div>
              </Button>
            </Link>

            <Link to="/app/management/diet-plans">
              <Button
                variant="outline"
                className="w-full h-16 justify-start gap-4"
                onClick={() => setDrawerOpen(false)}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Create diet plan</p>
                  <p className="text-sm text-muted-foreground">
                    Design a nutrition plan for clients.
                  </p>
                </div>
              </Button>
            </Link>
          </div>
        </DrawerContent>
      </Drawer>
    </nav>
  )
}
