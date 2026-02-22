import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/app/admin/profile-about')({
  component: ProfileAboutPage,
})

const STATUSES = ['active', 'draft', 'inactive'] as const

type ContentStatus = (typeof STATUSES)[number]

function toLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function ProfileAboutPage() {
  const aboutRows = useQuery(api.aboutContent.getAllAbout) ?? []
  const about = aboutRows[0]

  const upsertAbout = useMutation(api.aboutContent.upsertAbout)
  const setAboutStatus = useMutation(api.aboutContent.setAboutStatus)
  const deleteAbout = useMutation(api.aboutContent.deleteAbout)

  const [aboutTitle, setAboutTitle] = useState('About Us')
  const [aboutSubtitle, setAboutSubtitle] = useState('Master Fitness')
  const [aboutParagraph, setAboutParagraph] = useState('')
  const [aboutBranches, setAboutBranches] = useState('')
  const [aboutAchievements, setAboutAchievements] = useState('')
  const [aboutFounderName, setAboutFounderName] = useState('')
  const [aboutFounderRole, setAboutFounderRole] = useState('')
  const [aboutFounderBio, setAboutFounderBio] = useState('')
  const [aboutStatus, setAboutStatusValue] = useState<ContentStatus>('active')

  useEffect(() => {
    if (!about) return
    setAboutTitle(about.title)
    setAboutSubtitle(about.subtitle ?? '')
    setAboutParagraph(about.paragraph)
    setAboutBranches(about.branchNames.join('\n'))
    setAboutAchievements(about.achievements.join('\n'))
    setAboutFounderName(about.founderName ?? '')
    setAboutFounderRole(about.founderRole ?? '')
    setAboutFounderBio(about.founderBio ?? '')
    setAboutStatusValue(about.status as ContentStatus)
  }, [about?._id])

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
          <textarea value={aboutBranches} onChange={(e) => setAboutBranches(e.target.value)} placeholder="Branch names (one per line)" className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          <textarea value={aboutAchievements} onChange={(e) => setAboutAchievements(e.target.value)} placeholder="Achievements (one per line)" className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          <Input value={aboutFounderName} onChange={(e) => setAboutFounderName(e.target.value)} placeholder="Founder name" />
          <Input value={aboutFounderRole} onChange={(e) => setAboutFounderRole(e.target.value)} placeholder="Founder role" />
          <textarea value={aboutFounderBio} onChange={(e) => setAboutFounderBio(e.target.value)} placeholder="Founder bio" className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          <Select value={aboutStatus} onValueChange={(value) => setAboutStatusValue(value as ContentStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                try {
                  await upsertAbout({
                    aboutId: (about?._id as any) ?? undefined,
                    title: aboutTitle,
                    subtitle: aboutSubtitle || undefined,
                    paragraph: aboutParagraph,
                    branchNames: toLines(aboutBranches),
                    achievements: toLines(aboutAchievements),
                    founderName: aboutFounderName || undefined,
                    founderRole: aboutFounderRole || undefined,
                    founderBio: aboutFounderBio || undefined,
                    status: aboutStatus,
                  })
                  toast.success('About saved')
                } catch {
                  toast.error('Failed to save about')
                }
              }}
            >
              Save About
            </Button>
            {about ? (
              <>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await setAboutStatus({ aboutId: about._id as any, status: aboutStatus })
                      toast.success('About status updated')
                    } catch {
                      toast.error('Failed to update status')
                    }
                  }}
                >
                  Update Status
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await deleteAbout({ aboutId: about._id as any })
                      toast.success('About deleted')
                    } catch {
                      toast.error('Failed to delete about')
                    }
                  }}
                >
                  Delete About
                </Button>
              </>
            ) : null}
            <Button asChild variant="secondary">
              <Link to="/app/admin/profile">Back to Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
