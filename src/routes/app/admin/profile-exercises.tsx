import { createFileRoute } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '@convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/app/admin/profile-exercises')({
  component: ProfileExercisesPage,
})

function ProfileExercisesPage() {
  const exercises = useQuery(api.exercises.getNames) ?? []
  const addExercise = useMutation(api.exercises.add)
  const removeExercise = useMutation(api.exercises.remove)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAdd = async () => {
    if (!newExerciseName.trim()) {
      toast.error('Exercise name is required')
      return
    }

    setIsAdding(true)
    try {
      await addExercise({ name: newExerciseName.trim() })
      setNewExerciseName('')
      setShowAddForm(false)
      toast.success('Exercise added')
    } catch (error) {
      toast.error('Failed to add exercise')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async (name: string) => {
    try {
      await removeExercise({ name })
      toast.success('Exercise removed')
    } catch (error) {
      toast.error('Failed to remove exercise')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Exercises</h1>
          <p className="text-muted-foreground">
            Add or remove exercises from the list
          </p>
        </div>
        {!showAddForm ? (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Exercise
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Exercise name"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-48"
            />
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        {exercises.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No exercises found. Add some exercises to get started.
          </p>
        ) : (
          exercises.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span className="font-medium">{name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleRemove(name)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
