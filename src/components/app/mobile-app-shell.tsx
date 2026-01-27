import * as React from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import {
  CircleUser,
  Dumbbell,
  LayoutDashboard,
  NotebookText,
  Plus,
  Salad,
  Scale,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  React.useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  React.useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-dvh bg-[color:var(--app-bg)] text-foreground">
      <div className="app-atmosphere" aria-hidden />

      <div className="mx-auto w-full max-w-[430px]">
        <div className="relative">
          {children}
          <div className="h-24" aria-hidden />
        </div>
      </div>

      <button
        id="app-drawer-trigger"
        type="button"
        className="sr-only"
        onClick={() => setDrawerOpen(true)}
      />

      <nav className="fixed bottom-0 left-0 right-0 z-30">
        <div className="mx-auto w-full max-w-[430px] px-4 pb-4">
          <div className="app-bottomBar">
            <NavButton
              active={location.pathname.startsWith('/app/dashboard')}
              onClick={() => navigate({ to: '/app/dashboard' })}
              label="Dashboard"
              icon={<LayoutDashboard className="size-5" />}
            />
            <NavButton
              active={location.pathname.startsWith('/app/workouts')}
              onClick={() => navigate({ to: '/app/workouts' })}
              label="Workouts"
              icon={<Dumbbell className="size-5" />}
            />

            <Button
              type="button"
              aria-label="Open actions"
              onClick={() => setDrawerOpen(true)}
              className="app-plusButton"
            >
              <Plus className="size-5" />
            </Button>

            <NavButton
              active={location.pathname.startsWith('/app/logs')}
              onClick={() => navigate({ to: '/app/logs' })}
              label="Logs"
              icon={<NotebookText className="size-5" />}
            />
            <NavButton
              active={location.pathname.startsWith('/app/account')}
              onClick={() => navigate({ to: '/app/account' })}
              label="Account"
              icon={<CircleUser className="size-5" />}
            />
          </div>
        </div>
      </nav>

      <div
        className={cn('app-drawerScrim', drawerOpen && 'is-open')}
        onClick={() => setDrawerOpen(false)}
        aria-hidden
      />
      <div className={cn('app-drawer', drawerOpen && 'is-open')}>
        <div className="mx-auto w-full max-w-[430px] px-4 pb-5">
          <div className="app-drawerPanel" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Actions
                </div>
                <div className="mt-1 app-title text-[18px]">Move now</div>
              </div>
              <Button
                variant="ghost"
                className="rounded-xl"
                onClick={() => setDrawerOpen(false)}
              >
                Close
              </Button>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="app-actionRow"
                onClick={() => {
                  setDrawerOpen(false)
                  navigate({ to: '/app/workouts' })
                }}
              >
                <div className="app-actionIcon">
                  <Dumbbell className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Start New Workout</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Jump to today’s plan
                  </div>
                </div>
              </button>
              <button type="button" className="app-actionRow" disabled>
                <div className="app-actionIcon">
                  <Scale className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Log Weight</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Form not implemented
                  </div>
                </div>
              </button>
              <button type="button" className="app-actionRow" disabled>
                <div className="app-actionIcon">
                  <Salad className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Log Diet</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Form not implemented
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('app-navButton', active && 'is-active')}
      aria-current={active ? 'page' : undefined}
    >
      {icon}
      <span className="text-[10px] font-medium tracking-[0.12em]">{label}</span>
    </button>
  )
}
