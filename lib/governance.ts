// Enterprise AI Governance — shared routing logic used by both the
// client (to render the policy decision) and the server (to execute it).

export type CostTier = "economy" | "standard" | "premium"

export type ExecutionMode = "mock" | "gateway"

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
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    contextWindow: "128K",
    inputPrice: 2.5,
    outputPrice: 10.0,
    latency: "medium",
    strengths: "Balanced multimodal reasoning with broad tooling support",
  },
  "anthropic/claude-sonnet-4.5": {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    contextWindow: "200K",
    inputPrice: 3.0,
    outputPrice: 15.0,
    latency: "medium",
    strengths: "High-quality code generation and structured legal reasoning",
  },
}

export type Sensitivity = "internal" | "confidential" | "restricted"

export type Application = {
  id: string
  name: string
  team: string
  description: string
  sensitivity: Sensitivity
  region: string
  executionMode: ExecutionMode
  // Explicit, platform-approved routing for this application.
  primaryModelId: string
  fallbackModelId: string
  routingReason: string
  // Provider allowlist enforced for this application's data class.
  allowedProviders: ModelInfo["provider"][]
}

export const APPLICATIONS: Application[] = [
  {
    id: "support-assistant",
    name: "Support Assistant",
    team: "Global Support",
    description: "Agent-assist and ticket summarization for live support",
    sensitivity: "confidential",
    region: "us-east / eu-west",
    executionMode: "mock",
    primaryModelId: "openai/gpt-4o-mini",
    fallbackModelId: "anthropic/claude-haiku-4.5",
    routingReason:
      "High-volume ticket summarization is served from a cost-optimized demo profile.",
    allowedProviders: ["OpenAI", "Anthropic"],
  },
  {
    id: "hr-assistant",
    name: "HR Assistant",
    team: "People Operations",
    description: "Onboarding, handbook, and benefits knowledge assistant",
    sensitivity: "confidential",
    region: "us-east",
    executionMode: "mock",
    primaryModelId: "anthropic/claude-haiku-4.5",
    fallbackModelId: "openai/gpt-4o-mini",
    routingReason:
      "Employee-facing handbook summaries are served from a safety-tuned demo profile.",
    allowedProviders: ["Anthropic", "OpenAI"],
  },
  {
    id: "legal-assistant",
    name: "Legal Assistant",
    team: "Corporate Legal",
    description: "Contract review and legal risk assessment",
    sensitivity: "restricted",
    region: "us-east (SOC 2 / in-region only)",
    executionMode: "gateway",
    primaryModelId: "anthropic/claude-sonnet-4.5",
    fallbackModelId: "openai/gpt-4o",
    routingReason: "Long-context legal analysis and contract risk assessment.",
    allowedProviders: ["Anthropic", "OpenAI"],
  },
  {
    id: "finance-analytics",
    name: "Finance Analytics",
    team: "Corporate Finance",
    description: "Earnings, forecasting, and risk narrative analysis",
    sensitivity: "restricted",
    region: "us-east (SOC 2 / in-region only)",
    executionMode: "gateway",
    primaryModelId: "openai/gpt-4o",
    fallbackModelId: "anthropic/claude-sonnet-4.5",
    routingReason:
      "Financial analysis requires balanced reasoning and cost efficiency.",
    allowedProviders: ["OpenAI", "Anthropic"],
  },
  {
    id: "code-assistant",
    name: "Code Assistant",
    team: "Developer Platform",
    description: "Architecture review and in-IDE code analysis",
    sensitivity: "internal",
    region: "us-east",
    executionMode: "gateway",
    primaryModelId: "anthropic/claude-sonnet-4.5",
    fallbackModelId: "openai/gpt-4o",
    routingReason:
      "Architecture review and code analysis require advanced reasoning.",
    allowedProviders: ["Anthropic", "OpenAI"],
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
  executionMode: ExecutionMode
  selectedModelId: string
  fallbackModelId: string
  costTier: CostTier
  routingReason: string
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

export function getGovernanceDecision(
  appId: string,
  taskId: string,
): GovernanceDecision {
  const app = APPLICATIONS.find((a) => a.id === appId) ?? APPLICATIONS[0]
  const task = TASK_TYPES.find((t) => t.id === taskId) ?? TASK_TYPES[0]

  let tier = TIER_BY_COMPLEXITY[task.complexity]

  // Restricted data classes are upgraded for accuracy + audit.
  if (app.sensitivity === "restricted" && tier === "economy") {
    tier = "standard"
  }

  const selectedModelId = app.primaryModelId
  const fallbackModelId = app.fallbackModelId
  const selected = MODEL_REGISTRY[selectedModelId]
  const fallback = MODEL_REGISTRY[fallbackModelId]

  const rationale: string[] = [
    app.routingReason,
    `Task "${task.name}" is rated ${task.complexity} complexity → ${COST_TIER_META[tier].label} cost tier.`,
    `${selected.name} (${selected.provider}) primary; ${fallback.name} (${fallback.provider}) cross-provider fallback for resilience.`,
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

  return {
    executionMode: app.executionMode,
    selectedModelId,
    fallbackModelId,
    costTier: tier,
    routingReason: app.routingReason,
    rationale,
    policies,
  }
}

// Deterministic, realistic mock output for demo-only applications.
// These applications never call a model — output is generated locally so the
// governance flow can be demonstrated without provider credentials.
export function getMockResponse(
  appId: string,
  taskId: string,
  prompt: string,
): string {
  const task = TASK_TYPES.find((t) => t.id === taskId)?.name ?? "Request"
  const excerpt = prompt.trim().slice(0, 120)
  const ref = `${appId.slice(0, 3).toUpperCase()}-${Math.floor(
    1000 + (hashString(prompt) % 9000),
  )}`

  if (appId === "support-assistant") {
    return [
      `Ticket Summary — ${ref}`,
      ``,
      `Category: ${task}`,
      `Priority: High`,
      `Sentiment: Frustrated, but cooperative`,
      ``,
      `Summary:`,
      `Customer reports an issue regarding "${excerpt}${
        prompt.length > 120 ? "…" : ""
      }". The account is in good standing and the customer has contacted support twice on this topic.`,
      ``,
      `Recommended next steps:`,
      `1. Acknowledge the delay and confirm the affected order/account.`,
      `2. Escalate to Tier 2 billing for a status check within SLA (4 hours).`,
      `3. Offer a goodwill credit per the retention policy if unresolved in 24h.`,
      ``,
      `Suggested reply tone: Empathetic, solution-oriented, no commitments beyond policy.`,
    ].join("\n")
  }

  if (appId === "hr-assistant") {
    return [
      `HR Knowledge Summary — ${ref}`,
      ``,
      `Topic: ${task}`,
      `Source: Employee Handbook v4.2 · Benefits Guide 2025`,
      ``,
      `Answer:`,
      `Regarding "${excerpt}${
        prompt.length > 120 ? "…" : ""
      }", here is the relevant guidance:`,
      ``,
      `• New hires complete onboarding (I-9, payroll, benefits enrollment) within the first 5 business days.`,
      `• Benefits elections must be finalized within 30 days of the start date; coverage is effective the 1st of the following month.`,
      `• PTO accrues at 1.5 days/month and is available after the 90-day introductory period.`,
      ``,
      `For policy exceptions, route to your HR Business Partner. This summary is informational and does not override official plan documents.`,
    ].join("\n")
  }

  return [
    `Summary — ${ref}`,
    ``,
    `Task: ${task}`,
    `Input: "${excerpt}${prompt.length > 120 ? "…" : ""}"`,
    ``,
    `This is a demonstration response generated locally for a Mock Demo application.`,
  ].join("\n")
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}
