import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('todoGroups'),
      _creationTime: v.number(),
      name: v.string(),
      userId: v.id('users'),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    return await ctx.db
      .query('todoGroups')
      .withIndex('by_user_and_created', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id('todoGroups'),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const now = Date.now()
    return await ctx.db.insert('todoGroups', {
      name: args.name,
      userId,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('todoGroups'),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const group = await ctx.db.get(args.id)
    if (!group || group.userId !== userId) {
      throw new Error('Todo group not found or unauthorized')
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const remove = mutation({
  args: {
    id: v.id('todoGroups'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const group = await ctx.db.get(args.id)
    if (!group || group.userId !== userId) {
      throw new Error('Todo group not found or unauthorized')
    }

    // Delete all todos in this group first
    const todos = await ctx.db
      .query('todos')
      .withIndex('by_group', (q) => q.eq('groupId', args.id))
      .collect()

    for (const todo of todos) {
      await ctx.db.delete(todo._id)
    }

    // Delete the group
    await ctx.db.delete(args.id)
    return null
  },
})
