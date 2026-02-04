import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import {
  Activity,
  ChevronRight,
  Dumbbell,
  Lock,
  Phone,
  Plus,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'

import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { ClientDetailView, TrainerDetailView } from './-detail-views'

type Tab = 'clients' | 'trainers'

const superAdminRoles = new Set(['admin'])

export const Route = createFileRoute('/app/admin/')({
  component: SuperAdminDashboard,
})

function SuperAdminDashboard() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<Tab>('clients')
  const [onboardDrawerOpen, setOnboardDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // Form state for onboarding
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientPin, setNewClientPin] = useState('')
  const [newClientRole, setNewClientRole] = useState<string>(
    'trainerManagedCustomer',
  )
  const [selectedFormTrainerId, setSelectedFormTrainerId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientAge, setClientAge] = useState('')
  const [currentWeight, setCurrentWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [measurements, setMeasurements] = useState({
    chest: '',
    shoulder: '',
    hip: '',
    arms: '',
    legs: '',
    timeSpanWeeks: '',
  })

  // PIN change state
  const [changePinDrawerOpen, setChangePinDrawerOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isPinChanging, setIsPinChanging] = useState(false)

  // Detail view state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(
    null,
  )

  // Fetch all users
  const allUsers = useQuery(api.users.getAllUsers)

  // Update user mutation
  const updateUser = useMutation(api.users.updateUser)
  const updateUserMeta = useMutation(api.users.updateUserMeta)

  // Create user mutation
  const createUser = useMutation(api.users.createUser)
  const updateUserPin = useMutation(api.users.updateUserPin)
  const saveMeasurements = useMutation(api.users.saveMeasurements)

  // Filter clients and trainers
  const clients =
    allUsers?.filter(
      (u) =>
        u.role === 'trainerManagedCustomer' || u.role === 'selfManagedCustomer',
    ) ?? []

  const trainers =
    allUsers?.filter((u) => u.role === 'trainer' || u.role === 'admin') ?? []

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      navigate({ to: '/' })
      return
    }

    if (!superAdminRoles.has(user.role)) {
      navigate({ to: '/app/management' })
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <p className="text-sm tracking-[0.3em] uppercase">
          Loading super admin...
        </p>
      </div>
    )
  }

  if (!user || !superAdminRoles.has(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <Card className="max-w-md border-dashed">
          <CardHeader>
            <CardTitle>Super Admin Only</CardTitle>
            <CardDescription>
              Only administrators can access this console.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const resetDrawerForm = () => {
    setNewClientName('')
    setNewClientPhone('')
    setNewClientPin('')
    setNewClientRole('trainerManagedCustomer')
    setSelectedFormTrainerId('')
    setClientAge('')
    setCurrentWeight('')
    setTargetWeight('')
    setMeasurements({
      chest: '',
      shoulder: '',
      hip: '',
      arms: '',
      legs: '',
      timeSpanWeeks: '',
    })
  }

  const openCreateDrawer = () => {
    setDrawerMode('create')
    setEditingUserId(null)
    resetDrawerForm()
    setOnboardDrawerOpen(true)
  }

  const openEditDrawer = (clientId: string) => {
    const client = clients.find((c) => c._id === clientId)
    if (!client) return

    setDrawerMode('edit')
    setEditingUserId(clientId)
    setNewClientName(client.name ?? '')
    setNewClientPhone(client.phoneNumber ?? '')
    setNewClientPin(client.pin ?? '')
    setNewClientRole(client.role ?? 'trainerManagedCustomer')
    setSelectedFormTrainerId(client.trainerId ?? '')
    setClientAge(
      client.meta?.age !== undefined ? String(client.meta.age) : '',
    )
    setCurrentWeight(
      client.meta?.currentWeight !== undefined
        ? String(client.meta.currentWeight)
        : '',
    )
    setTargetWeight(
      client.meta?.targetWeight !== undefined
        ? String(client.meta.targetWeight)
        : '',
    )
    setMeasurements({
      chest:
        client.measurements?.chest !== undefined
          ? String(client.measurements.chest)
          : '',
      shoulder:
        client.measurements?.shoulder !== undefined
          ? String(client.measurements.shoulder)
          : '',
      hip:
        client.measurements?.hip !== undefined
          ? String(client.measurements.hip)
          : '',
      arms:
        client.measurements?.arms !== undefined
          ? String(client.measurements.arms)
          : '',
      legs:
        client.measurements?.legs !== undefined
          ? String(client.measurements.legs)
          : '',
      timeSpanWeeks:
        client.measurements?.timeSpanWeeks !== undefined
          ? String(client.measurements.timeSpanWeeks)
          : '',
    })
    setOnboardDrawerOpen(true)
  }

  const toNumberOrUndefined = (value: string) =>
    value.trim() === '' ? undefined : Number(value)

  const handleOnboardClient = async () => {
    if (!newClientName || !newClientPhone || !newClientPin) return

    setIsSubmitting(true)
    try {
      const userId =
        drawerMode === 'create'
              ? await createUser({
                  name: newClientName,
                  phoneNumber: newClientPhone,
                  pin: newClientPin,
                  role: newClientRole as
                    | 'trainerManagedCustomer'
                    | 'selfManagedCustomer'
                    | 'trainer'
                    | 'admin',
                  goal: 'generalFitness',
                  trainerId: selectedFormTrainerId
                    ? (selectedFormTrainerId as any)
                    : undefined,
                })
          : (editingUserId as any)

      if (drawerMode === 'edit' && editingUserId) {
        await updateUser({
          userId: editingUserId as any,
          name: newClientName,
          phoneNumber: newClientPhone,
          pin: newClientPin,
          role: newClientRole as any,
          trainerId: selectedFormTrainerId
            ? (selectedFormTrainerId as any)
            : undefined,
        })
      }

      const metaUpdates = {
        age: toNumberOrUndefined(clientAge),
        currentWeight: toNumberOrUndefined(currentWeight),
        targetWeight: toNumberOrUndefined(targetWeight),
      }

      const shouldUpdateMeta =
        metaUpdates.age !== undefined ||
        metaUpdates.currentWeight !== undefined ||
        metaUpdates.targetWeight !== undefined

      if (
        (newClientRole === 'trainerManagedCustomer' ||
          newClientRole === 'selfManagedCustomer') &&
        shouldUpdateMeta
      ) {
        await updateUserMeta({
          userId: userId as any,
          ...metaUpdates,
        })
      }

      if (newClientRole === 'trainerManagedCustomer') {
        const measurementUpdates = {
          chest: toNumberOrUndefined(measurements.chest),
          shoulder: toNumberOrUndefined(measurements.shoulder),
          hip: toNumberOrUndefined(measurements.hip),
          arms: toNumberOrUndefined(measurements.arms),
          legs: toNumberOrUndefined(measurements.legs),
          timeSpanWeeks: toNumberOrUndefined(measurements.timeSpanWeeks),
        }

        const shouldSaveMeasurements = Object.values(measurementUpdates).some(
          (value) => value !== undefined,
        )

        if (shouldSaveMeasurements) {
          await saveMeasurements({
            userId: userId as any,
            measurements: measurementUpdates,
          })
        }
      }

      resetDrawerForm()
      setOnboardDrawerOpen(false)
    } catch (error) {
      console.error('Failed to create user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="p-4 space-y-2 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Super Admin Console · {todayLabel}
        </p>
        <h1 className="text-xl font-semibold">Administration</h1>
      </header>

      {/* Content Area */}
      <main className="flex-1 p-4 space-y-6 pb-24">
        {activeTab === 'clients' &&
          (selectedClientId ? (
            <ClientDetailView
              client={clients.find((c) => c._id === selectedClientId)!}
              trainers={trainers}
              onBack={() => setSelectedClientId(null)}
              onEditClient={(clientId) => openEditDrawer(clientId)}
            />
          ) : (
            <ClientsView
              clients={clients}
              trainers={trainers}
              onSelectClient={(clientId) => setSelectedClientId(clientId)}
            />
          ))}
        {activeTab === 'trainers' &&
          (selectedTrainerId ? (
            <TrainerDetailView
              trainer={trainers.find((t) => t._id === selectedTrainerId)!}
              clientCount={clients.length}
              clients={clients}
              onBack={() => setSelectedTrainerId(null)}
              onChangePin={(userId) => {
                setSelectedUserId(userId)
                setChangePinDrawerOpen(true)
              }}
            />
          ) : (
            <TrainersView
              trainers={trainers}
              clientCount={clients.length}
              onSelectTrainer={(trainerId) => setSelectedTrainerId(trainerId)}
            />
          ))}
      </main>

      {/* Tab Navigation Bar - Bottom */}
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-between border-t border-border bg-muted/30">
        <div className="flex flex-1">
          {/* Clients Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-colors border-t-2',
              activeTab === 'clients'
                ? 'border-primary text-primary bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Add Button */}
          <button
            type="button"
            aria-label="Add new user"
            title="Add new user"
            onClick={openCreateDrawer}
            className="flex items-center justify-center px-6 py-4 border-x border-border bg-background hover:bg-muted/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Plus className="w-5 h-5" />
            </div>
          </button>

          {/* Trainers Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('trainers')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-medium transition-colors border-t-2',
              activeTab === 'trainers'
                ? 'border-primary text-primary bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <Dumbbell className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Change PIN Drawer */}
      <Drawer open={changePinDrawerOpen} onOpenChange={setChangePinDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Change User PIN</DrawerTitle>
            <DrawerDescription>
              Update the PIN for the selected user
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4 p-4">
            {/* New PIN */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                New PIN Code
              </label>
              <Input
                placeholder="0000"
                type="password"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
              />
            </div>

            {/* Confirm PIN */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Confirm PIN Code
              </label>
              <Input
                placeholder="0000"
                type="password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
              />
            </div>
          </div>

          <DrawerFooter>
            <Button
              onClick={async () => {
                if (!newPin || !confirmPin) return
                if (newPin !== confirmPin) {
                  alert('PINs do not match')
                  return
                }

                setIsPinChanging(true)
                try {
                  await updateUserPin({
                    userId: selectedUserId as any,
                    newPin,
                  })
                  setNewPin('')
                  setConfirmPin('')
                  setChangePinDrawerOpen(false)
                } catch (error) {
                  console.error('Failed to change PIN:', error)
                } finally {
                  setIsPinChanging(false)
                }
              }}
              disabled={
                !newPin || !confirmPin || newPin !== confirmPin || isPinChanging
              }
            >
              {isPinChanging ? 'Updating...' : 'Update PIN'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Onboard Client Drawer */}
      <Drawer open={onboardDrawerOpen} onOpenChange={setOnboardDrawerOpen}>
        <DrawerContent className="flex max-h-[85vh] flex-col">
          <DrawerHeader>
            <DrawerTitle>
              {drawerMode === 'create' ? 'Onboard New User' : 'Edit User'}
            </DrawerTitle>
          <DrawerDescription>
            {drawerMode === 'create'
              ? 'Add a new client or trainer to the system'
              : 'Update user details'}
          </DrawerDescription>
        </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 p-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Full Name
              </label>
              <Input
                placeholder="John Doe"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Phone Number
              </label>
              <Input
                placeholder="+1234567890"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
              />
            </div>

            {/* PIN */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                PIN Code
              </label>
              <Input
                placeholder="1234"
                type="password"
                maxLength={6}
                value={newClientPin}
                onChange={(e) => setNewClientPin(e.target.value)}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newClientRole} onValueChange={setNewClientRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trainerManagedCustomer">
                    Client (Trainer Managed)
                  </SelectItem>
                  <SelectItem value="selfManagedCustomer">
                    Client (Self Managed)
                  </SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assign Trainer (for clients) */}
            {newClientRole === 'trainerManagedCustomer' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-muted-foreground" />
                  Assign Trainer
                </label>
                <Select
                  value={selectedFormTrainerId}
                  onValueChange={setSelectedFormTrainerId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer._id} value={trainer._id}>
                        {trainer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(newClientRole === 'trainerManagedCustomer' ||
              newClientRole === 'selfManagedCustomer') && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age</label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={clientAge}
                    onChange={(e) => setClientAge(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Current Weight (kg)
                  </label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Target Weight (kg)
                  </label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                  />
                </div>
              </>
            )}

            {newClientRole === 'trainerManagedCustomer' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chest (cm)</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={measurements.chest}
                    onChange={(e) =>
                      setMeasurements({
                        ...measurements,
                        chest: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Shoulder (cm)</label>
                  <Input
                    type="number"
                    placeholder="110"
                    value={measurements.shoulder}
                    onChange={(e) =>
                      setMeasurements({
                        ...measurements,
                        shoulder: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hip (cm)</label>
                  <Input
                    type="number"
                    placeholder="95"
                    value={measurements.hip}
                    onChange={(e) =>
                      setMeasurements({ ...measurements, hip: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Arms (cm)</label>
                  <Input
                    type="number"
                    placeholder="35"
                    value={measurements.arms}
                    onChange={(e) =>
                      setMeasurements({ ...measurements, arms: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Legs (cm)</label>
                  <Input
                    type="number"
                    placeholder="55"
                    value={measurements.legs}
                    onChange={(e) =>
                      setMeasurements({ ...measurements, legs: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Time Span (weeks)
                  </label>
                  <Input
                    type="number"
                    placeholder="12"
                    value={measurements.timeSpanWeeks}
                    onChange={(e) =>
                      setMeasurements({
                        ...measurements,
                        timeSpanWeeks: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
            </div>
          </div>

          <DrawerFooter className="border-t bg-background">
            <Button
              onClick={handleOnboardClient}
              disabled={
                !newClientName ||
                !newClientPhone ||
                !newClientPin ||
                isSubmitting
              }
            >
              {isSubmitting
                ? drawerMode === 'create'
                  ? 'Creating...'
                  : 'Saving...'
                : drawerMode === 'create'
                  ? 'Create User'
                  : 'Save Changes'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Clients View                                  */
/* -------------------------------------------------------------------------- */

interface ClientsViewProps {
  clients: Array<{
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
  }>
  trainers: Array<{
    _id: string
    name: string
  }>
  onSelectClient?: (clientId: string) => void
}

function ClientsView({ clients, trainers, onSelectClient }: ClientsViewProps) {
  const trainerMap = new Map(trainers.map((t) => [t._id, t.name]))

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-xs text-muted-foreground">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    clients.filter((c) => c.role === 'trainerManagedCustomer')
                      .length
                  }
                </p>
                <p className="text-xs text-muted-foreground">Trainer Managed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Roster</CardTitle>
          <CardDescription>All registered clients</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No clients registered yet</p>
            </div>
          ) : (
            clients.map((client) => (
              <div
                key={client._id}
                onClick={() => onSelectClient?.(client._id)}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.role === 'trainerManagedCustomer'
                        ? 'Trainer Managed'
                        : 'Self Managed'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Trainers View                                 */
/* -------------------------------------------------------------------------- */

interface TrainersViewProps {
  trainers: Array<{
    _id: string
    name: string
    phoneNumber: string
    pin: string
    role: string
    createdAt: number
  }>
  clientCount: number
  onSelectTrainer?: (trainerId: string) => void
}

function TrainersView({
  trainers,
  clientCount,
  onSelectTrainer,
}: TrainersViewProps) {
  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trainers.length}</p>
                <p className="text-xs text-muted-foreground">Total Trainers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clientCount > 0 && trainers.length > 0
                    ? (clientCount / trainers.length).toFixed(1)
                    : '0'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg Clients/Trainer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainer List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trainer Roster</CardTitle>
          <CardDescription>All registered trainers and admins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {trainers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No trainers registered yet</p>
            </div>
          ) : (
            trainers.map((trainer) => (
              <div
                key={trainer._id}
                onClick={() => onSelectTrainer?.(trainer._id)}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="font-medium">{trainer.name}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
