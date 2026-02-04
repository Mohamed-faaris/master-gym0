import { ChevronRight, Dumbbell, Edit2, Lock, Phone } from 'lucide-react'
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
    meta?: {
      age?: number
      currentWeight?: number
      targetWeight?: number
    } | null
    measurements?: {
      chest?: number
      shoulder?: number
      hip?: number
      arms?: number
      legs?: number
      timeSpanWeeks?: number
      updatedAt?: number
    } | null
    createdAt: number
  }
  trainers: Array<{
    _id: string
    name: string
  }>
  onBack: () => void
  onEditClient?: (clientId: string) => void
}

export function ClientDetailView({
  client,
  trainers,
  onBack,
  onEditClient,
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Client Information</CardTitle>
          <Button
            onClick={() => onEditClient?.(client._id)}
            variant="outline"
            size="sm"
          >
            Edit
          </Button>
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

            {/* Age */}
            {client.meta?.age !== undefined && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Age
                </p>
                <p className="text-sm font-medium">{client.meta.age}</p>
              </div>
            )}

            {/* Current Weight */}
            {client.meta?.currentWeight !== undefined && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Current Weight
                </p>
                <p className="text-sm font-medium">
                  {client.meta.currentWeight} kg
                </p>
              </div>
            )}

            {/* Target Weight */}
            {client.meta?.targetWeight !== undefined && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Target Weight
                </p>
                <p className="text-sm font-medium">
                  {client.meta.targetWeight} kg
                </p>
              </div>
            )}

            {/* Member Since */}
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

      {/* Measurements - Only for Trainer Managed Clients */}
      {client.role === 'trainerManagedCustomer' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            {client.measurements ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {client.measurements.chest && (
                    <div>
                      <p className="text-xs text-muted-foreground">Chest</p>
                      <p className="font-medium">
                        {client.measurements.chest} cm
                      </p>
                    </div>
                  )}
                  {client.measurements.shoulder && (
                    <div>
                      <p className="text-xs text-muted-foreground">Shoulder</p>
                      <p className="font-medium">
                        {client.measurements.shoulder} cm
                      </p>
                    </div>
                  )}
                  {client.measurements.hip && (
                    <div>
                      <p className="text-xs text-muted-foreground">Hip</p>
                      <p className="font-medium">
                        {client.measurements.hip} cm
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
                  {client.measurements.legs && (
                    <div>
                      <p className="text-xs text-muted-foreground">Legs</p>
                      <p className="font-medium">
                        {client.measurements.legs} cm
                      </p>
                    </div>
                  )}
                  {client.measurements.timeSpanWeeks && (
                    <div>
                      <p className="text-xs text-muted-foreground">Time Span</p>
                      <p className="font-medium">
                        {client.measurements.timeSpanWeeks} weeks
                      </p>
                    </div>
                  )}
                </div>
                {client.measurements.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last updated:{' '}
                    {new Date(
                      client.measurements.updatedAt,
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No measurements recorded yet.
              </p>
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
  clients: Array<{
    _id: string
    name: string
    role: string
    trainerId?: string
  }>
  onBack: () => void
  onChangePin?: (userId: string) => void
}

export function TrainerDetailView({
  trainer,
  clientCount,
  clients,
  onBack,
  onChangePin,
}: TrainerDetailViewProps) {
  const trainerClients = clients.filter(
    (client) => client.trainerId === trainer._id,
  )

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned Clients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {trainerClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No clients assigned yet.
            </p>
          ) : (
            trainerClients.map((client) => (
              <div
                key={client._id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.role === 'trainerManagedCustomer'
                      ? 'Trainer Managed'
                      : 'Self Managed'}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
