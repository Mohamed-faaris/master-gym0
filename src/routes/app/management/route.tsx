import { Outlet, createFileRoute } from '@tanstack/react-router'
import { BottomBarAdmin } from '@/components/bottom-bar-admin'

export const Route = createFileRoute('/app/management')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <Outlet />
      <BottomBarAdmin />
    </div>
  )
}
