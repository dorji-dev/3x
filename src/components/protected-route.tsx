import { useRouter } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { useEffect, type ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useConvexAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading])

  if (isLoading && !isAuthenticated) return <div>Loading...</div>

  return <>{children}</>
}
