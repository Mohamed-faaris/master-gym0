import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { CONTENT_STATUSES } from './schema'

const ContentStatusValidator = v.union(...CONTENT_STATUSES.map(v.literal))

export const listActiveTransformationImages = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('transformationImages')
      .withIndex('by_status_order', (q) => q.eq('status', 'active'))
      .order('asc')
      .collect()
  },
})

export const listAllTransformationImages = query({
  handler: async (ctx) => {
    return await ctx.db.query('transformationImages').order('asc').collect()
  },
})

export const createTransformationImage = mutation({
  args: {
    title: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    imageUrl: v.optional(v.string()),
    order: v.number(),
    status: ContentStatusValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let resolvedImageUrl = args.imageUrl

    if (!resolvedImageUrl && args.imageStorageId) {
      const uploadedUrl = await ctx.storage.getUrl(args.imageStorageId)
      if (uploadedUrl === null) {
        throw new Error('Unable to resolve transformation image URL')
      }
      resolvedImageUrl = uploadedUrl
    }

    if (!resolvedImageUrl) {
      throw new Error('Transformation image URL is required')
    }

    return await ctx.db.insert('transformationImages', {
      title: args.title,
      imageStorageId: args.imageStorageId,
      imageUrl: resolvedImageUrl,
      order: args.order,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateTransformationImage = mutation({
  args: {
    imageId: v.id('transformationImages'),
    title: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    imageUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { imageId, imageStorageId, imageUrl, ...updates } = args
    let resolvedImageUrl = imageUrl

    if (!resolvedImageUrl && imageStorageId) {
      const uploadedUrl = await ctx.storage.getUrl(imageStorageId)
      if (uploadedUrl === null) {
        throw new Error('Unable to resolve transformation image URL')
      }
      resolvedImageUrl = uploadedUrl
    }

    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
    }

    if (updates.title !== undefined) {
      patch.title = updates.title
    }

    if (updates.order !== undefined) {
      patch.order = updates.order
    }

    if (imageStorageId !== undefined) {
      patch.imageStorageId = imageStorageId
    }

    if (resolvedImageUrl !== undefined) {
      patch.imageUrl = resolvedImageUrl
    }

    await ctx.db.patch(imageId, patch)

    return imageId
  },
})

export const setTransformationImageStatus = mutation({
  args: {
    imageId: v.id('transformationImages'),
    status: ContentStatusValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      status: args.status,
      updatedAt: Date.now(),
    })

    return args.imageId
  },
})

export const deleteTransformationImage = mutation({
  args: {
    imageId: v.id('transformationImages'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.imageId)
    if (existing?.imageStorageId) {
      await ctx.storage.delete(existing.imageStorageId)
    }

    await ctx.db.delete(args.imageId)
    return { success: true }
  },
})
