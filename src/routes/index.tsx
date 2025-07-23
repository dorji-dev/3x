import { createFileRoute } from '@tanstack/react-router'
import { TodoBoard } from 'src/components/todo/todo-board'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <TodoBoard />
}
