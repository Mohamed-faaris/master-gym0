import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth/useAuth'

export const Route = createFileRoute('/app/management/test-integration')({
  component: TestIntegrationPage,
})

function TestIntegrationPage() {
  const { user } = useAuth()
  const seedDatabase = useMutation(api.seed.seedDatabase)
  const clearDatabase = useMutation(api.seed.clearDatabase)  

  const allUsers = useQuery(api.users.getAllUsers)
  const trainingPlans = useQuery(api.trainingPlans.getAllTrainingPlans)
  const dietPlans = useQuery(
    api.dietPlans.getDietPlansByUser,
    user ? { userId: user._id } : 'skip',
  )

  const handleSeed = async () => {
    try {
      const result = await seedDatabase()
      toast.success('Database seeded successfully!')
      console.log('Seed result:', result)
    } catch (error) {
      toast.error('Failed to seed database')
      console.error('Seed error:', error)
    }
  }

  const handleClear = async () => {
    if (
      !confirm(
        'Are you sure you want to clear ALL data? This cannot be undone!',
      )
    ) {
      return
    }

    try {
      const result = await clearDatabase()
      toast.success('Database cleared successfully!')
      console.log('Clear result:', result)
    } catch (error) {
      toast.error('Failed to clear database')
      console.error('Clear error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Backend Integration Test</h1>
        <p className="text-muted-foreground mt-2">
          Test all backend functions and seed the database
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Database Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleSeed} className="flex-1">
              Seed Database
            </Button>
            <Button
              onClick={handleClear}
              variant="destructive"
              className="flex-1"
            >
              Clear Database
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{allUsers?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {trainingPlans?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diet Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{dietPlans?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {allUsers && allUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allUsers.map((usr) => (
                <div
                  key={usr._id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <div className="font-medium">{usr.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {usr.phoneNumber} • {usr.role}
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                    {usr.goal}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
