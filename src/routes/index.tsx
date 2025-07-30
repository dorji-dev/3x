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
      <div className="h-full p-1 max-w-7xl mx-auto flex flex-col">
        <Navbar />
        <TodoBoard />
        <p className="text-[10px] text-accent-foreground/60 text-center pb-4">
          By -{' '}
          <a href="https://dorji.dev" target="_blank" className="underline">
            Dorji Tshering
          </a>
        </p>
      </div>
    </ProtectedRoute>
  )
}
