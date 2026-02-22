import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { CONTENT_STATUSES } from './schema'

const ContentStatusValidator = v.union(...CONTENT_STATUSES.map(v.literal))

export const listActiveStories = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('successStories')
      .withIndex('by_status_order', (q) => q.eq('status', 'active'))
      .order('asc')
      .collect()
  },
})

export const listAllStories = query({
  handler: async (ctx) => {
    return await ctx.db.query('successStories').order('asc').collect()
  },
})

export const getStoryBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('successStories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const createStory = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    imageStorageId: v.optional(v.id('_storage')),
    imageUrl: v.optional(v.string()),
    paragraph: v.string(),
    points: v.array(v.string()),
    status: ContentStatusValidator,
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let resolvedImageUrl = args.imageUrl

    if (!resolvedImageUrl && args.imageStorageId) {
      const uploadedUrl = await ctx.storage.getUrl(args.imageStorageId)
      if (uploadedUrl === null) {
        throw new Error('Unable to resolve story image URL')
      }
      resolvedImageUrl = uploadedUrl
    }

    return await ctx.db.insert('successStories', {
      ...args,
      imageUrl: resolvedImageUrl,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateStory = mutation({
  args: {
    storyId: v.id('successStories'),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    imageStorageId: v.optional(v.id('_storage')),
    imageUrl: v.optional(v.string()),
    paragraph: v.optional(v.string()),
    points: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { storyId, imageStorageId, imageUrl, ...updates } = args
    let resolvedImageUrl = imageUrl

    if (!resolvedImageUrl && imageStorageId) {
      const uploadedUrl = await ctx.storage.getUrl(imageStorageId)
      if (uploadedUrl === null) {
        throw new Error('Unable to resolve story image URL')
      }
      resolvedImageUrl = uploadedUrl
    }

    await ctx.db.patch(storyId, {
      ...updates,
      imageStorageId,
      imageUrl: resolvedImageUrl,
      updatedAt: Date.now(),
    })

    return storyId
  },
})

export const setStoryStatus = mutation({
  args: {
    storyId: v.id('successStories'),
    status: ContentStatusValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storyId, {
      status: args.status,
      updatedAt: Date.now(),
    })

    return args.storyId
  },
})

export const deleteStory = mutation({
  args: {
    storyId: v.id('successStories'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.storyId)
    if (existing?.imageStorageId) {
      await ctx.storage.delete(existing.imageStorageId)
    }

    await ctx.db.delete(args.storyId)
    return { success: true }
  },
})
