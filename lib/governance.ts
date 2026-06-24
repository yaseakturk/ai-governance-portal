// Enterprise AI Governance — shared routing logic used by both the
// client (to render the policy decision) and the server (to execute it).

export type CostTier = "economy" | "standard" | "premium"

export type ModelInfo = {
  id: string
  name: string
  provider: "OpenAI" | "Anthropic" | "Google"
  contextWindow: string
  inputPrice: number // USD per 1M input tokens (illustrative)
  outputPrice: number // USD per 1M output tokens (illustrative)
  latency: "low" | "medium" | "high"
  strengths: string
}

// Internal model allowlist approved by the platform team.
export const MODEL_REGISTRY: Record<string, ModelInfo> = {
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "OpenAI",
    contextWindow: "128K",
    inputPrice: 0.15,
    outputPrice: 0.6,
    latency: "low",
    strengths: "Fast, low-cost classification and summarization",
  },
  "anthropic/claude-haiku-4.5": {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    contextWindow: "200K",
    inputPrice: 1.0,
    outputPrice: 5.0,
    latency: "low",
    strengths: "Low-latency drafting with strong safety guardrails",
  },
  "openai/gpt-5-mini": {
    id: "openai/gpt-5-mini",
    name: "GPT-5 mini",
    provider: "OpenAI",
    contextWindow: "256K",
    inputPrice: 0.25,
    outputPrice: 2.0,
    latency: "medium",
    strengths: "Balanced reasoning and cost for general workloads",
  },
  "google/gemini-3-flash": {
    id: "google/gemini-3-flash",
    name: "Gemini 3 Flash",
    provider: "Google",
    contextWindow: "1M",
    inputPrice: 0.3,
    outputPrice: 2.5,
    latency: "low",
    strengths: "Massive context for long-document extraction",
  },
  "anthropic/claude-sonnet-4.5": {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    contextWindow: "200K",
    inputPrice: 3.0,
    outputPrice: 15.0,
    latency: "medium",
    strengths: "High-quality code generation and structured reasoning",
  },
  "openai/gpt-5.2": {
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    provider: "OpenAI",
    contextWindow: "400K",
    inputPrice: 5.0,
    outputPrice: 20.0,
    latency: "high",
    strengths: "Frontier reasoning for complex analysis",
  },
  "anthropic/claude-opus-4.5": {
    id: "anthropic/claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "Anthropic",
    contextWindow: "200K",
    inputPrice: 7.5,
    outputPrice: 30.0,
    latency: "high",
    strengths: "Highest-accuracy reasoning for regulated workloads",
  },
}

export type Sensitivity = "internal" | "confidential" | "restricted"

export type Application = {
  id: string
  name: string
  team: string
  description: string
  sensitivity: Sensitivity
  // Provider allowlist enforced for this application's data class.
  allowedProviders: ModelInfo["provider"][]
  region: string
}

export const APPLICATIONS: Application[] = [
  {
    id: "support-copilot",
    name: "Customer Support Copilot",
    team: "Global Support",
    description: "Agent-assist for live customer conversations",
    sensitivity: "confidential",
    allowedProviders: ["OpenAI", "Anthropic"],
    region: "us-east / eu-west",
  },
  {
    id: "code-assistant",
    name: "Engineering Code Assistant",
    team: "Developer Platform",
    description: "In-IDE code generation and review",
    sensitivity: "internal",
    allowedProviders: ["OpenAI", "Anthropic", "Google"],
    region: "us-east",
  },
  {
    id: "sales-intel",
    name: "Sales Intelligence",
    team: "Revenue Operations",
    description: "Account research and outreach drafting",
    sensitivity: "internal",
    allowedProviders: ["OpenAI", "Anthropic", "Google"],
    region: "us-east",
  },
  {
    id: "hr-helpdesk",
    name: "HR Helpdesk",
    team: "People Operations",
    description: "Employee policy and benefits assistant",
    sensitivity: "confidential",
    allowedProviders: ["Anthropic", "OpenAI"],
    region: "us-east",
  },
  {
    id: "finance-analytics",
    name: "Finance Analytics",
    team: "Corporate Finance",
    description: "Earnings and risk narrative analysis",
    sensitivity: "restricted",
    allowedProviders: ["Anthropic"],
    region: "us-east (SOC 2 / in-region only)",
  },
]

export type TaskType = {
  id: string
  name: string
  description: string
  complexity: "low" | "medium" | "high"
}

export const TASK_TYPES: TaskType[] = [
  {
    id: "classification",
    name: "Classification & Routing",
    description: "Categorize or tag inbound content",
    complexity: "low",
  },
  {
    id: "summarization",
    name: "Summarization",
    description: "Condense long content into key points",
    complexity: "low",
  },
  {
    id: "extraction",
    name: "Data Extraction",
    description: "Pull structured fields from documents",
    complexity: "medium",
  },
  {
    id: "drafting",
    name: "Content Drafting",
    description: "Generate emails, replies, or copy",
    complexity: "medium",
  },
  {
    id: "code-generation",
    name: "Code Generation",
    description: "Write or refactor source code",
    complexity: "high",
  },
  {
    id: "reasoning",
    name: "Complex Reasoning",
    description: "Multi-step analysis and decisions",
    complexity: "high",
  },
]

export type GovernanceDecision = {
  selectedModelId: string
  fallbackModelId: string
  costTier: CostTier
  rationale: string[]
  policies: { label: string; status: "enforced" | "info"; detail: string }[]
}

const TIER_BY_COMPLEXITY: Record<TaskType["complexity"], CostTier> = {
  low: "economy",
  medium: "standard",
  high: "premium",
}

export const COST_TIER_META: Record<
  CostTier,
  { label: string; budget: string; description: string }
> = {
  economy: {
    label: "Economy",
    budget: "≤ $0.60 / 1M tokens",
    description: "Lowest-cost models for high-volume, low-risk tasks",
  },
  standard: {
    label: "Standard",
    budget: "$0.60 – $5 / 1M tokens",
    description: "Balanced quality and cost for everyday workloads",
  },
  premium: {
    label: "Premium",
    budget: "$5+ / 1M tokens",
    description: "Frontier models reserved for high-value tasks",
  },
}

function pickForTier(
  tier: CostTier,
  allowed: ModelInfo["provider"][],
): string[] {
  // Candidate models per tier, in preference order.
  const tiers: Record<CostTier, string[]> = {
    economy: ["openai/gpt-4o-mini", "anthropic/claude-haiku-4.5", "google/gemini-3-flash"],
    standard: ["openai/gpt-5-mini", "google/gemini-3-flash", "anthropic/claude-sonnet-4.5"],
    premium: ["anthropic/claude-opus-4.5", "openai/gpt-5.2", "anthropic/claude-sonnet-4.5"],
  }
  const filtered = tiers[tier].filter((id) =>
    allowed.includes(MODEL_REGISTRY[id].provider),
  )
  // Always guarantee at least two candidates for primary + fallback.
  if (filtered.length < 2) {
    for (const id of Object.keys(MODEL_REGISTRY)) {
      if (allowed.includes(MODEL_REGISTRY[id].provider) && !filtered.includes(id)) {
        filtered.push(id)
      }
    }
  }
  return filtered
}

export function getGovernanceDecision(
  appId: string,
  taskId: string,
): GovernanceDecision {
  const app = APPLICATIONS.find((a) => a.id === appId) ?? APPLICATIONS[0]
  const task = TASK_TYPES.find((t) => t.id === taskId) ?? TASK_TYPES[0]

  let tier = TIER_BY_COMPLEXITY[task.complexity]

  // Restricted data classes are upgraded to premium for accuracy + audit.
  if (app.sensitivity === "restricted" && tier === "economy") {
    tier = "standard"
  }

  const candidates = pickForTier(tier, app.allowedProviders)
  const selectedModelId = candidates[0]
  // Prefer a fallback from a different provider for resilience.
  const fallbackModelId =
    candidates.find(
      (id) =>
        MODEL_REGISTRY[id].provider !==
        MODEL_REGISTRY[selectedModelId].provider,
    ) ??
    candidates[1] ??
    candidates[0]

  const selected = MODEL_REGISTRY[selectedModelId]
  const fallback = MODEL_REGISTRY[fallbackModelId]

  const rationale: string[] = [
    `Task "${task.name}" is rated ${task.complexity} complexity → ${COST_TIER_META[tier].label} cost tier.`,
    `${selected.name} (${selected.provider}) selected: ${selected.strengths.toLowerCase()}.`,
    `${fallback.name} (${fallback.provider}) set as cross-provider fallback for resilience.`,
  ]

  const policies: GovernanceDecision["policies"] = [
    {
      label: "Data residency",
      status: "enforced",
      detail: `Inference pinned to ${app.region}.`,
    },
    {
      label: "Model allowlist",
      status: "enforced",
      detail: `${app.name} may only call ${app.allowedProviders.join(", ")}.`,
    },
    {
      label: "Cost guardrail",
      status: "enforced",
      detail: `${COST_TIER_META[tier].label} budget cap (${COST_TIER_META[tier].budget}).`,
    },
    {
      label: "Automatic failover",
      status: "info",
      detail: `Routes to ${fallback.name} on rate limit or provider outage.`,
    },
  ]

  if (app.sensitivity !== "internal") {
    policies.push({
      label: "PII redaction",
      status: "enforced",
      detail: "Prompts are scrubbed for PII before egress and logged for audit.",
    })
  }

  return { selectedModelId, fallbackModelId, costTier: tier, rationale, policies }
}
