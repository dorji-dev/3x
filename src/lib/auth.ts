import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth } from 'convex/react'

export function useAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { signIn, signOut } = useAuthActions()

  const signInWithGoogle = () => {
    void signIn('google', { redirectTo: window.location.href })
  }

  const handleSignOut = () => {
    void signOut()
  }

  return {
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    signOut: handleSignOut,
  }
}
