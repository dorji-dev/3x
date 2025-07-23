import { Button } from './button'
import { useAuth } from 'src/lib/auth'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import ThemeSwitcher from '../theme-switcher'

export function Navbar() {
  const { isAuthenticated, signOut } = useAuth()
  const currentUser = useQuery(api.users.getCurrentUser)

  return (
    <nav className="flex items-center p-4 max-w-7xl mx-auto justify-between gap-2 sm:gap-4">
      {isAuthenticated && currentUser ? (
        <>
          <div className="hidden sm:flex items-center gap-3">
            {currentUser.image && (
              <img
                src={currentUser.image}
                alt={currentUser.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-600 truncate max-w-[150px]">
              {currentUser.name || currentUser.email}
            </span>
          </div>

          <div className="sm:hidden">
            {currentUser.image && (
              <img
                src={currentUser.image}
                alt={currentUser.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            )}
          </div>
        </>
      ) : (
        <div></div>
      )}

      <div>
        {isAuthenticated && currentUser && (
          <Button
            variant="outline"
            onClick={signOut}
            size="sm"
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Sign Out</span>
            <span className="sm:hidden">Out</span>
          </Button>
        )}
        <ThemeSwitcher />
      </div>
    </nav>
  )
}
