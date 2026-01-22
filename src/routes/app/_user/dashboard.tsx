import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/_user/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/_user/dashboard"!</div>
}
