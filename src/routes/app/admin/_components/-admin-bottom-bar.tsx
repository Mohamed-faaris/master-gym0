import { Link, useRouterState } from '@tanstack/react-router'
import { ListChecks, Plus, UserRound } from 'lucide-react'

import { cn } from '@/lib/utils'

interface AdminBottomBarProps {
  onPlusClick: () => void
}

export function AdminBottomBar({ onPlusClick }: AdminBottomBarProps) {
  const router = useRouterState()
  const currentPath = router.location.pathname

  const listsActive = currentPath.startsWith('/app/admin/list')
  const profileActive = currentPath.startsWith('/app/admin/profile')

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-safe shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto grid h-20 max-w-screen-sm grid-cols-3 px-2">
        <Link
          to="/app/admin/list"
          className={cn(
            'flex h-full flex-col items-center justify-center gap-1 rounded-xl text-xs transition-all',
            listsActive
              ? 'text-primary'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
          )}
        >
          <ListChecks className="h-5 w-5" />
          <span className="tracking-[0.2em] uppercase">Lists</span>
        </Link>

        <button
          type="button"
          aria-label="Add new user"
          onClick={onPlusClick}
          className="flex h-full items-center justify-center"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105">
            <Plus className="h-6 w-6" />
          </span>
        </button>

        <Link
          to="/app/admin/profile"
          className={cn(
            'flex h-full flex-col items-center justify-center gap-1 rounded-xl text-xs transition-all',
            profileActive
              ? 'text-primary'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
          )}
        >
          <UserRound className="h-5 w-5" />
          <span className="tracking-[0.2em] uppercase">Profile</span>
        </Link>
      </div>
    </nav>
  )
}
