"use client"

import { Boxes } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { APPLICATIONS, type Application } from "@/lib/governance"

const SENSITIVITY_STYLES: Record<Application["sensitivity"], string> = {
  internal: "bg-muted text-muted-foreground",
  confidential: "bg-warning/15 text-warning border-warning/30",
  restricted: "bg-destructive/15 text-destructive border-destructive/30",
}

export function ApplicationSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const app = APPLICATIONS.find((a) => a.id === value)

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Boxes className="h-3.5 w-3.5" />
        Application
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-auto w-full py-2.5">
          <SelectValue placeholder="Select an application">
            {app?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {APPLICATIONS.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              <div className="flex flex-col">
                <span className="font-medium">{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.team}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {app && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge
            variant="outline"
            className={`capitalize ${SENSITIVITY_STYLES[app.sensitivity]}`}
          >
            {app.sensitivity}
          </Badge>
          <span className="text-xs text-muted-foreground">{app.description}</span>
        </div>
      )}
    </div>
  )
}
