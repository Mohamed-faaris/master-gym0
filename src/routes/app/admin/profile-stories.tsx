import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState, type ChangeEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
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

export const Route = createFileRoute('/app/admin/profile-stories')({
  component: ProfileStoriesPage,
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

function ProfileStoriesPage() {
  const stories = useQuery(api.successStories.listAllStories) ?? []

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const createStory = useMutation(api.successStories.createStory)
  const updateStory = useMutation(api.successStories.updateStory)
  const setStoryStatus = useMutation(api.successStories.setStoryStatus)
  const deleteStory = useMutation(api.successStories.deleteStory)

  const [storyDrawerOpen, setStoryDrawerOpen] = useState(false)
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null)
  const [storyTitle, setStoryTitle] = useState('')
  const [storyParagraph, setStoryParagraph] = useState('')
  const [storyPoints, setStoryPoints] = useState('')
  const [storyStatus, setStoryStatusValue] = useState<ContentStatus>('draft')
  const [storyImageStorageId, setStoryImageStorageId] =
    useState<string | null>(null)
  const [storyPreview, setStoryPreview] = useState<string | null>(null)

  const resetStoryForm = () => {
    setEditingStoryId(null)
    setStoryTitle('')
    setStoryParagraph('')
    setStoryPoints('')
    setStoryStatusValue('draft')
    setStoryImageStorageId(null)
    setStoryPreview(null)
  }

  const openCreateDrawer = () => {
    resetStoryForm()
    setStoryDrawerOpen(true)
  }

  const openEditDrawer = (story: (typeof stories)[number]) => {
    setEditingStoryId(story._id)
    setStoryTitle(story.title)
    setStoryParagraph(story.paragraph)
    setStoryPoints(story.points.join('\n'))
    setStoryStatusValue(story.status as ContentStatus)
    setStoryImageStorageId(null)
    setStoryPreview(story.imageUrl ?? null)
    setStoryDrawerOpen(true)
  }

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

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Profile Tab
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Stories</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Manage Stories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={openCreateDrawer}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Story
          </Button>

          {stories.map((story) => (
            <div key={story._id} className="rounded-lg border p-3">
              <div className="font-medium">{story.title}</div>
              <div className="text-xs text-muted-foreground">slug: {story.slug}</div>
              <div className="text-xs text-muted-foreground">status: {story.status}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditDrawer(story)}>
                  Edit Story
                </Button>
                <Select
                  value={story.status}
                  onValueChange={async (value) => {
                    try {
                      await setStoryStatus({
                        storyId: story._id as any,
                        status: value as ContentStatus,
                      })
                      toast.success('Story status changed')
                    } catch {
                      toast.error('Failed to change story status')
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-36">
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
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await deleteStory({ storyId: story._id as any })
                      toast.success('Story deleted')
                    } catch {
                      toast.error('Failed to delete story')
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {!stories.length ? (
            <p className="text-sm text-muted-foreground">No stories yet.</p>
          ) : null}

          <Button asChild variant="secondary">
            <Link to="/app/admin/profile">Back to Profile</Link>
          </Button>
        </CardContent>
      </Card>

      <Drawer open={storyDrawerOpen} onOpenChange={setStoryDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingStoryId ? 'Edit Story' : 'Add Story'}</DrawerTitle>
            <DrawerDescription>
              Story details with auto slug and auto append order.
            </DrawerDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setStoryDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerHeader>

          <div className="space-y-4 px-4 pb-4">
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
          </div>

          <DrawerFooter>
            <Button
              onClick={async () => {
                if (!storyTitle || !storyParagraph) {
                  toast.error('Fill title and paragraph')
                  return
                }

                try {
                  if (editingStoryId) {
                    await updateStory({
                      storyId: editingStoryId as any,
                      slug: toSlug(storyTitle),
                      title: storyTitle,
                      paragraph: storyParagraph,
                      points: toLines(storyPoints),
                      imageStorageId: storyImageStorageId as any,
                    })
                    await setStoryStatus({
                      storyId: editingStoryId as any,
                      status: storyStatus,
                    })
                    toast.success('Story updated')
                  } else {
                    const nextOrder =
                      stories.length > 0
                        ? Math.max(...stories.map((story) => story.order)) + 1
                        : 1

                    await createStory({
                      slug: toSlug(storyTitle),
                      title: storyTitle,
                      paragraph: storyParagraph,
                      points: toLines(storyPoints),
                      status: storyStatus,
                      order: nextOrder,
                      imageStorageId: storyImageStorageId as any,
                    })
                    toast.success('Story created')
                  }

                  resetStoryForm()
                  setStoryDrawerOpen(false)
                } catch {
                  toast.error('Failed to save story')
                }
              }}
            >
              {editingStoryId ? 'Update Story' : 'Create Story'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </section>
  )
}
