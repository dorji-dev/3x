import { useState, useEffect } from 'react'
import { Play, Pause, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { useMutation } from '~/lib/convex-helper'

interface TimeTrackerProps {
  todoId: Id<'todos'>
  durationMinutes?: number
  startTime?: number
  accumulatedTime?: number
  completedTime?: number
  createdAt: number
  completed: boolean
  isSubtask?: boolean
}

export function TimeTracker({
  todoId,
  durationMinutes,
  startTime,
  accumulatedTime,
  completedTime,
  completed,
  isSubtask = false,
}: TimeTrackerProps) {
  const [currentTime, setCurrentTime] = useState(Date.now())

  const startTimer = useMutation(api.todos.startTimer)
  const stopTimer = useMutation(api.todos.stopTimer)

  // Update current time every second when timer is running
  useEffect(() => {
    if (startTime && !completed) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [startTime, completed])

  const handleStartTimer = async () => {
    try {
      await startTimer.mutateAsync({ id: todoId })
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handleStopTimer = async () => {
    try {
      await stopTimer.mutateAsync({ id: todoId })
    } catch (error) {
      console.error('Failed to stop timer:', error)
    }
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

  const formatElapsedTime = (milliseconds: number): string => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getTotalElapsedTime = (): number => {
    const accumulated = accumulatedTime || 0

    if (completed && completedTime) {
      // For completed tasks, use the final accumulated time
      return accumulated
    }

    if (startTime && !completed) {
      // Currently running: accumulated time + current session time
      return accumulated + (currentTime - startTime)
    }

    // Paused or not started: just accumulated time
    return accumulated
  }

  const getPerformanceStats = () => {
    if (!completed || !completedTime || !durationMinutes) {
      return null
    }

    const actualMinutes = Math.floor(getTotalElapsedTime() / (1000 * 60))
    const estimatedMinutes = durationMinutes
    const difference = actualMinutes - estimatedMinutes
    const percentage = Math.round((difference / estimatedMinutes) * 100)

    if (difference <= 0) {
      return {
        type: 'success' as const,
        icon: CheckCircle2,
        message:
          difference === 0 ? 'Perfect!' : `${Math.abs(difference)}m early`,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-muted-foreground/10',
      }
    } else {
      return {
        type: 'warning' as const,
        icon: AlertCircle,
        message: `${difference}m over (+${percentage}%)`,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-muted-foreground/10',
      }
    }
  }

  const isRunning = startTime && !completed
  const totalElapsedTime = getTotalElapsedTime()
  const performanceStats = getPerformanceStats()

  // Don't show anything if there's no duration set
  if (!durationMinutes) {
    return null
  }

  return (
    <div className={`space-y-2 ${isSubtask ? 'text-xs' : ' '}`}>
      {/* Timer Controls and Display */}
      {!completed && (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={isRunning ? handleStopTimer : handleStartTimer}
            className={`h-6 px-2 text-xs ${isSubtask ? 'h-5 px-1.5' : ''}`}
          >
            {isRunning ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                {totalElapsedTime > 0 ? 'Resume' : 'Start'}
              </>
            )}
          </Button>

          {(isRunning || totalElapsedTime > 0) && (
            <div className="flex items-center gap-1 text-primary">
              <Clock className="h-3 w-3" />
              <span className="font-mono text-xs">
                {formatElapsedTime(totalElapsedTime)} /{' '}
                {formatDuration(durationMinutes)}
              </span>
              {!isRunning && totalElapsedTime > 0 && (
                <span className="text-xs text-amber-500">⏸</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Performance Stats for Completed Tasks */}
      {completed && performanceStats && (
        <div
          className={`flex items-center gap-2 p-1.5 rounded ${performanceStats.bgColor}`}
        >
          <performanceStats.icon
            className={`h-3 w-3 ${performanceStats.color}`}
          />
          <span className={`text-xs font-medium ${performanceStats.color}`}>
            {performanceStats.message}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatElapsedTime(totalElapsedTime)}
          </span>
        </div>
      )}

      {/* Simple Duration Display for Non-Running Tasks */}
      {!completed && !isRunning && totalElapsedTime === 0 && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-xs">{formatDuration(durationMinutes)}</span>
        </div>
      )}
    </div>
  )
}
