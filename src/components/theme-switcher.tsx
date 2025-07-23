'use client'

import { useState } from 'react'
import { LaptopMinimalIcon, MoonIcon, SunIcon } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'
import { Button } from 'src/components/ui/button'

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <SunIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <SunIcon /> Light
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LaptopMinimalIcon /> System
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MoonIcon /> Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
