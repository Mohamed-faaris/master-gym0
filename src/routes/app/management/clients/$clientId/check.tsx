import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/app/management/clients/$clientId/check',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/management/clients/$clientId/check"!</div>
}
