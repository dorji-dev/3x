import { createFileRoute, useRouter } from '@tanstack/react-router'
import { GoogleSignInButton } from 'src/components/ui/google-sign-in'
import { useConvexAuth } from 'convex/react'
import { useEffect } from 'react'
import Loader from 'src/components/ui/loader'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: '/' })
    }
  }, [isAuthenticated])

  if (isLoading && !isAuthenticated) return <Loader />

  return (
    <div className="h-full flex items-center justify-center">
      <GoogleSignInButton />
    </div>
  )
}
