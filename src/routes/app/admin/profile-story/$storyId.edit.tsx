import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState, type ChangeEvent } from 'react'
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

export const Route = createFileRoute('/app/admin/profile-story/$storyId/edit')({
  component: EditStoryPage,
})

const STATUSES = ['active', 'draft', 'inactive'] as const

type ContentStatus = (typeof STATUSES)[number]

function toLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function EditStoryPage() {
  const { storyId } = Route.useParams()
  const navigate = useNavigate()

  const stories = useQuery(api.successStories.listAllStories) ?? []
  const story = stories.find((entry) => entry._id === storyId)

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const updateStory = useMutation(api.successStories.updateStory)
  const setStoryStatus = useMutation(api.successStories.setStoryStatus)
  const deleteStory = useMutation(api.successStories.deleteStory)

  const [storyTitle, setStoryTitle] = useState('')
  const [storyParagraph, setStoryParagraph] = useState('')
  const [storyPoints, setStoryPoints] = useState('')
  const [storyStatus, setStoryStatusValue] = useState<ContentStatus>('draft')
  const [storyImageStorageId, setStoryImageStorageId] =
    useState<string | null>(null)
  const [storyPreview, setStoryPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!story) return
    setStoryTitle(story.title)
    setStoryParagraph(story.paragraph)
    setStoryPoints(story.points.join('\n'))
    setStoryStatusValue(story.status as ContentStatus)
    setStoryPreview(story.imageUrl ?? null)
  }, [story?._id])

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please pick an image file')
      return
    }

    setStoryPreview(URL.createObjectURL(file))

    try {
      const uploadUrl = await generateUploadUrl()
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: file,
      })

      if (!response.ok) throw new Error('Upload failed')
      const data = await response.json()
      setStoryImageStorageId(data.storageId)
      toast.success('Story image uploaded')
    } catch {
      toast.error('Failed to upload story image')
    }
  }

  if (!story) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">Story not found.</p>
        <Button asChild variant="outline">
          <Link to="/app/admin/profile-stories">Back</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Stories
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Edit Story</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{story.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder="Title"
          />
          <textarea
            value={storyParagraph}
            onChange={(e) => setStoryParagraph(e.target.value)}
            placeholder="Paragraph"
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={storyPoints}
            onChange={(e) => setStoryPoints(e.target.value)}
            placeholder="Points (one per line)"
            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Select
            value={storyStatus}
            onValueChange={(value) => setStoryStatusValue(value as ContentStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input type="file" accept="image/*" onChange={handleImageChange} />

          {storyPreview ? (
            <div className="overflow-hidden rounded-lg border">
              <img
                src={storyPreview}
                alt="Story preview"
                className="h-56 w-full object-cover"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                if (!storyTitle || !storyParagraph) {
                  toast.error('Fill title and paragraph')
                  return
                }

                try {
                  await updateStory({
                    storyId: story._id as any,
                    slug: toSlug(storyTitle),
                    title: storyTitle,
                    paragraph: storyParagraph,
                    points: toLines(storyPoints),
                    imageStorageId: storyImageStorageId as any,
                  })
                  await setStoryStatus({
                    storyId: story._id as any,
                    status: storyStatus,
                  })
                  toast.success('Story updated')
                  navigate({ to: '/app/admin/profile-stories' })
                } catch {
                  toast.error('Failed to update story')
                }
              }}
            >
              Save Story
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await deleteStory({ storyId: story._id as any })
                  toast.success('Story deleted')
                  navigate({ to: '/app/admin/profile-stories' })
                } catch {
                  toast.error('Failed to delete story')
                }
              }}
            >
              Delete
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/admin/profile-stories">Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
