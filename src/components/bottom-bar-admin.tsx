import { Shield, Users } from 'lucide-react'

export function BottomBarAdmin() {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[860px] items-center justify-between px-4 py-3 text-sm">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Shield className="size-4" /> Admin
        </div>
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Users className="size-4" /> Manage
        </div>
      </div>
    </div>
  )
}
