import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/_user/about')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/_user/about"!</div>
}
