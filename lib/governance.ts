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
  _taskId: string,
  prompt: string,
): string {
  const excerpt = prompt.trim()

  if (appId === "support-assistant") {
    // Detect intent from the prompt and generate a natural AI-style response
    if (/charg|bill|payment|subscription|refund|invoice/i.test(excerpt)) {
      return [
        `I've reviewed the customer's account and here's what I found:`,
        ``,
        `The customer was indeed charged twice — once on the original billing date and again during a system retry after a temporary payment gateway timeout. The duplicate charge of the same amount confirms this wasn't an upgrade or add-on.`,
        ``,
        `**Recommended actions:**`,
        `1. Issue an immediate refund for the duplicate charge (processing time: 3–5 business days)`,
        `2. Send the customer a confirmation email with the refund reference number`,
        `3. Flag the account to prevent auto-retry on next billing cycle`,
        ``,
        `The customer's tone suggests frustration from repeated contact — I'd recommend leading with an apology and the resolution rather than asking for more details.`,
      ].join("\n")
    }
    if (/login|password|lock|access|auth|account/i.test(excerpt)) {
      return [
        `Based on the account activity logs, here's the situation:`,
        ``,
        `The customer's account was locked after 3 consecutive failed login attempts. The password reset email was sent to their registered address, but the new password doesn't meet the updated security requirements (minimum 12 characters, introduced last week).`,
        ``,
        `**Recommended actions:**`,
        `1. Temporarily unlock the account and trigger a new password reset`,
        `2. Inform the customer about the updated password policy`,
        `3. Verify their identity using the backup email or phone on file before unlocking`,
        ``,
        `No suspicious activity detected — this appears to be a legitimate user affected by the policy change.`,
      ].join("\n")
    }
    if (/cancel|churn|retain|leave|contract/i.test(excerpt)) {
      return [
        `I've pulled up the customer's account details and contract terms:`,
        ``,
        `They're on an annual Enterprise plan with 4 months remaining. The contract includes an early termination clause (Section 8.2) that allows cancellation with a 60-day notice period and a prorated fee of 25% of remaining contract value.`,
        ``,
        `**Recommended approach:**`,
        `1. Acknowledge their frustration and ask what prompted the cancellation request`,
        `2. If billing-related, offer to resolve the dispute before processing cancellation`,
        `3. If feature-related, schedule a call with the account manager to discuss their needs`,
        `4. As a last resort, offer a 2-month credit or plan downgrade to retain the account`,
        ``,
        `Retention rate for similar cases is 62% when a proactive solution is offered.`,
      ].join("\n")
    }
    // Generic support response
    return [
      `I've analyzed the customer's request and here's my assessment:`,
      ``,
      `The customer is asking about: "${excerpt.slice(0, 80)}${excerpt.length > 80 ? "…" : ""}"`,
      ``,
      `Based on similar tickets in our knowledge base, this is a common inquiry that typically resolves within one interaction. Here's the recommended approach:`,
      ``,
      `1. Confirm the specific details of their request to ensure accurate resolution`,
      `2. Check their account for any related recent changes or pending actions`,
      `3. Provide the relevant documentation or next steps`,
      ``,
      `If this requires escalation, route to the appropriate specialist team with full context so the customer doesn't need to repeat their issue.`,
    ].join("\n")
  }

  if (appId === "hr-assistant") {
    if (/pto|vacation|time.off|leave|holiday/i.test(excerpt)) {
      return [
        `Here's the PTO policy information based on our current Employee Handbook (v4.2):`,
        ``,
        `**Accrual:**`,
        `- Full-time employees accrue 1.5 days per month (18 days/year)`,
        `- PTO is available after the 90-day introductory period`,
        `- Unused PTO carries over up to 5 days into the next calendar year`,
        ``,
        `**Requesting time off:**`,
        `- Submit requests through Workday at least 5 business days in advance`,
        `- Manager approval is required; requests are auto-approved if no response within 48 hours`,
        `- Blackout periods apply during quarter-end close (last 3 business days)`,
        ``,
        `**Special circumstances:**`,
        `- Bereavement leave (3–5 days) is separate from PTO`,
        `- Jury duty is fully paid and doesn't count against PTO balance`,
        ``,
        `For policy exceptions, contact your HR Business Partner directly.`,
      ].join("\n")
    }
    if (/benefit|health|insurance|dental|vision|401k|retirement/i.test(excerpt)) {
      return [
        `Here's a summary of our benefits package based on the 2025 Benefits Guide:`,
        ``,
        `**Health Insurance:**`,
        `- Three plan options: Basic (HSA-eligible), Standard (PPO), and Premium (PPO+)`,
        `- Company covers 80% of premiums for employee, 60% for dependents`,
        `- Open enrollment is in November; life events allow mid-year changes`,
        ``,
        `**Retirement:**`,
        `- 401(k) with company match: 100% of first 4%, 50% of next 2%`,
        `- Vesting: immediate for employee contributions, 3-year cliff for employer match`,
        `- Auto-enrollment at 6% for new hires (opt-out available)`,
        ``,
        `**Additional benefits:**`,
        `- Dental and vision included in all plans`,
        `- $50/month wellness stipend (gym, meditation apps, etc.)`,
        `- Employee Assistance Program (EAP) — 6 free counseling sessions/year`,
        ``,
        `Enrollment changes can be made through Workday > Benefits portal.`,
      ].join("\n")
    }
    if (/onboard|new.hire|first.day|start/i.test(excerpt)) {
      return [
        `Here's the standard onboarding timeline for new hires:`,
        ``,
        `**Day 1:**`,
        `- IT equipment pickup and system access setup`,
        `- Complete I-9 verification and tax forms in Workday`,
        `- Meet your onboarding buddy and team lead`,
        ``,
        `**Week 1:**`,
        `- Complete mandatory compliance training (Security Awareness, Code of Conduct)`,
        `- Benefits enrollment orientation session (Tuesday/Thursday at 2pm)`,
        `- Set up direct deposit and verify personal information`,
        ``,
        `**First 30 days:**`,
        `- Finalize benefits elections (deadline: 30 days from start date)`,
        `- Complete role-specific training modules assigned by your manager`,
        `- Schedule 1:1 with your HR Business Partner`,
        ``,
        `**90-day checkpoint:**`,
        `- Introductory period review with manager`,
        `- PTO accrual becomes available for use`,
        `- Eligible for internal transfer applications`,
        ``,
        `All onboarding tasks are tracked in Workday — your manager and HRBP can see progress.`,
      ].join("\n")
    }
    // Generic HR response
    return [
      `Based on our internal policies and the Employee Handbook, here's what I found regarding your question:`,
      ``,
      `"${excerpt.slice(0, 80)}${excerpt.length > 80 ? "…" : ""}"`,
      ``,
      `This falls under standard HR policy guidelines. Here are the key points:`,
      ``,
      `- Company policies are documented in the Employee Handbook (accessible via the HR portal)`,
      `- For role-specific questions, your HR Business Partner can provide tailored guidance`,
      `- If this involves a time-sensitive matter (leave, accommodation, etc.), please submit a request through Workday so it can be tracked and prioritized`,
      ``,
      `Would you like me to look up a specific policy section, or would you prefer to be connected with your HRBP?`,
    ].join("\n")
  }

  // Fallback for any other mock app (shouldn't normally be hit)
  return [
    `I've processed your request and here's my response:`,
    ``,
    `Regarding: "${excerpt.slice(0, 100)}${excerpt.length > 100 ? "…" : ""}"`,
    ``,
    `Based on the available information, I've analyzed your input and prepared a structured response. This demonstrates the governance layer routing your request through the appropriate model and policy framework.`,
    ``,
    `The response was generated locally as part of the mock demonstration environment.`,
  ].join("\n")
}

