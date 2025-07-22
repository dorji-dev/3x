import { Link } from '@tanstack/react-router'
import { Button } from './button'
import { useAuth } from '~/lib/auth'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

export function Navbar() {
  const { isAuthenticated, signOut } = useAuth()
  const currentUser = useQuery(api.users.getCurrentUser)

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="text-xl font-bold text-gray-900 hover:text-gray-700"
          >
            My App
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && currentUser ? (
              <>
                <div className="flex items-center gap-3">
                  {currentUser.image && (
                    <img
                      src={currentUser.image}
                      alt={currentUser.name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-600">
                    {currentUser.name || currentUser.email}
                  </span>
                </div>
                <Button variant="outline" onClick={signOut} size="sm">
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="default" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
