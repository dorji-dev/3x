import { useState } from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'src/components/ui/tabs'
import { TodoColumn } from './todo-column'
import { GroupSelector } from './group-selector'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'

export function TodoBoard() {
  const [selectedGroupId, setSelectedGroupId] =
    useState<Id<'todoGroups'> | null>(null)

  const todos = useQuery(
    api.todos.listByGroup,
    selectedGroupId ? { groupId: selectedGroupId } : 'skip',
  )

  // Count active and completed todos for tab badges
  const activeTodos =
    todos?.filter((todo) => !todo.completed && !todo.parentId) || []
  const completedTodos =
    todos?.filter((todo) => todo.completed && !todo.parentId) || []

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <GroupSelector
        selectedGroupId={selectedGroupId}
        onGroupSelect={setSelectedGroupId}
      />

      {/* Todo Columns - Desktop: Two columns, Mobile: Tabs */}
      {selectedGroupId && (
        <>
          {/* Desktop Layout (lg and above) */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-6">
            <TodoColumn
              todos={todos || []}
              isCompleted={false}
              groupId={selectedGroupId}
              emptyMessage="No active tasks. Add one to get started!"
            />
            <TodoColumn
              todos={todos || []}
              isCompleted={true}
              groupId={selectedGroupId}
              emptyMessage="No completed tasks yet. Keep working!"
            />
          </div>

          {/* Mobile Layout (below lg) */}
          <div className="lg:hidden">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="active"
                  className="relative data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:border-blue-300 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-300 dark:data-[state=active]:border-blue-700"
                >
                  Active Tasks
                  {activeTodos.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                      {activeTodos.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="relative data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:border-green-300 dark:data-[state=active]:bg-green-900/30 dark:data-[state=active]:text-green-300 dark:data-[state=active]:border-green-700"
                >
                  Completed
                  {completedTodos.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full">
                      {completedTodos.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-0">
                <TodoColumn
                  todos={todos || []}
                  isCompleted={false}
                  groupId={selectedGroupId}
                  emptyMessage="No active tasks. Add one to get started!"
                />
              </TabsContent>

              <TabsContent value="completed" className="mt-0">
                <TodoColumn
                  todos={todos || []}
                  isCompleted={true}
                  groupId={selectedGroupId}
                  emptyMessage="No completed tasks yet. Keep working!"
                />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}
