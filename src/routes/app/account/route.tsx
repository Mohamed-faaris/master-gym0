import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/account')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
