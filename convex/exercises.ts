import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const getNames = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query('exercises').collect()
    return exercises.map((e) => e.name)
  },
})

export const add = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('exercises')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first()

    if (existing) {
      throw new Error('Exercise already exists')
    }

    await ctx.db.insert('exercises', {
      name: args.name,
      createdAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('exercises')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first()

    if (!existing) {
      throw new Error('Exercise not found')
    }

    await ctx.db.delete(existing._id)
  },
})
