import { useState } from 'react'
import {
  Check,
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Checkbox } from 'src/components/ui/checkbox'
import { Badge } from 'src/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from 'src/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'
import { DurationSelect } from './duration-select'
import { TimeTracker } from './time-tracker'
import { useMutation } from '~/lib/convex-helper'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'

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

interface TodoItemWithSubtasksProps {
  todo: TodoWithSubtasks
  groupId: Id<'todoGroups'>
  level?: number
}

export function TodoItemWithSubtasks({
  todo,
  groupId,
  level = 0,
}: TodoItemWithSubtasksProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const [editDuration, setEditDuration] = useState<number | undefined>(
    todo.durationMinutes,
  )
  const [isExpanded, setIsExpanded] = useState(true)
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskText, setNewSubtaskText] = useState('')
  const [newSubtaskDuration, setNewSubtaskDuration] = useState<
    number | undefined
  >()

  const updateTodo = useMutation(api.todos.update)
  const deleteTodo = useMutation(api.todos.remove)
  const toggleComplete = useMutation(api.todos.toggleComplete)
  const createTodo = useMutation(api.todos.create)

  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0
  const completedSubtasks =
    todo.subtasks?.filter((subtask) => subtask.completed).length || 0
  const totalSubtasks = todo.subtasks?.length || 0
  const allSubtasksCompleted =
    hasSubtasks && completedSubtasks === totalSubtasks
  const progressPercentage =
    totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  // For parent tasks: disable checkbox if not all subtasks are completed
  const isParentCheckboxDisabled =
    level === 0 && hasSubtasks && !allSubtasksCompleted && !todo.completed

  const handleUpdate = async () => {
    if (!editText.trim()) return

    try {
      await updateTodo.mutateAsync({
        id: todo._id,
        text: editText.trim(),
        durationMinutes: editDuration,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update todo:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTodo.mutateAsync({ id: todo._id })
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  }

  const handleToggleComplete = async () => {
    // Don't allow checking parent if not all subtasks are complete
    if (isParentCheckboxDisabled) return

    try {
      await toggleComplete.mutateAsync({ id: todo._id })
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  const handleCreateSubtask = async () => {
    if (!newSubtaskText.trim()) return

    try {
      await createTodo.mutateAsync({
        text: newSubtaskText.trim(),
        groupId,
        parentId: todo._id,
        durationMinutes: newSubtaskDuration,
      })
      setNewSubtaskText('')
      setNewSubtaskDuration(undefined)
      setIsAddingSubtask(false)
      setIsExpanded(true) // Expand to show the new subtask
    } catch (error) {
      console.error('Failed to create subtask:', error)
    }
  }

  const startEdit = () => {
    setIsEditing(true)
    setEditText(todo.text)
    setEditDuration(todo.durationMinutes)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditText(todo.text)
    setEditDuration(todo.durationMinutes)
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMinutes}m`
  }

  const getTotalDuration = (): number => {
    if (level > 0) {
      // For subtasks, just return their own duration
      return todo.durationMinutes || 0
    }

    // For parent tasks, sum up all subtask durations
    if (hasSubtasks) {
      const subtaskTotal =
        todo.subtasks?.reduce(
          (sum, subtask) => sum + (subtask.durationMinutes || 0),
          0,
        ) || 0
      return subtaskTotal + (todo.durationMinutes || 0)
    }

    return todo.durationMinutes || 0
  }

  // Enhanced styling for subtasks
  const getItemStyles = () => {
    const baseStyles =
      'group bg-card border border-border rounded-lg p-3 hover:shadow-md transition-all duration-200'

    if (level > 0) {
      // Subtask styling
      if (todo.completed) {
        return `${baseStyles} opacity-60 bg-green-50/50 border-green-200/50 dark:bg-green-950/10 dark:border-green-800/30`
      }
      return `${baseStyles} bg-gray-50/50 dark:bg-gray-800/20`
    }

    // Parent task styling
    if (todo.completed) {
      return `${baseStyles} opacity-75`
    }
    return baseStyles
  }

  return (
    <div
      className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}
    >
      <div className={getItemStyles()}>
        <div className="flex items-start gap-3">
          {/* Expand/Collapse Button for Parent Tasks */}
          {level === 0 && hasSubtasks && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}

          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggleComplete}
            disabled={isParentCheckboxDisabled}
            className={`mt-0.5 flex-shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary ${
              isParentCheckboxDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />

          <div className="flex-1 min-w-0 space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdate()
                    } else if (e.key === 'Escape') {
                      cancelEdit()
                    }
                  }}
                  className="text-sm"
                  autoFocus
                />
                <DurationSelect
                  value={editDuration}
                  onValueChange={setEditDuration}
                  placeholder="Set duration"
                />
                <div className="flex gap-2">
                  <Button onClick={handleUpdate} size="sm">
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm break-words ${
                        todo.completed
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {todo.text}
                    </p>

                    {/* Compact duration display */}
                    {getTotalDuration() > 0 && !todo.durationMinutes && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(getTotalDuration())}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Compact progress indicator for parent tasks */}
                  {level === 0 && hasSubtasks && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {completedSubtasks}/{totalSubtasks}
                      </Badge>
                      {allSubtasksCompleted && (
                        <span className="text-green-600 dark:text-green-400">
                          🎉
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Visual progress bar for parent tasks */}
                {level === 0 && hasSubtasks && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                )}

                {/* Time Tracker Component */}
                <TimeTracker
                  todoId={todo._id}
                  durationMinutes={todo.durationMinutes}
                  startTime={todo.startTime}
                  accumulatedTime={todo.accumulatedTime}
                  completedTime={todo.completedTime}
                  createdAt={todo.createdAt}
                  completed={todo.completed}
                  isSubtask={level > 0}
                />
              </>
            )}
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex items-center gap-1">
              {/* Add Subtask Button (only for parent tasks) */}
              {level === 0 && !todo.completed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingSubtask(true)}
                  className="h-8 w-8 p-0 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}

              {/* More Options Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={startEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleToggleComplete}
                    disabled={isParentCheckboxDisabled}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
                  </DropdownMenuItem>
                  {level === 0 && !todo.completed && (
                    <DropdownMenuItem onClick={() => setIsAddingSubtask(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Subtask
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Add Subtask Input (only show for incomplete parent tasks) */}
        {isAddingSubtask && level === 0 && !todo.completed && (
          <div className="mt-3 ml-9 space-y-3">
            <Input
              placeholder="Add a subtask..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleCreateSubtask()
                } else if (e.key === 'Escape') {
                  setIsAddingSubtask(false)
                  setNewSubtaskText('')
                  setNewSubtaskDuration(undefined)
                }
              }}
              className="text-sm"
              autoFocus
            />
            <DurationSelect
              value={newSubtaskDuration}
              onValueChange={setNewSubtaskDuration}
              placeholder="Set duration (optional)"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddingSubtask(false)
                  setNewSubtaskText('')
                  setNewSubtaskDuration(undefined)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  !newSubtaskText.trim() || createTodo.status === 'pending'
                }
                onClick={handleCreateSubtask}
                size="sm"
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-right text-muted-foreground">
              Press Ctrl+Enter to quickly add
            </p>
          </div>
        )}
      </div>

      {/* Render Subtasks */}
      {level === 0 && hasSubtasks && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="mt-2 space-y-2">
            {todo.subtasks?.map((subtask) => (
              <TodoItemWithSubtasks
                key={subtask._id}
                todo={subtask}
                groupId={groupId}
                level={level + 1}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
