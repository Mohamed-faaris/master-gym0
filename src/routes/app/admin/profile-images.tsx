import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
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

export const Route = createFileRoute('/app/admin/profile-images')({
  component: ProfileImagesPage,
})

const STATUSES = ['active', 'draft', 'inactive'] as const

type ContentStatus = (typeof STATUSES)[number]

type ImageRecord = {
  _id: string
  title?: string
  imageUrl: string
  order: number
  status: ContentStatus
}

function ProfileImagesPage() {
  const rawImages = useQuery(api.transformationImages.listAllTransformationImages) as
    | ImageRecord[]
    | undefined

  const sortedImages = useMemo(
    () => [...(rawImages ?? [])].sort((a, b) => a.order - b.order),
    [rawImages],
  )

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const createTransformationImage = useMutation(
    api.transformationImages.createTransformationImage,
  )
  const updateTransformationImage = useMutation(
    api.transformationImages.updateTransformationImage,
  )
  const setTransformationImageStatus = useMutation(
    api.transformationImages.setTransformationImageStatus,
  )
  const deleteTransformationImage = useMutation(
    api.transformationImages.deleteTransformationImage,
  )

  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [imageTitle, setImageTitle] = useState('')
  const [imageStatus, setImageStatus] = useState<ContentStatus>('draft')
  const [transformationStorageId, setTransformationStorageId] =
    useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageDrawerOpen, setImageDrawerOpen] = useState(false)
  const [fullScreenImage, setFullScreenImage] = useState<{
    url: string
    title: string
  } | null>(null)
  const transformationImageInputRef = useRef<HTMLInputElement | null>(null)

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please pick an image file')
      return
    }

    setImagePreview(URL.createObjectURL(file))

    try {
      const uploadUrl = await generateUploadUrl()
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: file,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setTransformationStorageId(data.storageId)
      toast.success('Image uploaded')
    } catch {
      toast.error('Failed to upload image')
    }
  }

  const resetImageForm = () => {
    setEditingImageId(null)
    setImageTitle('')
    setImageStatus('draft')
    setTransformationStorageId(null)
    setImagePreview(null)
    if (transformationImageInputRef.current) {
      transformationImageInputRef.current.value = ''
    }
  }

  const openCreateDrawer = () => {
    resetImageForm()
    setImageDrawerOpen(true)
  }

  const openEditDrawer = (image: ImageRecord) => {
    setEditingImageId(image._id)
    setImageTitle(image.title ?? '')
    setImageStatus(image.status as ContentStatus)
    setTransformationStorageId(null)
    setImagePreview(image.imageUrl)
    setImageDrawerOpen(true)
  }

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sortedImages.length) return

    const current = sortedImages[index]
    const target = sortedImages[targetIndex]

    try {
      await updateTransformationImage({
        imageId: current._id as any,
        order: target.order,
      })
      await updateTransformationImage({
        imageId: target._id as any,
        order: current.order,
      })
      toast.success('Image order updated')
    } catch {
      toast.error('Failed to update image order')
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Profile Tab
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Images</h1>
        <p className="text-sm text-muted-foreground">
          Reorder with up/down controls.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Transformation Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={openCreateDrawer}>
            <Plus className="mr-2 h-4 w-4" />
            Add Image
          </Button>

          <div className="space-y-2">
            {sortedImages.map((image, index) => (
              <div key={image._id} className="rounded-lg border p-3">
                <div className="mt-2 overflow-hidden rounded-md border">
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() =>
                      setFullScreenImage({
                        url: image.imageUrl,
                        title: image.title ?? 'Transformation image',
                      })
                    }
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.title ?? 'Transformation image'}
                      className="h-36 w-full object-cover"
                    />
                  </button>
                </div>
                <div className="mt-2 font-medium">{image.title ?? 'Untitled image'}</div>
                <div className="text-xs text-muted-foreground">status: {image.status}</div>
                <div className="text-xs text-muted-foreground">order: {image.order}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => void moveImage(index, 'up')}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => void moveImage(index, 'down')}
                    disabled={index === sortedImages.length - 1}
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDrawer(image)}
                  >
                    Edit
                  </Button>
                  <Select
                    value={image.status}
                    onValueChange={async (value) => {
                      try {
                        await setTransformationImageStatus({
                          imageId: image._id as any,
                          status: value as ContentStatus,
                        })
                        toast.success('Image status changed')
                      } catch {
                        toast.error('Failed to change image status')
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
                        await deleteTransformationImage({ imageId: image._id as any })
                        toast.success('Image deleted')
                        if (editingImageId === image._id) {
                          resetImageForm()
                        }
                      } catch {
                        toast.error('Failed to delete image')
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {!sortedImages.length ? (
              <p className="text-sm text-muted-foreground">No transformation images yet.</p>
            ) : null}
          </div>

          <Button asChild variant="secondary">
            <Link to="/app/admin/profile">Back to Profile</Link>
          </Button>
        </CardContent>
      </Card>

      <Drawer open={imageDrawerOpen} onOpenChange={setImageDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingImageId ? 'Edit Image' : 'Add Image'}</DrawerTitle>
            <DrawerDescription>
              Upload with preview and set status.
            </DrawerDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setImageDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerHeader>

          <div className="space-y-4 px-4 pb-4">
            <Input
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              placeholder="Image title"
            />
            <Select
              value={imageStatus}
              onValueChange={(value) => setImageStatus(value as ContentStatus)}
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

            <Input
              ref={transformationImageInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => void handleUploadFile(event)}
            />

            {imagePreview ? (
              <div className="overflow-hidden rounded-lg border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-48 w-full object-cover"
                />
              </div>
            ) : null}
          </div>

          <DrawerFooter>
            <Button
              onClick={async () => {
                try {
                  if (editingImageId) {
                    await updateTransformationImage({
                      imageId: editingImageId as any,
                      title: imageTitle || undefined,
                      imageStorageId: transformationStorageId as any,
                    })
                    await setTransformationImageStatus({
                      imageId: editingImageId as any,
                      status: imageStatus,
                    })
                    toast.success('Image updated')
                  } else {
                    const nextOrder =
                      sortedImages.length > 0
                        ? Math.max(...sortedImages.map((item) => item.order)) + 1
                        : 1

                    await createTransformationImage({
                      title: imageTitle || undefined,
                      order: nextOrder,
                      status: imageStatus,
                      imageStorageId: transformationStorageId as any,
                    })
                    toast.success('Image created')
                  }
                  resetImageForm()
                  setImageDrawerOpen(false)
                } catch {
                  toast.error('Failed to save image')
                }
              }}
            >
              {editingImageId ? 'Update Image' : 'Create Image'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {fullScreenImage ? (
        <div
          className="fixed inset-0 z-50 bg-black/90 p-4"
          onClick={() => setFullScreenImage(null)}
        >
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => setFullScreenImage(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex h-full w-full items-center justify-center">
            <img
              src={fullScreenImage.url}
              alt={fullScreenImage.title}
              className="max-h-full max-w-full object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
