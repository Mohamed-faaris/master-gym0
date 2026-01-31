import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/_user/diet-logs')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-3xl font-bold">Diet Tracking Coming Soon</h1>
        <p className="text-muted-foreground">
          Nutrition logging will be integrated with the backend.
        </p>
      </div>
    </div>
  )
}
