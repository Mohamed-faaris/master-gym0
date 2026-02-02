import {
  ChevronRight,
  Dumbbell,
  Edit2,
  Lock,
  Phone,
  Ruler,
  Target,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                           Client Detail View                              */
/* -------------------------------------------------------------------------- */

export interface ClientDetailViewProps {
  client: {
    _id: string
    name: string
    phoneNumber: string
    pin: string
    role: string
    goal: string
    trainerId?: string
    measurements?: {
      weight?: number
      chest?: number
      waist?: number
      hips?: number
      arms?: number
      thighs?: number
      calves?: number
      recordedAt?: number
    }
    createdAt: number
  }
  trainers: Array<{
    _id: string
    name: string
  }>
  onBack: () => void
  onChangePin?: (userId: string) => void
  onAssignMeasurements?: (clientId: string) => void
  onUpdateClient?: (clientId: string, updates: any) => Promise<void>
}

export function ClientDetailView({
  client,
  trainers,
  onBack,
  onChangePin,
  onAssignMeasurements,
  onUpdateClient,
}: ClientDetailViewProps) {
  const trainerName = trainers.find((t) => t._id === client.trainerId)?.name
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: client.name,
    phoneNumber: client.phoneNumber,
    pin: client.pin,
    goal: client.goal,
    role: client.role,
    trainerId: client.trainerId || '',
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back
        </button>
        <h2 className="text-lg font-semibold">{client.name}</h2>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Client Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Client Information</CardTitle>
          {!isEditModalOpen && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="Edit Information"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Name */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Full Name
              </p>
              <p className="text-sm font-medium">{client.name}</p>
            </div>

            {/* Phone */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Phone className="w-3 h-3" />
                Phone Number
              </p>
              <p className="text-sm font-medium">{client.phoneNumber}</p>
            </div>

            {/* PIN */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                PIN Code
              </p>
              <p className="text-sm font-medium">{client.pin}</p>
            </div>

            {/* Goal */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Target className="w-3 h-3" />
                Fitness Goal
              </p>
              <p className="text-sm font-medium capitalize">
                {client.goal.replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </div>

            {/* Role */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Role
              </p>
              <p className="text-sm font-medium capitalize">
                {client.role === 'trainerManagedCustomer'
                  ? 'Trainer Managed'
                  : 'Self Managed'}
              </p>
            </div>

            {/* Trainer */}
            {client.trainerId && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                  <Dumbbell className="w-3 h-3" />
                  Assigned Trainer
                </p>
                <p className="text-sm font-medium">
                  {trainerName ?? 'Unknown'}
                </p>
              </div>
            )}

            {/* Created */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Member Since
              </p>
              <p className="text-sm font-medium">
                {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Drawer open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Client Information</DrawerTitle>
            <DrawerDescription>Update client details</DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4 p-4 max-h-96 overflow-y-auto">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <Input
                value={editForm.phoneNumber}
                onChange={(e) =>
                  setEditForm({ ...editForm, phoneNumber: e.target.value })
                }
              />
            </div>

            {/* PIN */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                PIN Code
              </label>
              <Input
                type="password"
                maxLength={6}
                value={editForm.pin}
                onChange={(e) =>
                  setEditForm({ ...editForm, pin: e.target.value })
                }
              />
            </div>

            {/* Fitness Goal */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Fitness Goal
              </label>
              <Select
                value={editForm.goal}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, goal: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weightLoss">Weight Loss</SelectItem>
                  <SelectItem value="muscleGain">Muscle Gain</SelectItem>
                  <SelectItem value="endurance">Endurance</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="generalFitness">
                    General Fitness
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Client Role</label>
              <Select
                value={editForm.role}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trainerManagedCustomer">
                    Trainer Managed
                  </SelectItem>
                  <SelectItem value="selfManagedCustomer">
                    Self Managed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assigned Trainer */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Assigned Trainer
              </label>
              <Select
                value={editForm.trainerId}
                onValueChange={(value) =>
                  setEditForm({
                    ...editForm,
                    trainerId: value === 'unassigned' ? '' : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trainer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer._id} value={trainer._id}>
                      {trainer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DrawerFooter>
            <Button
              onClick={async () => {
                setIsSaving(true)
                try {
                  await onUpdateClient?.(client._id, {
                    name: editForm.name,
                    phoneNumber: editForm.phoneNumber,
                    pin: editForm.pin,
                    goal: editForm.goal,
                    role: editForm.role,
                    trainerId: editForm.trainerId || undefined,
                  })
                  setIsEditModalOpen(false)
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Assign Measurements - Only for Trainer Managed Clients */}
      {client.role === 'trainerManagedCustomer' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.measurements ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {client.measurements.weight && (
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-medium">
                        {client.measurements.weight} kg
                      </p>
                    </div>
                  )}
                  {client.measurements.chest && (
                    <div>
                      <p className="text-xs text-muted-foreground">Chest</p>
                      <p className="font-medium">
                        {client.measurements.chest} cm
                      </p>
                    </div>
                  )}
                  {client.measurements.waist && (
                    <div>
                      <p className="text-xs text-muted-foreground">Waist</p>
                      <p className="font-medium">
                        {client.measurements.waist} cm
                      </p>
                    </div>
                  )}
                  {client.measurements.hips && (
                    <div>
                      <p className="text-xs text-muted-foreground">Hips</p>
                      <p className="font-medium">
                        {client.measurements.hips} cm
                      </p>
                    </div>
                  )}
                  {client.measurements.arms && (
                    <div>
                      <p className="text-xs text-muted-foreground">Arms</p>
                      <p className="font-medium">
                        {client.measurements.arms} cm
                      </p>
                    </div>
                  )}
                  {client.measurements.thighs && (
                    <div>
                      <p className="text-xs text-muted-foreground">Thighs</p>
                      <p className="font-medium">
                        {client.measurements.thighs} cm
                      </p>
                    </div>
                  )}
                  {client.measurements.calves && (
                    <div>
                      <p className="text-xs text-muted-foreground">Calves</p>
                      <p className="font-medium">
                        {client.measurements.calves} cm
                      </p>
                    </div>
                  )}
                </div>
                {client.measurements.recordedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last recorded:{' '}
                    {new Date(
                      client.measurements.recordedAt,
                    ).toLocaleDateString()}
                  </p>
                )}
                <Button
                  onClick={() => onAssignMeasurements?.(client._id)}
                  variant="outline"
                  className="w-full"
                >
                  Update Measurements
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => onAssignMeasurements?.(client._id)}
                className="w-full"
              >
                Assign Measurements
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                          Trainer Detail View                              */
/* -------------------------------------------------------------------------- */

export interface TrainerDetailViewProps {
  trainer: {
    _id: string
    name: string
    phoneNumber: string
    pin: string
    role: string
    createdAt: number
  }
  clientCount: number
  onBack: () => void
  onChangePin?: (userId: string) => void
}

export function TrainerDetailView({
  trainer,
  clientCount,
  onBack,
  onChangePin,
}: TrainerDetailViewProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back
        </button>
        <h2 className="text-lg font-semibold">{trainer.name}</h2>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Trainer Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trainer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Name */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Full Name
              </p>
              <p className="text-sm font-medium">{trainer.name}</p>
            </div>

            {/* Phone */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Phone className="w-3 h-3" />
                Phone Number
              </p>
              <p className="text-sm font-medium">{trainer.phoneNumber}</p>
            </div>

            {/* PIN */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  PIN Code
                </p>
                <p className="text-sm font-medium">{trainer.pin}</p>
              </div>
              <button
                onClick={() => onChangePin?.(trainer._id)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                title="Change PIN"
              >
                <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            {/* Role */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Role
              </p>
              <span
                className={cn(
                  'text-sm px-2 py-1 rounded-full capitalize inline-block',
                  trainer.role === 'admin'
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-purple-500/10 text-purple-600',
                )}
              >
                {trainer.role}
              </span>
            </div>

            {/* Created */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Member Since
              </p>
              <p className="text-sm font-medium">
                {new Date(trainer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
