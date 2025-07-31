import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useTheme } from '../providers/theme-provider'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      toastOptions={{
        style: {
          borderRadius: 0,
        },
      }}
      closeButton
      position="top-right"
      theme={theme as ToasterProps['theme']}
      className="toaster group rounded-none"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
