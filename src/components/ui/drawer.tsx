import * as React from 'react'
import { cn } from '@/lib/utils'

interface DrawerContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DrawerContext = React.createContext<DrawerContextValue | undefined>(
  undefined,
)

const useDrawerContext = () => {
  const context = React.useContext(DrawerContext)
  if (!context) {
    throw new Error('Drawer components must be used within a Drawer component')
  }
  return context
}

interface DrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Drawer({
  open: controlledOpen,
  onOpenChange,
  children,
}: DrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen

  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </DrawerContext.Provider>
  )
}

interface DrawerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const DrawerTrigger = React.forwardRef<
  HTMLButtonElement,
  DrawerTriggerProps
>(({ onClick, children, ...props }, ref) => {
  const { setOpen } = useDrawerContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(true)
    onClick?.(e)
  }

  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  )
})
DrawerTrigger.displayName = 'DrawerTrigger'

interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DrawerContent = React.forwardRef<
  HTMLDivElement,
  DrawerContentProps
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useDrawerContext()

  const [mounted, setMounted] = React.useState(open)

  React.useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }

    const t = window.setTimeout(() => setMounted(false), 300)
    return () => window.clearTimeout(t)
  }, [open])

  React.useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  React.useEffect(() => {
    if (!mounted) return

    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mounted, open])

  if (!mounted) return null

  return (
    <>
      <div
        data-state={open ? 'open' : 'closed'}
        className={cn('ui-backdrop fixed inset-0 z-50 bg-black/50')}
        onClick={() => setOpen(false)}
      />
      <div
        ref={ref}
        data-state={open ? 'open' : 'closed'}
        className={cn(
          'ui-drawer-panel fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-lg',
          'max-h-[85vh] overflow-y-auto',
          !open && 'pointer-events-none',
          className,
        )}
        {...props}
      >
        <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mt-3 mb-6" />
        {children}
      </div>
    </>
  )
})
DrawerContent.displayName = 'DrawerContent'

export const DrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 text-center px-6', className)}
    {...props}
  />
))
DrawerHeader.displayName = 'DrawerHeader'

export const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
))
DrawerTitle.displayName = 'DrawerTitle'

export const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DrawerDescription.displayName = 'DrawerDescription'

export const DrawerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-2 p-6', className)}
    {...props}
  />
))
DrawerFooter.displayName = 'DrawerFooter'
