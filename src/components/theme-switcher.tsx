import { MoonIcon, SunIcon } from 'lucide-react'

import { Button } from 'src/components/ui/button'
import { useTheme } from './providers/theme-provider'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </Button>
  )
}
