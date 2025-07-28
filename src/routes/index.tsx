import { createFileRoute } from '@tanstack/react-router'
import { TodoBoard } from 'src/components/todo/todo-board'
import { ProtectedRoute } from '~/components/protected-route'
import { Navbar } from '~/components/ui/navbar'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <ProtectedRoute>
      <div className="h-full max-w-7xl mx-auto flex flex-col">
        <Navbar />
        <TodoBoard />
      </div>
    </ProtectedRoute>
  )
}
