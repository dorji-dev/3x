import { useState, useMemo } from 'react'
import { Plus, CheckCircle, Circle } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'src/components/ui/popover'
import { TodoItemWithSubtasks } from './todo-item-with-subtasks'
import { DurationSelect } from './duration-select'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { useMutation } from '~/lib/convex-helper'

interface TodoWithSubtasks {
  _id: Id<'todos'>
  text: string
  completed: boolean
  createdAt: number
  parentId?: Id<'todos'>
  durationMinutes?: number
  startTime?: number
  accumulatedTime?: number
  completedTime?: number
  subtasks?: TodoWithSubtasks[]
}

interface TodoColumnProps {
  todos: Array<{
    _id: Id<'todos'>
    text: string
    completed: boolean
    createdAt: number
    parentId?: Id<'todos'>
    durationMinutes?: number
    startTime?: number
    accumulatedTime?: number
    completedTime?: number
  }>
  isCompleted: boolean
  groupId: Id<'todoGroups'> | null
  emptyMessage: string
}

export function TodoColumn({
  todos,
  isCompleted,
  groupId,
  emptyMessage,
}: TodoColumnProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoDuration, setNewTodoDuration] = useState<number | undefined>()

  const createTodo = useMutation(api.todos.create)

  // Organize todos into hierarchical structure and filter by parent completion status
  const organizedTodos = useMemo(() => {
    const todoMap = new Map<Id<'todos'>, TodoWithSubtasks>()
    const rootTodos: TodoWithSubtasks[] = []

    // First pass: create todo objects
    todos.forEach((todo) => {
      todoMap.set(todo._id, {
        ...todo,
        subtasks: [],
      })
    })

    // Second pass: organize hierarchy
    todos.forEach((todo) => {
      const todoWithSubtasks = todoMap.get(todo._id)!

      if (todo.parentId) {
        // This is a subtask - add it to its parent
        const parent = todoMap.get(todo.parentId)
        if (parent) {
          parent.subtasks!.push(todoWithSubtasks)
        }
      } else {
        // This is a root todo - only include it if its completion status matches the column
        if (todo.completed === isCompleted) {
          rootTodos.push(todoWithSubtasks)
        }
      }
    })

    // Sort by creation time (newest first for root todos)
    rootTodos.sort((a, b) => b.createdAt - a.createdAt)

    // Sort subtasks by creation time (oldest first for subtasks)
    rootTodos.forEach((todo) => {
      if (todo.subtasks) {
        todo.subtasks.sort((a, b) => a.createdAt - b.createdAt)
      }
    })

    return rootTodos
  }, [todos, isCompleted])

  const handleCreateTodo = async () => {
    if (!newTodoText.trim() || !groupId) return

    try {
      await createTodo.mutateAsync({
        text: newTodoText.trim(),
        groupId,
        durationMinutes: newTodoDuration,
      })
      setNewTodoText('')
      setNewTodoDuration(undefined)
      setIsCreateOpen(false)
    } catch (error) {
      console.error('Failed to create todo:', error)
    }
  }

  return (
    <div className={`border rounded-xl shadow-sm h-full overflow-y-auto`}>
      {/* Column Header with Icon */}
      <div className={`p-3 sm:p-4 border-b`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <CheckCircle className={`h-6 w-6 text-green-500`} />
            ) : (
              <Circle className={`h-6 w-6 text-primary`} />
            )}
            <p className="text-muted-foreground">{organizedTodos.length}</p>
          </div>

          {!isCompleted && groupId && (
            <Popover open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <PopoverTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[calc(100vw-2rem)] max-w-sm mx-4 sm:w-80 sm:mx-0"
              >
                <div className="space-y-4">
                  <h4 className="font-medium">Add new task</h4>
                  <Input
                    placeholder="What needs to be done?"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleCreateTodo()
                      } else if (e.key === 'Escape') {
                        setIsCreateOpen(false)
                        setNewTodoText('')
                        setNewTodoDuration(undefined)
                      }
                    }}
                    autoFocus
                  />
                  <DurationSelect
                    value={newTodoDuration}
                    onValueChange={setNewTodoDuration}
                    placeholder="Set duration (optional)"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsCreateOpen(false)
                        setNewTodoText('')
                        setNewTodoDuration(undefined)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={
                        !newTodoText.trim() || createTodo.status === 'pending'
                      }
                      onClick={handleCreateTodo}
                    >
                      Add Task
                    </Button>
                  </div>
                  <p className="text-xs text-right text-muted-foreground">
                    Press Ctrl+Enter to quickly add
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div className="p-3 sm:p-4">
        {organizedTodos.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div
              className={`w-12 h-12 mx-auto mb-3 rounded-full bg-muted-foreground/10 flex items-center justify-center`}
            >
              {isCompleted ? (
                <CheckCircle className={`h-6 w-6 text-green-500`} />
              ) : (
                <Circle className={`h-6 w-6 text-primary`} />
              )}
            </div>
            <div className="text-muted-foreground text-sm">{emptyMessage}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {organizedTodos.map((todo) => (
              <TodoItemWithSubtasks
                key={todo._id}
                todo={todo}
                groupId={groupId!}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
