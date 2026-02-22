import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { CONTENT_STATUSES } from './schema'

const ContentStatusValidator = v.union(...CONTENT_STATUSES.map(v.literal))

export const getActiveAbout = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('aboutContent')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .order('desc')
      .first()
  },
})

export const getAllAbout = query({
  handler: async (ctx) => {
    return await ctx.db.query('aboutContent').order('desc').collect()
  },
})

export const upsertAbout = mutation({
  args: {
    aboutId: v.optional(v.id('aboutContent')),
    title: v.string(),
    subtitle: v.optional(v.string()),
    paragraph: v.string(),
    branchNames: v.array(v.string()),
    achievements: v.array(v.string()),
    founderName: v.optional(v.string()),
    founderRole: v.optional(v.string()),
    founderBio: v.optional(v.string()),
    status: ContentStatusValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const { aboutId, ...payload } = args

    if (aboutId) {
      await ctx.db.patch(aboutId, {
        ...payload,
        updatedAt: now,
      })
      return aboutId
    }

    const createdId = await ctx.db.insert('aboutContent', {
      ...payload,
      createdAt: now,
      updatedAt: now,
    })

    return createdId
  },
})

export const setAboutStatus = mutation({
  args: {
    aboutId: v.id('aboutContent'),
    status: ContentStatusValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.aboutId, {
      status: args.status,
      updatedAt: Date.now(),
    })

    return args.aboutId
  },
})

export const deleteAbout = mutation({
  args: {
    aboutId: v.id('aboutContent'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.aboutId)
    return { success: true }
  },
})
