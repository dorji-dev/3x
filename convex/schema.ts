import { defineSchema, defineTable } from 'convex/server'
import { authTables } from '@convex-dev/auth/server'
import { v } from 'convex/values'

const schema = defineSchema({
  ...authTables,

  todoGroups: defineTable({
    name: v.string(),
    userId: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_created', ['userId', 'createdAt']),

  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    groupId: v.id('todoGroups'),
    userId: v.id('users'),
    parentId: v.optional(v.id('todos')), // For subtasks
    durationMinutes: v.optional(v.number()), // Duration in minutes
    startTime: v.optional(v.number()), // When user started working on it (current session)
    accumulatedTime: v.optional(v.number()), // Total time accumulated across all sessions (in milliseconds)
    completedTime: v.optional(v.number()), // When it was marked completed
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_group', ['groupId'])
    .index('by_user', ['userId'])
    .index('by_group_and_completed', ['groupId', 'completed'])
    .index('by_group_and_created', ['groupId', 'createdAt'])
    .index('by_parent', ['parentId']) // For finding subtasks
    .index('by_group_and_parent', ['groupId', 'parentId']), // For finding top-level tasks and subtasks
})

export default schema
