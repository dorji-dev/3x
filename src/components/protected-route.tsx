import { useRouter } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { useEffect, type ReactNode } from 'react'
import Loader from './ui/loader'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useConvexAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) return <Loader />

  if (!isAuthenticated) return null

  return <>{children}</>
}
