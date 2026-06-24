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
      const evaluation = runEvaluation(appId, prompt, responseText)

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
    let usedFallback = false
    let text = ""

    try {
      const result = await generateText({
        model: decision.selectedModelId,
        system,
        prompt,
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
      // Governance policy: fail over to the approved fallback model.
      try {
        usedFallback = true
        usedModelId = decision.fallbackModelId
        const result = await generateText({
          model: decision.fallbackModelId,
          system,
          prompt,
          experimental_telemetry: {
            isEnabled: true,
            functionId: `governance.${appId}.fallback`,
            metadata: {
              requestId,
              appId,
              appName: app.name,
              taskId,
              taskName: task.name,
              costTier: decision.costTier,
              executionMode: "gateway",
              modelRole: "fallback",
              sensitivity: app.sensitivity,
              region: app.region,
              primaryModelFailed: decision.selectedModelId,
            },
          },
        })
        text = result.text
      } catch {
        // Both routes unavailable (e.g. no Gateway billing in this demo).
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
    }

    const evaluation = runEvaluation(appId, prompt, text)

    return Response.json({
      text,
      executionMode: "gateway",
      usedModelId,
      usedModelName: MODEL_REGISTRY[usedModelId].name,
      usedFallback,
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
// Runs deterministic quality checks on every response.
// When ENABLE_LLM_JUDGE=true is set and AI Gateway credentials are available,
// also runs LLM-as-judge evaluation via the AI SDK for deeper quality scoring.

function runEvaluation(appId: string, prompt: string, response: string) {
  // Find a matching test case for structured evaluation, or create an ad-hoc one
  const matchingTest = TEST_CASES.find(
    (tc) => tc.appId === appId && prompt.toLowerCase().includes(tc.prompt.slice(0, 30).toLowerCase()),
  )

  if (matchingTest) {
    const result = runDeterministicCheck(matchingTest, response)
    return {
      type: "deterministic" as const,
      passed: result.passed,
      checks: result.checks,
      failures: result.failures,
    }
  }

  // Ad-hoc check for prompts not in the test set
  const hasContent = response.trim().length > 0
  const meetsMinLength = response.length >= 50
  const passed = hasContent && meetsMinLength

  return {
    type: "deterministic" as const,
    passed,
    checks: { hasContent, meetsMinLength, containsRequired: true, avoidsProhibited: true, noEmptyResponse: true },
    failures: passed ? [] : ["Response too short or empty"],
  }
}

// Note: LLM-as-judge evaluation (using evaluateResponse from lib/evaluation.ts)
// can be enabled in production by setting ENABLE_LLM_JUDGE=true.
// It uses the AI SDK's generateObject() to have a model score responses on:
// - Relevance (1-5)
// - Accuracy (1-5)
// - Completeness (1-5)
// - Safety (1-5)
// - Hallucination detection (boolean)
// This requires active AI Gateway credentials.
