"use client"

import {
  ScrollText,
  CheckCircle2,
  Info,
  Cpu,
  GitBranch,
  Gauge,
  FlaskConical,
  Cloud,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type GovernanceDecision,
  MODEL_REGISTRY,
  COST_TIER_META,
} from "@/lib/governance"

export function GovernancePanel({
  decision,
}: {
  decision: GovernanceDecision
}) {
  const selected = MODEL_REGISTRY[decision.selectedModelId]
  const fallback = MODEL_REGISTRY[decision.fallbackModelId]
  const isGateway = decision.executionMode === "gateway"

  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ScrollText className="h-4 w-4 text-primary" />
          Governance details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {/* Decision summary */}
        <dl className="space-y-2.5">
          <DetailRow
            icon={Cpu}
            label="Selected model"
            value={`${selected.name} · ${selected.provider}`}
          />
          <DetailRow
            icon={GitBranch}
            label="Fallback model"
            value={`${fallback.name} · ${fallback.provider}`}
          />
          <DetailRow
            icon={Gauge}
            label="Cost tier"
            value={COST_TIER_META[decision.costTier].label}
          />
          <DetailRow
            icon={isGateway ? Cloud : FlaskConical}
            label="Execution mode"
            value={isGateway ? "AI Gateway" : "Mock Demo"}
            highlight={isGateway}
          />
        </dl>

        <div className="space-y-1.5 rounded-md border border-border bg-background/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Routing reason
          </p>
          <p className="text-xs leading-relaxed text-foreground">
            {decision.routingReason}
          </p>
        </div>

        {/* Applied policies */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Applied policies
          </p>
          <div className="space-y-2">
            {decision.policies.map((p) => (
              <div
                key={p.label}
                className="flex items-start gap-2 rounded-md border border-border bg-background/40 p-2.5"
              >
                {p.status === "enforced" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <p className="text-xs font-medium text-foreground">{p.label}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {p.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd
        className={`text-xs font-medium ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
