import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/management/clients/')({
  beforeLoad: () => {
    throw redirect({
      to: '/app/management',
    })
  },
})
