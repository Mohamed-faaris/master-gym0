import { Outlet, createFileRoute } from '@tanstack/react-router'
import { MobileAppShell } from '@/components/app/mobile-app-shell'

export const Route = createFileRoute('/app')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <MobileAppShell>
      <Outlet />
    </MobileAppShell>
  )
}
