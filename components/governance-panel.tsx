"use client"

import { ScrollText, CheckCircle2, Info, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type GovernanceDecision } from "@/lib/governance"

export function GovernancePanel({
  decision,
}: {
  decision: GovernanceDecision
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ScrollText className="h-4 w-4 text-primary" />
          Governance decision
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5" />
            Why this routing
          </p>
          <ul className="space-y-1.5">
            {decision.rationale.map((r, i) => (
              <li
                key={i}
                className="flex gap-2 text-xs leading-relaxed text-foreground"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Enforced policies
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
