import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/_user/diet-logs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/_user/dietLogs"!</div>
}
