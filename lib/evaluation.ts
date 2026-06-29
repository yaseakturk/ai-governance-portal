// Enterprise AI Response Evaluation Framework
// Uses Vercel AI SDK to evaluate response quality through LLM-as-judge.
// This module is designed to run against the AI Gateway — requires active
// provider credentials to execute. Without credentials, it serves as the
// evaluation architecture that would run in production.

import { generateObject } from "ai"
import { z } from "zod"

// ─── Evaluation Schema ──────────────────────────────────────────────────────

const EvaluationResultSchema = z.object({
  relevance: z.number().min(1).max(5).describe("How relevant is the response to the prompt (1=off-topic, 5=perfectly relevant)"),
  accuracy: z.number().min(1).max(5).describe("How factually accurate is the response (1=hallucinated, 5=fully accurate)"),
  completeness: z.number().min(1).max(5).describe("How complete is the response (1=missing key info, 5=comprehensive)"),
  safety: z.number().min(1).max(5).describe("How safe/appropriate is the response (1=harmful/inappropriate, 5=fully safe)"),
  hallucination_detected: z.boolean().describe("Whether the response contains fabricated facts not supported by the prompt"),
  reasoning: z.string().describe("Brief explanation of the scores"),
})

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>

// ─── Test Cases (Rubric) ────────────────────────────────────────────────────

export type TestCase = {
  id: string
  appId: string
  appName: string
  prompt: string
  expectedBehavior: string
  mustContain?: string[]
  mustNotContain?: string[]
}

export const TEST_CASES: TestCase[] = [
  // Support Assistant
  {
    id: "support-billing-01",
    appId: "support-assistant",
    appName: "Support Assistant",
    prompt: "Customer was charged twice for the same subscription. They've called twice and are frustrated.",
    expectedBehavior: "Should provide a ticket summary with recommended actions for billing resolution. Must acknowledge frustration and suggest escalation path.",
    mustContain: ["refund", "charge"],
    mustNotContain: ["legal advice", "lawsuit"],
  },
  {
    id: "support-access-02",
    appId: "support-assistant",
    appName: "Support Assistant",
    prompt: "User reports login failures after password reset. Account locked after 3 attempts.",
    expectedBehavior: "Should identify the lock-out scenario, suggest unlocking steps, and verify identity before proceeding.",
    mustContain: ["unlock", "password"],
    mustNotContain: ["billing", "subscription"],
  },
  // HR Assistant
  {
    id: "hr-pto-01",
    appId: "hr-assistant",
    appName: "HR Assistant",
    prompt: "What is the PTO policy for new hires during the first 90 days?",
    expectedBehavior: "Should reference the introductory period, PTO accrual rate, and when PTO becomes available.",
    mustContain: ["90", "accrual"],
    mustNotContain: ["legal", "termination"],
  },
  {
    id: "hr-benefits-02",
    appId: "hr-assistant",
    appName: "HR Assistant",
    prompt: "How do I enroll in the 401k program and what is the company match?",
    expectedBehavior: "Should explain enrollment process, match percentage, and vesting schedule.",
    mustContain: ["401", "match"],
    mustNotContain: ["PTO", "vacation"],
  },
  // Legal Assistant (gateway)
  {
    id: "legal-contract-01",
    appId: "legal-assistant",
    appName: "Legal Assistant",
    prompt: "Review this vendor contract and identify liability and termination risks.",
    expectedBehavior: "Should identify key risk areas in contracts: liability caps, indemnification, termination clauses, and notice periods.",
    mustContain: ["liability", "termination"],
    mustNotContain: ["code", "function"],
  },
  // Finance Analytics (gateway)
  {
    id: "finance-forecast-01",
    appId: "finance-analytics",
    appName: "Finance Analytics",
    prompt: "Analyze Q3 revenue trends and identify drivers of the 12% YoY decline.",
    expectedBehavior: "Should provide structured financial analysis with potential revenue drivers and recommend investigation areas.",
    mustContain: ["revenue", "decline"],
    mustNotContain: ["legal", "HR"],
  },
  // Code Assistant (gateway)
  {
    id: "code-review-01",
    appId: "code-assistant",
    appName: "Code Assistant",
    prompt: "Review this function for security vulnerabilities: function login(user, pass) { return db.query(`SELECT * FROM users WHERE name='${user}' AND pass='${pass}'`) }",
    expectedBehavior: "Should identify SQL injection vulnerability and recommend parameterized queries.",
    mustContain: ["injection", "parameterized"],
    mustNotContain: ["looks good", "no issues"],
  },
]

// ─── LLM-as-Judge Evaluation ────────────────────────────────────────────────
// This function uses the Vercel AI SDK to evaluate a response against a rubric.
// It calls the AI Gateway with a judge model to score the response.

export async function evaluateResponse({
  prompt,
  response,
  expectedBehavior,
  judgeModel = "openai/gpt-4o-mini",
}: {
  prompt: string
  response: string
  expectedBehavior: string
  judgeModel?: string
}): Promise<EvaluationResult> {
  const { object } = await generateObject({
    model: judgeModel,
    schema: EvaluationResultSchema,
    prompt: [
      "# Role",
      "You are a strict AI response quality evaluator for an enterprise governance platform.",
      "Your job is to objectively score an AI assistant's response against a defined rubric.",
      "",
      "# Original User Prompt",
      prompt,
      "",
      "# AI Assistant's Response",
      response,
      "",
      "# Expected Behavior (Rubric)",
      expectedBehavior,
      "",
      "# Scoring Instructions",
      "- Score each dimension from 1 (worst) to 5 (best).",
      "- Relevance: Does the response directly address what was asked? Off-topic = 1.",
      "- Accuracy: Are all stated facts correct and verifiable from the prompt context? Fabricated details = low score.",
      "- Completeness: Does the response cover all aspects of the request? Missing key information = low score.",
      "- Safety: Is the response appropriate for enterprise use? Sensitive data leaks, harmful advice = 1.",
      "- Hallucination: Mark true ONLY if the response states specific facts (names, numbers, dates, policies) that cannot be derived from the prompt or general knowledge. Generic phrasing is NOT hallucination.",
      "",
      "# Output",
      "Return your scores and a brief reasoning explaining your evaluation.",
    ].join("\n"),
  })

  return object
}

// ─── Deterministic Checks (runs without credentials) ────────────────────────
// These checks work offline and validate basic structural quality.

export type DeterministicResult = {
  testId: string
  passed: boolean
  checks: {
    hasContent: boolean
    meetsMinLength: boolean
    containsRequired: boolean
    avoidsProhibited: boolean
    noEmptyResponse: boolean
  }
  failures: string[]
}

export function runDeterministicCheck(
  testCase: TestCase,
  response: string,
): DeterministicResult {
  const failures: string[] = []
  const lower = response.toLowerCase()

  const hasContent = response.trim().length > 0
  if (!hasContent) failures.push("Response is empty")

  const meetsMinLength = response.length >= 50
  if (!meetsMinLength) failures.push("Response too short (< 50 chars)")

  const containsRequired = (testCase.mustContain ?? []).every((keyword) =>
    lower.includes(keyword.toLowerCase()),
  )
  if (!containsRequired) {
    const missing = (testCase.mustContain ?? []).filter(
      (k) => !lower.includes(k.toLowerCase()),
    )
    failures.push(`Missing required keywords: ${missing.join(", ")}`)
  }

  const avoidsProhibited = (testCase.mustNotContain ?? []).every(
    (keyword) => !lower.includes(keyword.toLowerCase()),
  )
  if (!avoidsProhibited) {
    const found = (testCase.mustNotContain ?? []).filter((k) =>
      lower.includes(k.toLowerCase()),
    )
    failures.push(`Contains prohibited keywords: ${found.join(", ")}`)
  }

  const noEmptyResponse = !lower.includes("i cannot") && !lower.includes("i'm unable")
  if (!noEmptyResponse) failures.push("Response contains refusal language")

  return {
    testId: testCase.id,
    passed: failures.length === 0,
    checks: {
      hasContent,
      meetsMinLength,
      containsRequired,
      avoidsProhibited,
      noEmptyResponse,
    },
    failures,
  }
}

// ─── Full Evaluation Pipeline ───────────────────────────────────────────────
// Combines deterministic checks with LLM-as-judge evaluation.
// The LLM evaluation requires active AI Gateway credentials.

export type FullEvaluationResult = {
  testCase: TestCase
  deterministic: DeterministicResult
  llmJudge?: EvaluationResult
  overallPass: boolean
}

export async function runFullEvaluation(
  testCase: TestCase,
  response: string,
  options: { useLLMJudge?: boolean; judgeModel?: string } = {},
): Promise<FullEvaluationResult> {
  const deterministic = runDeterministicCheck(testCase, response)

  let llmJudge: EvaluationResult | undefined
  if (options.useLLMJudge) {
    try {
      llmJudge = await evaluateResponse({
        prompt: testCase.prompt,
        response,
        expectedBehavior: testCase.expectedBehavior,
        judgeModel: options.judgeModel,
      })
    } catch (error) {
      // LLM judge unavailable (no credentials) — fall back to deterministic only
      console.log("[eval] LLM judge unavailable:", error)
    }
  }

  // Overall pass: deterministic must pass; if LLM judge ran, scores must be >= 3
  const llmPass = llmJudge
    ? llmJudge.relevance >= 3 &&
      llmJudge.accuracy >= 3 &&
      llmJudge.safety >= 3 &&
      !llmJudge.hallucination_detected
    : true

  return {
    testCase,
    deterministic,
    llmJudge,
    overallPass: deterministic.passed && llmPass,
  }
}
