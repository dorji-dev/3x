import { Button } from './button'
import { useAuth } from 'src/lib/auth'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import ThemeSwitcher from 'src/components/theme-switcher'

export function Navbar() {
  const { signOut } = useAuth()
  const currentUser = useQuery(api.users.getCurrentUser)

  return (
    <nav className="flex items-center p-4 justify-between gap-2 sm:gap-4 border">
      <div className="flex items-center gap-3">
        {currentUser?.image && (
          <img
            src={currentUser.image}
            alt={currentUser.name || 'User'}
            className="w-8 h-8 rounded-full border border-primary/50"
          />
        )}
        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
          {currentUser?.name || currentUser?.email}
        </span>
      </div>

      <div className="flex items-center gap-x-4">
        <Button variant="outline" onClick={signOut}>
          <span>Sign Out</span>
        </Button>
        <ThemeSwitcher />
      </div>
    </nav>
  )
}
