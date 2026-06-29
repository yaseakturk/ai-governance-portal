import { generateText } from "ai"
import { z } from "zod"
import {
  APPLICATIONS,
  getGovernanceDecision,
  getMockResponse,
  MODEL_REGISTRY,
  TASK_TYPES,
} from "@/lib/governance"
import { TEST_CASES, runDeterministicCheck } from "@/lib/evaluation"

export const maxDuration = 30

const GATEWAY_NOTICE =
  "AI Gateway integration is configured but not active in this demo environment. Routing, governance, fallback selection, and policy enforcement are still demonstrated."

// ─── Request Validation Schema ──────────────────────────────────────────────
const RequestSchema = z.object({
  appId: z.string().min(1, "appId is required"),
  taskId: z.string().min(1, "taskId is required"),
  prompt: z.string().min(1, "A prompt is required").max(10000, "Prompt exceeds maximum length"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues.map((e: { message: string }) => e.message).join("; ")
      return Response.json({ error: message }, { status: 400 })
    }

    const { appId, taskId, prompt } = parsed.data

    const app = APPLICATIONS.find((a) => a.id === appId)
    const task = TASK_TYPES.find((t) => t.id === taskId)
    if (!app || !task) {
      return Response.json(
        { error: "Unknown application or task type." },
        { status: 400 },
      )
    }

    const decision = getGovernanceDecision(appId, taskId)
    const selected = MODEL_REGISTRY[decision.selectedModelId]
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

    // Mock Demo applications never call a model — output is generated locally.
    if (decision.executionMode === "mock") {
      const responseText = getMockResponse(appId, taskId, prompt)
      const evaluation = await runEvaluation(appId, prompt, responseText)

      return Response.json({
        text: responseText,
        executionMode: "mock",
        usedModelId: decision.selectedModelId,
        usedModelName: selected.name,
        usedFallback: false,
        costTier: decision.costTier,
        selectedModelName: selected.name,
        evaluation,
      })
    }

    const system = [
      `# Role`,
      `You are "${app.name}", an internal enterprise AI assistant serving the ${app.team} team.`,
      ``,
      `# Task Context`,
      `The user's request is classified as "${task.name}" (${task.description}).`,
      `Tailor your response structure and depth to this task type.`,
      ``,
      `# Constraints`,
      `- Data sensitivity: ${app.sensitivity}. Never include, request, or infer PII, secrets, credentials, or internal system identifiers unless explicitly provided by the user.`,
      `- Stay within the domain of ${app.name}. If the request is outside your scope, state that clearly and suggest the appropriate team or resource.`,
      `- Do not hallucinate facts. If uncertain, say so rather than guessing.`,
      `- Do not provide legal, medical, or financial advice as definitive guidance — frame recommendations clearly as suggestions.`,
      ``,
      `# Output Format`,
      `- Use clear headings or numbered lists for multi-step responses.`,
      `- Keep responses concise but complete — prefer structured output over prose.`,
      `- Use markdown formatting (bold, bullets, numbered lists) for readability.`,
      `- For summarization tasks: lead with the key finding, then provide supporting detail.`,
      `- For extraction tasks: present data in a structured format (table or key-value).`,
      `- For reasoning tasks: show your reasoning steps before the conclusion.`,
      ``,
      `# Tone`,
      `Professional, clear, and direct. Appropriate for an internal enterprise platform used by colleagues.`,
    ].join("\n")

    let usedModelId = decision.selectedModelId
    let text = ""

    // Use AI Gateway's provider options for routing and restriction.
    // - `order`: defines failover priority (primary provider first, fallback second)
    // - `only`: restricts to governance-approved providers only
    const primaryProvider = MODEL_REGISTRY[decision.selectedModelId].provider.toLowerCase()
    const fallbackProvider = MODEL_REGISTRY[decision.fallbackModelId].provider.toLowerCase()

    try {
      const result = await generateText({
        model: decision.selectedModelId,
        system,
        prompt,
        providerOptions: {
          gateway: {
            order: [primaryProvider, fallbackProvider],
            only: app.allowedProviders.map((p) => p.toLowerCase()),
            // Enforce data privacy based on sensitivity level.
            // Restricted/confidential apps disable prompt training;
            // restricted apps additionally enforce zero data retention.
            ...(app.sensitivity !== "internal" && {
              disallowPromptTraining: true,
            }),
            ...(app.sensitivity === "restricted" && {
              zeroDataRetention: true,
            }),
            // ─── Usage Tracking (AI Gateway Native Reporting) ──────────────
            // When active, the gateway tracks usage by user and custom tags
            // in the Vercel dashboard — no external observability tool needed.
            //
            // user: session.user.id,
            // tags: {
            //   application: appId,
            //   team: app.team,
            //   costTier: decision.costTier,
            //   sensitivity: app.sensitivity,
            //   taskType: task.name,
            // },
          },
        },
        // ─── OpenTelemetry (for non-Vercel observability: Datadog, Grafana, Sentry) ──
        // Emits OTel spans with custom metadata to your own monitoring stack.
        // If using only Vercel's built-in dashboard, the gateway tags above suffice.
        experimental_telemetry: {
          isEnabled: true,
          functionId: `governance.${appId}`,
          metadata: {
            requestId,
            appId,
            appName: app.name,
            taskId,
            taskName: task.name,
            costTier: decision.costTier,
            executionMode: "gateway",
            modelRole: "primary",
            sensitivity: app.sensitivity,
            region: app.region,
          },
        },
      })
      text = result.text
    } catch {
      // Gateway and primary provider unavailable (e.g. no billing in this demo).
      // Return a professional notice so the governance flow can still be demonstrated.
      return Response.json({
        executionMode: "gateway",
        gatewayInactive: true,
        notice: GATEWAY_NOTICE,
        usedModelId: decision.selectedModelId,
        usedModelName: selected.name,
        usedFallback: false,
        costTier: decision.costTier,
        selectedModelName: selected.name,
      })
    }

    const evaluation = await runEvaluation(appId, prompt, text)

    return Response.json({
      text,
      executionMode: "gateway",
      usedModelId,
      usedModelName: MODEL_REGISTRY[usedModelId].name,
      usedFallback: false,
      costTier: decision.costTier,
      selectedModelName: selected.name,
      evaluation,
    })
  } catch {
    return Response.json(
      { error: "The model gateway could not complete this request." },
      { status: 500 },
    )
  }
}

// ─── Post-Response Evaluation ───────────────────────────────────────────────
// Runs quality checks on every response:
// 1. Deterministic checks (always) — keyword matching, length, structure
// 2. LLM-as-judge (when ENABLE_LLM_JUDGE=true) — AI SDK evaluates via gateway

async function runEvaluation(appId: string, prompt: string, response: string) {
  // Find a matching test case for structured evaluation, or create an ad-hoc one
  const matchingTest = TEST_CASES.find(
    (tc) => tc.appId === appId && prompt.toLowerCase().includes(tc.prompt.slice(0, 30).toLowerCase()),
  )

  // Layer 1: Deterministic checks (always runs, no credentials needed)
  const deterministic = matchingTest
    ? runDeterministicCheck(matchingTest, response)
    : {
        testId: "ad-hoc",
        passed: response.trim().length >= 50,
        checks: {
          hasContent: response.trim().length > 0,
          meetsMinLength: response.length >= 50,
          containsRequired: true,
          avoidsProhibited: true,
          noEmptyResponse: true,
        },
        failures: response.trim().length >= 50 ? [] : ["Response too short or empty"],
      }

  // Layer 2: LLM-as-judge (requires ENABLE_LLM_JUDGE=true and AI Gateway credentials)
  // Uses the AI SDK's generateObject() to score responses via the gateway.
  let llmJudge = null
  if (process.env.ENABLE_LLM_JUDGE === "true") {
    try {
      const { evaluateResponse } = await import("@/lib/evaluation")
      llmJudge = await evaluateResponse({
        prompt,
        response,
        expectedBehavior: matchingTest?.expectedBehavior ?? "Response should be relevant, accurate, and safe for enterprise use.",
        judgeModel: "openai/gpt-4o-mini",
      })
    } catch {
      // LLM judge unavailable — continue with deterministic results only
      llmJudge = null
    }
  }

  return {
    type: llmJudge ? "full" as const : "deterministic" as const,
    passed: deterministic.passed && (llmJudge ? !llmJudge.hallucination_detected && llmJudge.relevance >= 3 : true),
    deterministic: deterministic.checks,
    failures: deterministic.failures,
    llmJudge,
  }
}
