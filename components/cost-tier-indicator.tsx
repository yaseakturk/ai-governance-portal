"use client"

import { COST_TIER_META, type CostTier } from "@/lib/governance"

const TIERS: CostTier[] = ["economy", "standard", "premium"]

const TIER_COLOR: Record<CostTier, string> = {
  economy: "bg-success",
  standard: "bg-primary",
  premium: "bg-warning",
}

const TIER_TEXT: Record<CostTier, string> = {
  economy: "text-success",
  standard: "text-primary",
  premium: "text-warning",
}

export function CostTierIndicator({ tier }: { tier: CostTier }) {
  const meta = COST_TIER_META[tier]
  const activeIndex = TIERS.indexOf(tier)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Cost tier
        </span>
        <span className={`text-sm font-semibold ${TIER_TEXT[tier]}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-3 flex gap-1.5">
        {TIERS.map((t, i) => (
          <div
            key={t}
            className={`h-1.5 flex-1 rounded-full ${
              i <= activeIndex ? TIER_COLOR[tier] : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{meta.budget}</span>
        <span className="text-muted-foreground">budget cap</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {meta.description}
      </p>
    </div>
  )
}
