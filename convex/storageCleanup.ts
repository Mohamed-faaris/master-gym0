import { internalMutation } from './_generated/server'
import type { Id } from './_generated/dataModel'

const MIN_ORPHAN_FILE_AGE_MS = 24 * 60 * 60 * 1000

export const deleteOrphanedImageStorage = internalMutation({
  handler: async (ctx) => {
    const now = Date.now()

    const [
      dietLogs,
      galleryItems,
      successStories,
      transformationImages,
      storageFiles,
    ] = await Promise.all([
      ctx.db.query('dietLogs').collect(),
      ctx.db.query('gallery').collect(),
      ctx.db.query('successStories').collect(),
      ctx.db.query('transformationImages').collect(),
      ctx.db.system.query('_storage').collect(),
    ])

    const referencedStorageIds = new Set<Id<'_storage'>>()

    for (const dietLog of dietLogs) {
      if (dietLog.imageId) referencedStorageIds.add(dietLog.imageId)
    }

    for (const galleryItem of galleryItems) {
      if (galleryItem.storageId) referencedStorageIds.add(galleryItem.storageId)
    }

    for (const story of successStories) {
      if (story.imageStorageId) referencedStorageIds.add(story.imageStorageId)
    }

    for (const image of transformationImages) {
      if (image.imageStorageId) referencedStorageIds.add(image.imageStorageId)
    }

    let deletedCount = 0
    let skippedRecentCount = 0
    let failedCount = 0

    for (const file of storageFiles) {
      if (referencedStorageIds.has(file._id)) continue

      const fileAgeMs = now - file._creationTime
      if (fileAgeMs < MIN_ORPHAN_FILE_AGE_MS) {
        skippedRecentCount += 1
        continue
      }

      try {
        await ctx.storage.delete(file._id)
        deletedCount += 1
      } catch (error) {
        failedCount += 1
        console.warn('Failed to delete orphaned storage file', {
          storageId: file._id,
          error,
        })
      }
    }

    return {
      deletedCount,
      skippedRecentCount,
      failedCount,
      referencedCount: referencedStorageIds.size,
      totalStorageFiles: storageFiles.length,
    }
  },
})
