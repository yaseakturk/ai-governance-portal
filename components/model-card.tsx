"use client"

import { Cpu, GitBranch, Clock, Gauge, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { type ModelInfo } from "@/lib/governance"

const LATENCY_LABEL: Record<ModelInfo["latency"], string> = {
  low: "Low latency",
  medium: "Medium latency",
  high: "High latency",
}

export function ModelCard({
  model,
  variant,
  active,
}: {
  model: ModelInfo
  variant: "selected" | "fallback"
  active?: boolean
}) {
  const isSelected = variant === "selected"

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isSelected
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card"
      } ${active ? "ring-2 ring-primary/60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-md ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isSelected ? (
              <Cpu className="h-4 w-4" />
            ) : (
              <GitBranch className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{model.name}</p>
            <p className="text-xs text-muted-foreground">{model.provider}</p>
          </div>
        </div>
        <Badge variant={isSelected ? "default" : "secondary"} className="shrink-0">
          {isSelected ? "Primary" : "Fallback"}
        </Badge>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {model.strengths}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3 text-xs">
        <Stat icon={Gauge} label="Context" value={model.contextWindow} />
        <Stat icon={Clock} label="Latency" value={LATENCY_LABEL[model.latency]} />
        <Stat
          icon={DollarSign}
          label="Input"
          value={`$${model.inputPrice.toFixed(2)}/1M`}
        />
        <Stat
          icon={DollarSign}
          label="Output"
          value={`$${model.outputPrice.toFixed(2)}/1M`}
        />
      </div>

      {active && (
        <p className="mt-3 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          Served this request
        </p>
      )}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium text-foreground">{value}</span>
    </div>
  )
}
