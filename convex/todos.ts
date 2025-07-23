import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

export const listByGroup = query({
  args: {
    groupId: v.id('todoGroups'),
  },
  returns: v.array(
    v.object({
      _id: v.id('todos'),
      _creationTime: v.number(),
      text: v.string(),
      completed: v.boolean(),
      groupId: v.id('todoGroups'),
      userId: v.id('users'),
      parentId: v.optional(v.id('todos')),
      durationMinutes: v.optional(v.number()),
      startTime: v.optional(v.number()),
      accumulatedTime: v.optional(v.number()),
      completedTime: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Verify user owns the group
    const group = await ctx.db.get(args.groupId)
    if (!group || group.userId !== userId) {
      throw new Error('Todo group not found or unauthorized')
    }

    return await ctx.db
      .query('todos')
      .withIndex('by_group_and_created', (q) => q.eq('groupId', args.groupId))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    text: v.string(),
    groupId: v.id('todoGroups'),
    parentId: v.optional(v.id('todos')),
    durationMinutes: v.optional(v.number()),
  },
  returns: v.id('todos'),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Verify user owns the group
    const group = await ctx.db.get(args.groupId)
    if (!group || group.userId !== userId) {
      throw new Error('Todo group not found or unauthorized')
    }

    // If parentId is provided, verify user owns the parent todo
    if (args.parentId) {
      const parentTodo = await ctx.db.get(args.parentId)
      if (!parentTodo || parentTodo.userId !== userId) {
        throw new Error('Parent todo not found or unauthorized')
      }
    }

    const now = Date.now()
    return await ctx.db.insert('todos', {
      text: args.text,
      completed: false,
      groupId: args.groupId,
      userId,
      parentId: args.parentId,
      durationMinutes: args.durationMinutes,
      accumulatedTime: 0, // Initialize accumulated time
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('todos'),
    text: v.string(),
    durationMinutes: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const todo = await ctx.db.get(args.id)
    if (!todo || todo.userId !== userId) {
      throw new Error('Todo not found or unauthorized')
    }

    await ctx.db.patch(args.id, {
      text: args.text,
      durationMinutes: args.durationMinutes,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const startTimer = mutation({
  args: {
    id: v.id('todos'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const todo = await ctx.db.get(args.id)
    if (!todo || todo.userId !== userId) {
      throw new Error('Todo not found or unauthorized')
    }

    await ctx.db.patch(args.id, {
      startTime: Date.now(),
      updatedAt: Date.now(),
    })
    return null
  },
})

export const stopTimer = mutation({
  args: {
    id: v.id('todos'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const todo = await ctx.db.get(args.id)
    if (!todo || todo.userId !== userId) {
      throw new Error('Todo not found or unauthorized')
    }

    // Calculate elapsed time for this session and add to accumulated time
    const now = Date.now()
    const sessionTime = todo.startTime ? now - todo.startTime : 0
    const newAccumulatedTime = (todo.accumulatedTime || 0) + sessionTime

    await ctx.db.patch(args.id, {
      startTime: undefined, // Clear current session
      accumulatedTime: newAccumulatedTime, // Save accumulated time
      updatedAt: now,
    })
    return null
  },
})

export const toggleComplete = mutation({
  args: {
    id: v.id('todos'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const todo = await ctx.db.get(args.id)
    if (!todo || todo.userId !== userId) {
      throw new Error('Todo not found or unauthorized')
    }

    const newCompletedStatus = !todo.completed
    const now = Date.now()

    // Calculate final accumulated time if completing a running task
    let finalAccumulatedTime = todo.accumulatedTime || 0
    if (newCompletedStatus && todo.startTime) {
      // Add current session time to accumulated time
      finalAccumulatedTime += now - todo.startTime
    }

    // Update the todo with completion status and timestamp
    await ctx.db.patch(args.id, {
      completed: newCompletedStatus,
      completedTime: newCompletedStatus ? now : undefined,
      startTime: newCompletedStatus ? undefined : todo.startTime, // Clear timer when completing
      accumulatedTime: newCompletedStatus
        ? finalAccumulatedTime
        : todo.accumulatedTime,
      updatedAt: now,
    })

    // If this is a subtask being completed, check if all siblings are now complete
    if (todo.parentId && newCompletedStatus) {
      const allSubtasks = await ctx.db
        .query('todos')
        .withIndex('by_parent', (q) => q.eq('parentId', todo.parentId))
        .collect()

      const allSubtasksCompleted = allSubtasks.every((subtask) =>
        subtask._id === args.id ? true : subtask.completed,
      )

      if (allSubtasksCompleted) {
        const parentTodo = await ctx.db.get(todo.parentId)
        if (parentTodo) {
          // Calculate parent's final accumulated time if it was running
          let parentFinalAccumulatedTime = parentTodo.accumulatedTime || 0
          if (parentTodo.startTime) {
            parentFinalAccumulatedTime += now - parentTodo.startTime
          }

          // Auto-complete the parent task
          await ctx.db.patch(todo.parentId, {
            completed: true,
            completedTime: now,
            startTime: undefined, // Clear parent timer too
            accumulatedTime: parentFinalAccumulatedTime,
            updatedAt: now,
          })
        }
      }
    }

    // If this is a subtask being uncompleted, make sure parent is also uncompleted
    if (todo.parentId && !newCompletedStatus) {
      const parentTodo = await ctx.db.get(todo.parentId)
      if (parentTodo && parentTodo.completed) {
        await ctx.db.patch(todo.parentId, {
          completed: false,
          completedTime: undefined,
          updatedAt: now,
        })
      }
    }

    // If this is a parent task being uncompleted, uncheck all subtasks
    if (!todo.parentId && !newCompletedStatus) {
      const subtasks = await ctx.db
        .query('todos')
        .withIndex('by_parent', (q) => q.eq('parentId', args.id))
        .collect()

      for (const subtask of subtasks) {
        if (subtask.completed) {
          await ctx.db.patch(subtask._id, {
            completed: false,
            completedTime: undefined,
            updatedAt: now,
          })
        }
      }
    }

    return null
  },
})

export const remove = mutation({
  args: {
    id: v.id('todos'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const todo = await ctx.db.get(args.id)
    if (!todo || todo.userId !== userId) {
      throw new Error('Todo not found or unauthorized')
    }

    // Delete all subtasks first
    const subtasks = await ctx.db
      .query('todos')
      .withIndex('by_parent', (q) => q.eq('parentId', args.id))
      .collect()

    for (const subtask of subtasks) {
      await ctx.db.delete(subtask._id)
    }

    // Delete the main todo
    await ctx.db.delete(args.id)
    return null
  },
})
