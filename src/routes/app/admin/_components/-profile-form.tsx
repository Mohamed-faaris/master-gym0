import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useNavigate } from '@tanstack/react-router'
import {
  Calendar,
  LogOut,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  Save,
  Shield,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Id } from '@convex/_generated/dataModel'

interface ProfileFormProps {
  userId: Id<'users'>
  onSignOut: () => void
}

function valueOrDash(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : 'Not provided'
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium text-right">{value}</p>
    </div>
  )
}

export function ProfileForm({ userId, onSignOut }: ProfileFormProps) {
  const navigate = useNavigate()
  const profile = useQuery(api.users.getUserWithMeta, { userId })
  const aboutPreview = useQuery(api.aboutContent.getActiveAbout)
  const transformationPreview = useQuery(
    api.transformationImages.listActiveTransformationImages,
  )
  const updateUser = useMutation(api.users.updateUser)
  const updateUserMeta = useMutation(api.users.updateUserMeta)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!profile) return
    setName(profile.name ?? '')
    setEmail(profile.email ?? '')
    setPhoneNumber(profile.phoneNumber ?? '')
    setAddress(profile.meta?.address ?? '')
  }, [profile])

  const canSave = useMemo(() => {
    return isEditing && !!name.trim() && !!phoneNumber.trim() && !isSaving
  }, [isEditing, name, phoneNumber, isSaving])

  const resetEditValues = () => {
    if (!profile) return
    setName(profile.name ?? '')
    setEmail(profile.email ?? '')
    setPhoneNumber(profile.phoneNumber ?? '')
    setAddress(profile.meta?.address ?? '')
  }

  const handleSave = async () => {
    if (!canSave) return

    setIsSaving(true)
    try {
      await updateUser({
        userId,
        name: name.trim(),
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim(),
      })

      await updateUserMeta({
        userId,
        address: address.trim() || undefined,
      })

      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : 'Unknown'

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Review account information and update only when needed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  resetEditValues()
                  setIsEditing(false)
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!canSave}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <PencilLine className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => {
              onSignOut()
              navigate({ to: '/app/sign-in' })
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">{valueOrDash(name)}</h2>
              <p className="text-sm text-muted-foreground capitalize">
                {profile?.role ?? 'admin'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
          <CardDescription>Primary communication details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing ? (
            <div className="grid gap-3">
              <Input
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Input
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          ) : (
            <>
              <InfoRow icon={Mail} label="Email" value={valueOrDash(email)} />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={valueOrDash(phoneNumber)}
              />
              <InfoRow
                icon={MapPin}
                label="Address"
                value={valueOrDash(address)}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Details</CardTitle>
          <CardDescription>Administrative account metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow
            icon={Shield}
            label="Role"
            value={valueOrDash(profile?.role)}
          />
          <InfoRow icon={Calendar} label="Member Since" value={joinDate} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Us Preview</CardTitle>
          <CardDescription>
            Live preview from active content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border bg-background px-3 py-3">
            <p className="text-sm font-medium">
              {aboutPreview?.title ?? 'No active About Us yet'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {aboutPreview?.paragraph ?? 'Publish About Us content to preview here.'}
            </p>
          </div>
          <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2 pr-1">
              {(transformationPreview ?? []).map((image, index) => (
                <div key={image._id} className="shrink-0 overflow-hidden rounded-md border">
                  <img
                    src={image.imageUrl}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              {!transformationPreview?.length ? (
                <div className="rounded-md border px-3 py-6 text-xs text-muted-foreground">
                  No active transformation images.
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
