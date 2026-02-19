import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Bell,
  Camera,
  ChevronRight,
  Info,
  Loader2,
  LogOut,
  Mail,
  Phone,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useAuth } from '@/components/auth/useAuth'

export const Route = createFileRoute('/app/_user/account')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user, signOut, deleteAt: expiresIn } = useAuth()
  const navigate = useNavigate()
  const updateUser = useMutation(api.users.updateUser)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isAboutDrawerOpen, setIsAboutDrawerOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const liveUser = useQuery(
    api.users.getUserById,
    user ? { userId: user._id } : 'skip',
  )
  const profileUser = liveUser ?? user

  // Fetch user stats
  const workoutStats = useQuery(
    api.workoutSessions.getSessionStats,
    user ? { userId: user._id } : 'skip',
  )

  const handleLogout = () => {
    signOut()
    navigate({ to: '/app/sign-in' })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60)
    const hours = Math.floor(minutes / 60)
    return hours > 0 ? `${hours}h` : `${minutes}m`
  }

  const memberSince = user
    ? new Date((profileUser ?? user).createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown'

  const expiresInDays =
    typeof expiresIn === 'number'
      ? Math.max(0, Math.ceil((expiresIn - Date.now()) / (1000 * 60 * 60 * 24)))
      : null

  const ceoAchievements = [
    '17 years in sports field',
    'Weight lifting (University medal bronze)',
    'Powerlifting gold medal',
    "Mr Tamil Nadu Men's Physique (Gold)",
    'VNR bodybuilding (Silver)',
    'Mr South India / Mr India participation',
    'MMA: Silambam national & international gold',
    'International referee and Tamil Nadu team coach',
    '10 years in fitness coaching',
  ]

  const successStories = [
    {
      title: '12 Week',
      subtitle: 'Cut',
      color: 'from-chart-1/20 to-chart-1/5',
    },
    {
      title: 'Muscle',
      subtitle: 'Gain',
      color: 'from-chart-2/20 to-chart-2/5',
    },
    {
      title: 'Post',
      subtitle: 'Pregnancy',
      color: 'from-chart-3/20 to-chart-3/5',
    },
  ]

  const gymBranches = ['Main Branch', 'West Branch', "Women's Exclusive Branch"]
  const transformationImages = [
    '/transformation/0.jpg',
    '/transformation/1.jpg',
    '/transformation/2.jpg',
    '/transformation/3.jpg',
    '/transformation/4.jpg',
    '/transformation/5.jpg',
  ]

  const openEditDrawer = () => {
    if (!profileUser) return
    setEditName(profileUser.name)
    setEditEmail(profileUser.email ?? '')
    setIsEditDrawerOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!profileUser) return

    const trimmedName = editName.trim()
    const trimmedEmail = editEmail.trim()

    if (!trimmedName) {
      toast.error('Name is required')
      return
    }

    try {
      await updateUser({
        userId: profileUser._id,
        name: trimmedName,
        email: trimmedEmail || undefined,
      })
      toast.success('Profile updated')
      setIsEditDrawerOpen(false)
    } catch {
      toast.error('Failed to update profile')
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground">
          Manage your profile and settings
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.name ?? 'Guest'}</h2>
              <p className="text-sm text-muted-foreground">
                Member since {memberSince}
              </p>
              {expiresInDays !== null ? (
                <p className="text-sm text-muted-foreground">
                  Expiring in {expiresInDays} days
                </p>
              ) : null}
            </div>
            <Button variant="outline" size="sm" onClick={openEditDrawer}>
              Edit
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{profileUser?.email ?? 'No email'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{profileUser?.phoneNumber ?? 'No phone'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Gallery */}
      <div className="grid grid-cols-2 gap-4">
        {/* Stats Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {!workoutStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {workoutStats.totalSessions}
                  </div>
                  <div className="text-xs text-muted-foreground">Workouts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatDuration(workoutStats.totalTime)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Time
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery Card */}
        <Link to="/app/gallery" className="block">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Gallery</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-primary mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                View Photos
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">Notifications</div>
                <div className="text-xs text-muted-foreground">
                  Manage notification preferences
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg leading-none">
                  CEO Nagaraj
                </h3>
                <p className="text-sm text-muted-foreground">
                  Founder & Head Coach
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  15+ years of fitness coaching with expertise in strength
                  training and nutrition.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAboutDrawerOpen(true)}
          >
            View Full About Us
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="space-y-2">
        <button className="w-full p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors">
          <div className="text-sm font-medium">Privacy Policy</div>
        </button>
        <button className="w-full p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors">
          <div className="text-sm font-medium">Terms of Service</div>
        </button>
        <div className="text-center text-xs text-muted-foreground py-2">
          Version 1.0.0
        </div>
      </div>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full"
        size="lg"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </Button>

      {/* Extra padding for bottom nav */}
      <div className="h-4" />

      <Drawer open={isAboutDrawerOpen} onOpenChange={setIsAboutDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setIsAboutDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <DrawerTitle>About Us</DrawerTitle>
            <DrawerDescription>
              Company details, achievements, and success stories
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="rounded-xl bg-muted/30 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-chart-3/10 flex items-center justify-center">
                  <Info className="w-4 h-4 text-chart-3" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Master Fitness started on 22.08.2022 and continues to grow.
                    We currently have 3 branches, including one dedicated to
                    women.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {gymBranches.map((branch) => (
                      <span
                        key={branch}
                        className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground"
                      >
                        {branch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-sm">CEO Achievements</div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {ceoAchievements.map((achievement) => (
                  <li key={achievement} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Success Stories</h3>
              <div className="grid grid-cols-3 gap-3">
                {successStories.map((story) => (
                  <div
                    key={`${story.title}-${story.subtitle}`}
                    className={`aspect-square rounded-lg bg-linear-to-br ${story.color} flex items-center justify-center border`}
                  >
                    <div className="text-center p-2">
                      <div className="text-xs font-medium">{story.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {story.subtitle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Transformations</h3>
              <div className="grid grid-cols-2 gap-3">
                {transformationImages.map((imagePath, index) => (
                  <div
                    key={imagePath}
                    className="rounded-lg border bg-muted/20 p-1"
                  >
                    <img
                      src={imagePath}
                      alt={`Transformation ${index + 1}`}
                      className="h-auto w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setIsEditDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <DrawerTitle>Edit Profile</DrawerTitle>
            <DrawerDescription>Update your account details</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input value={profileUser?.phoneNumber ?? ''} readOnly />
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleSaveProfile}>Save</Button>
            <Button
              variant="outline"
              onClick={() => setIsEditDrawerOpen(false)}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
