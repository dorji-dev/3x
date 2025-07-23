import { createFileRoute } from '@tanstack/react-router'
import { GoogleSignInButton } from 'src/components/ui/google-sign-in'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  )
}
