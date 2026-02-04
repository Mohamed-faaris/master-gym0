import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/management/')({
  beforeLoad: () => {
    throw redirect({
      to: '/app/management/clients',
    })
  },
})
