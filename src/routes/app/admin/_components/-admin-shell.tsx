import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { Dumbbell, Lock, Phone, User } from 'lucide-react'

import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useAuth } from '@/components/auth/useAuth'
import { Button } from '@/components/ui/button'
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
import { AdminBottomBar } from './-admin-bottom-bar'
import type { AdminRole, AdminUser } from './-admin-types'

interface AdminConsoleContextValue {
  user: AdminUser
  allUsers: AdminUser[]
  clients: AdminUser[]
  trainers: AdminUser[]
  isUsersLoading: boolean
  openCreateDrawer: () => void
  openEditDrawer: (userId: string) => void
  openChangePinDrawer: (userId: string) => void
  deleteUserById: (userId: string) => Promise<void>
  signOut: () => void
}

const AdminConsoleContext = createContext<AdminConsoleContextValue | null>(null)

export function useAdminConsole() {
  const ctx = useContext(AdminConsoleContext)
  if (!ctx) {
    throw new Error('useAdminConsole must be used within AdminShell')
  }
  return ctx
}

const superAdminRoles = new Set(['admin'])

const DEFAULT_ROLE: AdminRole = 'trainerManagedCustomer'

const roleLabelMap: Record<AdminRole, string> = {
  trainerManagedCustomer: 'Client (Trainer Managed)',
  selfManagedCustomer: 'Client (Self Managed)',
  trainer: 'Trainer',
  admin: 'Admin',
}

export function AdminShell() {
  const { user, isLoading, signOut } = useAuth()
  const navigate = useNavigate()

  const allUsersQuery = useQuery(api.users.getAllUsers)

  const createUser = useMutation(api.users.createUser)
  const updateUser = useMutation(api.users.updateUser)
  const deleteUser = useMutation(api.users.deleteUser)
  const updateUserMeta = useMutation(api.users.updateUserMeta)
  const saveMeasurements = useMutation(api.users.saveMeasurements)

  const [onboardDrawerOpen, setOnboardDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientPin, setNewClientPin] = useState('')
  const [newClientRole, setNewClientRole] = useState<AdminRole>(DEFAULT_ROLE)
  const [newClientGoal, setNewClientGoal] = useState('')
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

  const [changePinDrawerOpen, setChangePinDrawerOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isPinChanging, setIsPinChanging] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      navigate({ to: '/app/sign-in' })
      return
    }

    if (!superAdminRoles.has(user.role)) {
      navigate({ to: '/app/management' })
    }
  }, [user, isLoading, navigate])

  const allUsers = (allUsersQuery ?? []) as AdminUser[]

  const clients = useMemo(
    () =>
      allUsers.filter(
        (u) =>
          u.role === 'trainerManagedCustomer' ||
          u.role === 'selfManagedCustomer',
      ),
    [allUsers],
  )

  const trainers = useMemo(
    () => allUsers.filter((u) => u.role === 'trainer'),
    [allUsers],
  )

  const resetDrawerForm = () => {
    setNewClientName('')
    setNewClientPhone('')
    setNewClientPin('')
    setNewClientRole(DEFAULT_ROLE)
    setNewClientGoal('')
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

  const openEditDrawer = (userId: string) => {
    const target = allUsers.find((entry) => entry._id === userId)
    if (!target) return

    setDrawerMode('edit')
    setEditingUserId(userId)
    setNewClientName(target.name ?? '')
    setNewClientPhone(target.phoneNumber ?? '')
    setNewClientPin(target.pin ?? '')
    setNewClientRole(target.role ?? DEFAULT_ROLE)
    setNewClientGoal(target.goal ?? '')
    setSelectedFormTrainerId(target.trainerId ?? '')
    setClientAge(target.meta?.age !== undefined ? String(target.meta.age) : '')
    setCurrentWeight(
      target.meta?.currentWeight !== undefined
        ? String(target.meta.currentWeight)
        : '',
    )
    setTargetWeight(
      target.meta?.targetWeight !== undefined
        ? String(target.meta.targetWeight)
        : '',
    )
    setMeasurements({
      chest:
        target.measurements?.chest !== undefined
          ? String(target.measurements.chest)
          : '',
      shoulder:
        target.measurements?.shoulder !== undefined
          ? String(target.measurements.shoulder)
          : '',
      hip:
        target.measurements?.hip !== undefined
          ? String(target.measurements.hip)
          : '',
      arms:
        target.measurements?.arms !== undefined
          ? String(target.measurements.arms)
          : '',
      legs:
        target.measurements?.legs !== undefined
          ? String(target.measurements.legs)
          : '',
      timeSpanWeeks:
        target.measurements?.timeSpanWeeks !== undefined
          ? String(target.measurements.timeSpanWeeks)
          : '',
    })
    setOnboardDrawerOpen(true)
  }

  const deleteUserById = async (userId: string) => {
    await deleteUser({ userId: userId as Id<'users'> })
  }

  const openChangePinDrawer = (userId: string) => {
    setSelectedUserId(userId)
    setNewPin('')
    setConfirmPin('')
    setChangePinDrawerOpen(true)
  }

  const toNumberOrUndefined = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const parsed = Number(trimmed)
    return Number.isNaN(parsed) ? undefined : parsed
  }

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
              role: newClientRole,
              goal: newClientGoal || undefined,
              trainerId: selectedFormTrainerId
                ? (selectedFormTrainerId as Id<'users'>)
                : undefined,
            })
          : (editingUserId as Id<'users'>)

      if (drawerMode === 'edit' && editingUserId) {
        await updateUser({
          userId: editingUserId as Id<'users'>,
          name: newClientName,
          phoneNumber: newClientPhone,
          pin: newClientPin,
          role: newClientRole,
          goal: newClientGoal || undefined,
          trainerId: selectedFormTrainerId
            ? (selectedFormTrainerId as Id<'users'>)
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
          userId,
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
            userId,
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

  const handleLogout = () => {
    signOut()
    navigate({ to: '/app/sign-in' })
  }

  if (isLoading || !user || !superAdminRoles.has(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading admin console...
      </div>
    )
  }

  const contextValue: AdminConsoleContextValue = {
    user: user as AdminUser,
    allUsers,
    clients,
    trainers,
    isUsersLoading: allUsersQuery === undefined,
    openCreateDrawer,
    openEditDrawer,
    openChangePinDrawer,
    deleteUserById,
    signOut: handleLogout,
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <AdminConsoleContext.Provider value={contextValue}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-screen-sm pb-24">
          <header className="space-y-2 border-b border-border px-4 py-5">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
              Super Admin Console · {todayLabel}
            </p>
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold">Administration</h1>
              <Button asChild variant="outline" size="sm">
                <Link to="/app/management">Trainer View</Link>
              </Button>
            </div>
          </header>

          <main className="px-4 py-5">
            <Outlet />
          </main>
        </div>

        <AdminBottomBar onPlusClick={openCreateDrawer} />

        <Drawer open={changePinDrawerOpen} onOpenChange={setChangePinDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Change User PIN</DrawerTitle>
              <DrawerDescription>
                Update the PIN for the selected user.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-4 p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
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

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
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
                  if (!newPin || !confirmPin || newPin !== confirmPin) return
                  setIsPinChanging(true)
                  try {
                    await updateUser({
                      userId: selectedUserId as Id<'users'>,
                      pin: newPin,
                    })
                    setNewPin('')
                    setConfirmPin('')
                    setChangePinDrawerOpen(false)
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

        <Drawer open={onboardDrawerOpen} onOpenChange={setOnboardDrawerOpen}>
          <DrawerContent className="flex max-h-[85vh] flex-col">
            <DrawerHeader>
              <DrawerTitle>
                {drawerMode === 'create' ? 'Onboard New User' : 'Edit User'}
              </DrawerTitle>
              <DrawerDescription>
                {drawerMode === 'create'
                  ? 'Add a new client or trainer to the system.'
                  : 'Update user details.'}
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Full Name
                  </label>
                  <Input
                    placeholder="John Doe"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </label>
                  <Input
                    placeholder="+1234567890"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={newClientRole}
                    onValueChange={(value) => setNewClientRole(value as AdminRole)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trainerManagedCustomer">
                        {roleLabelMap.trainerManagedCustomer}
                      </SelectItem>
                      <SelectItem value="selfManagedCustomer">
                        {roleLabelMap.selfManagedCustomer}
                      </SelectItem>
                      <SelectItem value="trainer">{roleLabelMap.trainer}</SelectItem>
                      <SelectItem value="admin">{roleLabelMap.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Goal</label>
                  <Input
                    placeholder="e.g. Weight loss, muscle gain, or custom goal"
                    value={newClientGoal}
                    onChange={(e) => setNewClientGoal(e.target.value)}
                  />
                </div>

                {newClientRole === 'trainerManagedCustomer' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
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
                    <Input
                      type="number"
                      placeholder="Age"
                      value={clientAge}
                      onChange={(e) => setClientAge(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Current Weight (kg)"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Target Weight (kg)"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                    />
                  </>
                )}

                {newClientRole === 'trainerManagedCustomer' && (
                  <>
                    <Input
                      type="number"
                      placeholder="Chest (cm)"
                      value={measurements.chest}
                      onChange={(e) =>
                        setMeasurements({ ...measurements, chest: e.target.value })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Shoulder (cm)"
                      value={measurements.shoulder}
                      onChange={(e) =>
                        setMeasurements({
                          ...measurements,
                          shoulder: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Hip (cm)"
                      value={measurements.hip}
                      onChange={(e) =>
                        setMeasurements({ ...measurements, hip: e.target.value })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Arms (cm)"
                      value={measurements.arms}
                      onChange={(e) =>
                        setMeasurements({ ...measurements, arms: e.target.value })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Legs (cm)"
                      value={measurements.legs}
                      onChange={(e) =>
                        setMeasurements({ ...measurements, legs: e.target.value })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Time Span (weeks)"
                      value={measurements.timeSpanWeeks}
                      onChange={(e) =>
                        setMeasurements({
                          ...measurements,
                          timeSpanWeeks: e.target.value,
                        })
                      }
                    />
                  </>
                )}
              </div>
            </div>

            <DrawerFooter className="border-t border-border bg-background">
              <Button
                onClick={handleOnboardClient}
                disabled={
                  !newClientName || !newClientPhone || !newClientPin || isSubmitting
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
    </AdminConsoleContext.Provider>
  )
}
