import { useRouter } from '@tanstack/react-router'
import { useConvexAuth, useQuery } from 'convex/react'
import { useEffect, type ReactNode } from 'react'
import Loader from './ui/loader'
import { api } from 'convex/_generated/api'
import { Button } from './ui/button'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const currentUser = useQuery(api.users.getCurrentUser)

  const allowedEmails =
    (import.meta as any).env.VITE_ALLOWED_EMAILS?.split('_') ?? []

  console.log(
    'currentUser::::',
    currentUser,
    'allowedEmails::::',
    allowedEmails,
  )

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) return <Loader />

  if (!allowedEmails.includes(currentUser?.email ?? '')) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-8">
          <p className="font-bold">You are not allowed to access this app</p>
          <Button
            onClick={() => {
              window.open('https://x.com/DorjiBolt', '_blank')
            }}
          >
            Request Access
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
