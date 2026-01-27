import { Outlet, createFileRoute } from '@tanstack/react-router'
import { BottomNavigation } from '@/components/layout/BottomNavigation'

export const Route = createFileRoute('/app/_user')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-sm mx-auto">
        <Outlet />
      </div>
      <BottomNavigation />
    </div>
  )
}
