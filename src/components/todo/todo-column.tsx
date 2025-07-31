import { useState, useMemo } from 'react'
import { Plus, CheckCircle, Circle, ClipboardList } from 'lucide-react'
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
import { toast } from 'sonner'
import { format } from 'date-fns'
import { DatePicker } from '../ui/datepicker'

// Helper function to format duration in a readable way
function formatDuration(minutes?: number): string {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

// Helper function to format date
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Helper function to generate report text from todos
function generateReportText(
  todos: TodoWithSubtasks[],
  selectedDate?: Date,
): string {
  if (todos.length === 0) {
    return 'No completed tasks to report.'
  }

  let report = `📋 Completed Tasks Report\n`
  if (selectedDate) {
    report += `Update for: ${format(selectedDate, 'PPP')}\n`
  }

  todos.forEach((todo, index) => {
    report += `${index + 1}. ${todo.text}\n`

    // Add duration if available
    if (todo.durationMinutes) {
      report += `   ⏱️ Duration: ${formatDuration(todo.durationMinutes)}\n`
    }

    // Add completion date only if no selected date is provided
    if (!selectedDate && todo.completedTime) {
      report += `   ✅ Completed: ${formatDate(todo.completedTime)}\n`
    }

    // Add subtasks if any
    if (todo.subtasks && todo.subtasks.length > 0) {
      const completedSubtasks = todo.subtasks.filter(
        (subtask) => subtask.completed,
      )
      report += `   📝 Subtasks: ${completedSubtasks.length}/${todo.subtasks.length} completed\n`

      completedSubtasks.forEach((subtask, subIndex) => {
        report += `      ${index + 1}.${subIndex + 1} ${subtask.text}\n`
        if (subtask.durationMinutes) {
          report += `         ⏱️ Duration: ${formatDuration(subtask.durationMinutes)}\n`
        }
      })
    }

    report += '\n'
  })

  return report
}

// Helper function to copy text to clipboard
async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

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
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

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
    <div className={`border h-full overflow-y-auto`}>
      {/* Column Header with Icon */}
      <div className="flex justify-between items-center gap-x-4 px-3 border-b h-[54px]">
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
              <Button size="sm" variant="secondary">
                <Plus />
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

        {isCompleted && groupId && (
          <Popover open={isReportOpen} onOpenChange={setIsReportOpen}>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2">
                <ClipboardList />
                Get report
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[calc(100vw-2rem)] max-w-sm mx-4 sm:w-80 sm:mx-0"
            >
              <div className="space-y-4">
                <h4 className="font-medium">Generate Report</h4>
                <div className="space-y-2">
                  <label className="text-sm block font-medium text-muted-foreground">
                    Select date (optional)
                  </label>
                  <DatePicker date={selectedDate} setDate={setSelectedDate} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsReportOpen(false)
                      setSelectedDate(undefined)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const reportText = generateReportText(
                        organizedTodos,
                        selectedDate,
                      )
                      copyToClipboard(reportText)
                      toast.success('Report copied to clipboard!')
                      setIsReportOpen(false)
                      setSelectedDate(undefined)
                    }}
                  >
                    Generate Report
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedDate
                    ? `Report will show "Update for: ${format(selectedDate, 'PPP')}" instead of individual completion dates.`
                    : 'Leave date unselected to show individual completion dates for each task.'}
                </p>
              </div>
            </PopoverContent>
          </Popover>
        )}
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
            <div className="text-muted-foreground  ">{emptyMessage}</div>
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
