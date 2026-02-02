import {
  ChevronRight,
  Dumbbell,
  Edit2,
  Lock,
  Phone,
  Ruler,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    createdAt: number
  }
  trainers: Array<{
    _id: string
    name: string
  }>
  onBack: () => void
  onChangePin?: (userId: string) => void
  onAssignMeasurements?: (clientId: string) => void
}

export function ClientDetailView({
  client,
  trainers,
  onBack,
  onChangePin,
  onAssignMeasurements,
}: ClientDetailViewProps) {
  const trainerName = trainers.find((t) => t._id === client.trainerId)?.name

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
        <CardHeader>
          <CardTitle className="text-base">Client Information</CardTitle>
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
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  PIN Code
                </p>
                <p className="text-sm font-medium">{client.pin}</p>
              </div>
              <button
                onClick={() => onChangePin?.(client._id)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                title="Change PIN"
              >
                <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
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
            <Button
              onClick={() => onAssignMeasurements?.(client._id)}
              className="w-full"
            >
              Assign Measurements
            </Button>
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
