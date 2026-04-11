import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/animate-ui/components/base/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/app/admin/profile-about')({
  component: ProfileAboutPage,
})

function sanitizeItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean)
}

function ProfileAboutPage() {
  const about = useQuery(api.aboutContent.getActiveAbout)

  const upsertAbout = useMutation(api.aboutContent.upsertAbout)

  const [aboutTitle, setAboutTitle] = useState('About Us')
  const [aboutSubtitle, setAboutSubtitle] = useState('Master Fitness')
  const [aboutParagraph, setAboutParagraph] = useState('')
  const [aboutBranches, setAboutBranches] = useState<string[]>([''])
  const [aboutAchievements, setAboutAchievements] = useState<string[]>([''])
  const [aboutFounderName, setAboutFounderName] = useState('')
  const [aboutFounderRole, setAboutFounderRole] = useState('')
  const [aboutFounderBio, setAboutFounderBio] = useState('')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!about) return
    setAboutTitle(about.title)
    setAboutSubtitle(about.subtitle ?? '')
    setAboutParagraph(about.paragraph)
    setAboutBranches(about.branchNames.length ? about.branchNames : [''])
    setAboutAchievements(about.achievements.length ? about.achievements : [''])
    setAboutFounderName(about.founderName ?? '')
    setAboutFounderRole(about.founderRole ?? '')
    setAboutFounderBio(about.founderBio ?? '')
  }, [about?._id])

  const handleSaveAbout = async () => {
    setIsSaving(true)
    try {
      await upsertAbout({
        aboutId: (about?._id as any) ?? undefined,
        title: aboutTitle,
        subtitle: aboutSubtitle || undefined,
        paragraph: aboutParagraph,
        branchNames: sanitizeItems(aboutBranches),
        achievements: sanitizeItems(aboutAchievements),
        founderName: aboutFounderName || undefined,
        founderRole: aboutFounderRole || undefined,
        founderBio: aboutFounderBio || undefined,
      })
      toast.success('About saved')
      setSaveDialogOpen(false)
    } catch {
      toast.error('Failed to save about')
    } finally {
      setIsSaving(false)
    }
  }

  const updateListItem = (
    setter: Dispatch<SetStateAction<string[]>>,
    index: number,
    value: string,
  ) => {
    setter((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    )
  }

  const addListItem = (setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => [...current, ''])
  }

  const removeListItem = (
    setter: Dispatch<SetStateAction<string[]>>,
    index: number,
  ) => {
    setter((current) => {
      if (current.length === 1) return ['']
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Profile Tab
        </p>
        <h1 className="text-3xl font-semibold text-foreground">About Us</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>About Us Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} placeholder="Title" />
          <Input value={aboutSubtitle} onChange={(e) => setAboutSubtitle(e.target.value)} placeholder="Subtitle" />
          <textarea value={aboutParagraph} onChange={(e) => setAboutParagraph(e.target.value)} placeholder="Paragraph" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Branches</p>
                <p className="text-xs text-muted-foreground">
                  Add or remove branch names from the UI.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addListItem(setAboutBranches)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Branch
              </Button>
            </div>
            <div className="space-y-2">
              {aboutBranches.map((branch, index) => (
                <div key={`branch-${index}`} className="flex items-center gap-2">
                  <Input
                    value={branch}
                    onChange={(e) => updateListItem(setAboutBranches, index, e.target.value)}
                    placeholder={`Branch ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem(setAboutBranches, index)}
                    aria-label={`Remove branch ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Achievements</p>
                <p className="text-xs text-muted-foreground">
                  Add or remove achievements without editing raw text blocks.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addListItem(setAboutAchievements)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Achievement
              </Button>
            </div>
            <div className="space-y-2">
              {aboutAchievements.map((achievement, index) => (
                <div key={`achievement-${index}`} className="flex items-start gap-2">
                  <Input
                    value={achievement}
                    onChange={(e) =>
                      updateListItem(setAboutAchievements, index, e.target.value)
                    }
                    placeholder={`Achievement ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem(setAboutAchievements, index)}
                    aria-label={`Remove achievement ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Input value={aboutFounderName} onChange={(e) => setAboutFounderName(e.target.value)} placeholder="Founder name" />
          <Input value={aboutFounderRole} onChange={(e) => setAboutFounderRole(e.target.value)} placeholder="Founder role" />
          <textarea value={aboutFounderBio} onChange={(e) => setAboutFounderBio(e.target.value)} placeholder="Founder bio" className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" />

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setSaveDialogOpen(true)} disabled={isSaving}>
              Save About
            </Button>
            <Button asChild variant="secondary">
              <Link to="/app/admin/profile">Back to Profile</Link>
            </Button>
          </div>

          <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <AlertDialogPopup>
              <AlertDialogHeader>
                <AlertDialogTitle>Save About Us changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will save the updated About Us content as active.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isSaving}
                  onClick={async (event) => {
                    event.preventDefault()
                    await handleSaveAbout()
                  }}
                >
                  {isSaving ? 'Saving...' : 'Confirm Save'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialog>
        </CardContent>
      </Card>
    </section>
  )
}
