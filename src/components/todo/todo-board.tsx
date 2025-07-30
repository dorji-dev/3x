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
    <div className="p-4 flex-1 overflow-hidden space-y-4 flex flex-col">
      <GroupSelector
        selectedGroupId={selectedGroupId}
        onGroupSelect={setSelectedGroupId}
      />

      {/* Todo Columns - Desktop: Two columns, Mobile: Tabs */}
      {selectedGroupId && (
        <div className="overflow-hidden flex-1">
          {/* Desktop Layout (lg and above) */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:h-full gap-4">
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
          <Tabs
            defaultValue="active"
            className="h-full flex flex-col space-y-2"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active Tasks
                {activeTodos.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                    {activeTodos.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed
                {completedTodos.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full">
                    {completedTodos.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="flex-1 overflow-y-auto">
              <TodoColumn
                todos={todos || []}
                isCompleted={false}
                groupId={selectedGroupId}
                emptyMessage="No active tasks. Add one to get started!"
              />
            </TabsContent>

            <TabsContent value="completed" className="flex-1 overflow-y-auto">
              <TodoColumn
                todos={todos || []}
                isCompleted={true}
                groupId={selectedGroupId}
                emptyMessage="No completed tasks yet. Keep working!"
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
