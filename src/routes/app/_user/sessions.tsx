import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/_user/sessions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/_user/sessions"!</div>
}
