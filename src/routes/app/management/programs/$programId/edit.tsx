import { createFileRoute } from '@tanstack/react-router'
import { ProgramFormScreen } from '../new'
import type { Id } from '@convex/_generated/dataModel'

export const Route = createFileRoute(
  '/app/management/programs/$programId/edit',
)({
  component: ProgramEditRoute,
})

function ProgramEditRoute() {
  const { programId } = Route.useParams()

  return (
    <ProgramFormScreen
      mode="edit"
      programId={programId as Id<'routines'>}
    />
  )
}
