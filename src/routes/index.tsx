import { createFileRoute } from '@tanstack/react-router'
import { TodoBoard } from 'src/components/todo/todo-board'
import { ProtectedRoute } from '~/components/protected-route'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <ProtectedRoute>
      <TodoBoard />
    </ProtectedRoute>
  )
}
