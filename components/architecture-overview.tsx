"use client"

import {
  Boxes,
  ShieldCheck,
  Network,
  Cpu,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const STAGES = [
  {
    icon: Boxes,
    title: "Applications",
    detail: "Internal apps submit prompts",
  },
  {
    icon: ShieldCheck,
    title: "Governance Layer",
    detail: "Routing, cost tiers & policy",
  },
  {
    icon: Network,
    title: "AI Gateway",
    detail: "Unified routing & failover",
  },
  {
    icon: Cpu,
    title: "Model Providers",
    detail: "OpenAI · Anthropic · Google",
  },
]

export function ArchitectureOverview() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Network className="h-4 w-4 text-primary" />
          Architecture overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          {STAGES.map((stage, i) => (
            <div
              key={stage.title}
              className="flex flex-1 items-center gap-3 md:flex-col md:gap-3"
            >
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background/40 p-3 md:w-full md:flex-col md:items-start md:gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <stage.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {stage.title}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {stage.detail}
                  </p>
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <ChevronRight className="h-4 w-4 shrink-0 rotate-90 text-muted-foreground md:rotate-0" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Every request flows through the governance layer before reaching any
          provider — enforcing model allowlists, cost guardrails, data
          residency, and automatic cross-provider failover for vendor
          independence.
        </p>
      </CardContent>
    </Card>
  )
}
