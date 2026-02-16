import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@convex/_generated/api'
import { useAuth } from '@/components/auth/useAuth'
import { Card } from '@/components/ui/card'
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

export const Route = createFileRoute('/app/_user/gallery')({
  component: RouteComponent,
})

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

function RouteComponent() {
  const { user } = useAuth()
  const gallery = useQuery(
    api.gallery.getGalleryByUser,
    user ? { userId: user._id } : 'skip',
  )
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const addGalleryItem = useMutation(api.gallery.addGalleryItem)
  const deleteGalleryItem = useMutation(api.gallery.deleteGalleryItem)

  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageStorageId, setImageStorageId] = useState<string | null>(null)
  const [access, setAccess] = useState<'private' | 'public'>('private')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const clearImageState = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setSelectedImageFile(null)
    setImagePreviewUrl(null)
    setImageStorageId(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  const handlePickImage = () => {
    imageInputRef.current?.click()
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      clearImageState()
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be 5MB or smaller')
      clearImageState()
      return
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    setSelectedImageFile(file)
    setImagePreviewUrl(previewUrl)
    setIsUploadingImage(true)

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
      setImageStorageId(data.storageId)
    } catch {
      toast.error('Failed to upload image')
      clearImageState()
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in first')
      return
    }
    if (!imageStorageId) {
      toast.error('Please upload an image first')
      return
    }

    setIsSaving(true)
    try {
      await addGalleryItem({
        userId: user._id,
        storageId: imageStorageId as any,
        status: access === 'public' ? 'subitted' : 'notSubmited',
        access,
      })
      toast.success('Photo added to gallery')
      clearImageState()
      setAccess('private')
      setUploadDrawerOpen(false)
    } catch {
      toast.error('Failed to add photo')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (galleryId: string) => {
    try {
      await deleteGalleryItem({ galleryId: galleryId as any })
      toast.success('Photo removed')
    } catch {
      toast.error('Failed to delete photo')
    }
  }

  return (
    <div className="p-4 space-y-6 pb-32">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Gallery</h1>
        <p className="text-muted-foreground">Your progress photos</p>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-2 gap-4">
        {gallery?.length ? (
          gallery.map((photo) => (
            <Card key={photo._id} className="relative overflow-hidden group">
              <img
                src={photo.imgUrl}
                alt="Progress photo"
                className="w-full h-48 object-cover"
              />
              <div className="absolute left-2 top-2 flex gap-2">
                <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] uppercase tracking-wide text-white">
                  {photo.status}
                </span>
                <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] uppercase tracking-wide text-white">
                  {photo.access}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(photo._id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                {new Date(photo.createdAt).toLocaleDateString()}
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-2 border-dashed">
            <div className="p-8 text-center text-sm text-muted-foreground">
              No photos yet. Upload your first progress shot.
            </div>
          </Card>
        )}
      </div>

      {/* Upload Button - Fixed above navbar */}
      <div
        className="fixed left-0 right-0 flex justify-center pb-4"
        style={{ bottom: 'calc(5rem + var(--safe-bottom))' }}
      >
        <Button
          onClick={() => setUploadDrawerOpen(true)}
          size="lg"
          className="rounded-full shadow-lg px-8"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Photo
        </Button>
      </div>

      <Drawer open={uploadDrawerOpen} onOpenChange={setUploadDrawerOpen}>
        <DrawerContent className="flex max-h-[85vh] flex-col">
          <DrawerHeader>
            <DrawerTitle>Upload Gallery Photo</DrawerTitle>
            <DrawerDescription>
              Add a progress image with status and access level.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Image</label>
                <Input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePickImage}
                  >
                    Choose Image
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {selectedImageFile?.name ?? 'No file selected'}
                  </p>
                </div>
                {imagePreviewUrl && (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Access</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={access === 'private' ? 'default' : 'outline'}
                    onClick={() => setAccess('private')}
                  >
                    Private
                  </Button>
                  <Button
                    type="button"
                    variant={access === 'public' ? 'default' : 'outline'}
                    onClick={() => setAccess('public')}
                  >
                    Public
                  </Button>
                </div>
                {/* <p className="text-xs text-muted-foreground">
                  Status will be{' '}
                  <span className="font-medium">
                    {access === 'public' ? 'subitted' : 'notSubmited'}
                  </span>{' '}
                  based on access.
                </p> */}
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t bg-background">
            <Button
              onClick={handleSave}
              disabled={!imageStorageId || isSaving || isUploadingImage}
            >
              {isUploadingImage
                ? 'Uploading...'
                : isSaving
                  ? 'Saving...'
                  : 'Save Photo'}
            </Button>
            <DrawerClose asChild>
              <Button
                variant="outline"
                onClick={() => {
                  clearImageState()
                  setAccess('private')
                }}
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
