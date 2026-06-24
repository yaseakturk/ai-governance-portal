"use client"

import { ListChecks } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TASK_TYPES, type TaskType } from "@/lib/governance"

const COMPLEXITY_STYLES: Record<TaskType["complexity"], string> = {
  low: "bg-success/15 text-success border-success/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  high: "bg-warning/15 text-warning border-warning/30",
}

export function TaskTypeSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const task = TASK_TYPES.find((t) => t.id === value)

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <ListChecks className="h-3.5 w-3.5" />
        Task type
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-auto w-full py-2.5">
          <SelectValue placeholder="Select a task type">
            {task?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TASK_TYPES.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex flex-col">
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {task && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge
            variant="outline"
            className={`capitalize ${COMPLEXITY_STYLES[task.complexity]}`}
          >
            {task.complexity} complexity
          </Badge>
          <span className="text-xs text-muted-foreground">{task.description}</span>
        </div>
      )}
    </div>
  )
}
