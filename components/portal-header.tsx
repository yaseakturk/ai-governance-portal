import { ShieldCheck, Activity } from "lucide-react"

export function PortalHeader() {
  return (
    <header className="border-b border-border bg-sidebar">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-foreground">
              AI Governance Portal
            </h1>
            <p className="text-xs text-muted-foreground">
              Platform Engineering · Model Operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Gateway operational
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>
              <span className="font-medium text-foreground">5</span> apps governed
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
