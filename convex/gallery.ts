import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { GALLERY_ACCESS, GALLERY_STATUSES } from './schema'

const GalleryStatusValidator = v.union(...GALLERY_STATUSES.map(v.literal))
const GalleryAccessValidator = v.union(...GALLERY_ACCESS.map(v.literal))

export const addGalleryItem = mutation({
  args: {
    userId: v.id('users'),
    storageId: v.optional(v.id('_storage')),
    imgUrl: v.optional(v.string()),
    status: GalleryStatusValidator,
    access: GalleryAccessValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let imgUrl = args.imgUrl

    if (!imgUrl && args.storageId) {
      const resolvedUrl = await ctx.storage.getUrl(args.storageId)
      if (!resolvedUrl) {
        throw new Error('Unable to resolve image URL')
      }
      imgUrl = resolvedUrl
    }

    if (!imgUrl) {
      throw new Error('Image URL is required')
    }

    const galleryId = await ctx.db.insert('gallery', {
      userId: args.userId,
      imgUrl,
      storageId: args.storageId,
      status: args.status,
      access: args.access,
      createdAt: now,
      updatedAt: now,
    })

    return galleryId
  },
})

export const getGalleryByUser = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('gallery')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()
  },
})

export const deleteGalleryItem = mutation({
  args: {
    galleryId: v.id('gallery'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.galleryId)
    if (existing?.storageId) {
      await ctx.storage.delete(existing.storageId)
    }
    await ctx.db.delete(args.galleryId)
    return { success: true }
  },
})
