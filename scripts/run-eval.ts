// Enterprise AI Evaluation Runner
// Usage:
//   npx tsx scripts/run-eval.ts              → runs deterministic checks only (no credentials needed)
//   npx tsx scripts/run-eval.ts --llm-judge  → runs full evaluation with LLM-as-judge via AI Gateway

import {
  TEST_CASES,
  runFullEvaluation,
  runDeterministicCheck,
  type FullEvaluationResult,
} from "../lib/evaluation"

const USE_LLM_JUDGE = process.argv.includes("--llm-judge")
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000"

async function getResponse(appId: string, prompt: string): Promise<{ text: string; gatewayInactive: boolean }> {
  // Determine appropriate task type for the app
  const taskMap: Record<string, string> = {
    "support-assistant": "summarization",
    "hr-assistant": "extraction",
    "legal-assistant": "reasoning",
    "finance-analytics": "extraction",
    "code-assistant": "code-generation",
  }

  const res = await fetch(`${BASE_URL}/api/governance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appId,
      taskId: taskMap[appId] ?? "summarization",
      prompt,
    }),
  })

  const data = await res.json()

  if (data.error) return { text: "", gatewayInactive: false }
  if (data.gatewayInactive) return { text: "", gatewayInactive: true }
  return { text: data.text ?? "", gatewayInactive: false }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════")
  console.log("  Enterprise AI Evaluation Framework")
  console.log("  Mode:", USE_LLM_JUDGE ? "Full (Deterministic + LLM-as-Judge)" : "Deterministic Only")
  console.log("  Target:", BASE_URL)
  console.log("═══════════════════════════════════════════════════════════\n")

  const results: FullEvaluationResult[] = []
  let passed = 0
  let failed = 0
  let skipped = 0

  for (const testCase of TEST_CASES) {
    process.stdout.write(`  [${testCase.id}] ${testCase.appName}... `)

    try {
      const { text: response, gatewayInactive } = await getResponse(testCase.appId, testCase.prompt)

      if (gatewayInactive) {
        console.log("⏭️  Skipped (gateway inactive — needs credentials)")
        skipped++
        continue
      }

      if (!response) {
        console.log("⚠️  No response (error)")
        failed++
        continue
      }

      const result = await runFullEvaluation(testCase, response, {
        useLLMJudge: USE_LLM_JUDGE,
      })
      results.push(result)

      if (result.overallPass) {
        console.log("✅ PASS")
        passed++
      } else {
        console.log("❌ FAIL")
        result.deterministic.failures.forEach((f) => {
          console.log(`       → ${f}`)
        })
        if (result.llmJudge?.hallucination_detected) {
          console.log("       → Hallucination detected by LLM judge")
        }
        failed++
      }
    } catch (error) {
      console.log("⚠️  Error:", (error as Error).message)
      failed++
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════")
  console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped, ${TEST_CASES.length} total`)
  console.log("═══════════════════════════════════════════════════════════")

  if (USE_LLM_JUDGE) {
    const judgedResults = results.filter((r) => r.llmJudge)
    if (judgedResults.length > 0) {
      const avgRelevance = judgedResults.reduce((s, r) => s + (r.llmJudge?.relevance ?? 0), 0) / judgedResults.length
      const avgAccuracy = judgedResults.reduce((s, r) => s + (r.llmJudge?.accuracy ?? 0), 0) / judgedResults.length
      const avgSafety = judgedResults.reduce((s, r) => s + (r.llmJudge?.safety ?? 0), 0) / judgedResults.length
      const hallucinations = judgedResults.filter((r) => r.llmJudge?.hallucination_detected).length

      console.log("\n  LLM Judge Summary:")
      console.log(`    Avg Relevance:  ${avgRelevance.toFixed(1)} / 5`)
      console.log(`    Avg Accuracy:   ${avgAccuracy.toFixed(1)} / 5`)
      console.log(`    Avg Safety:     ${avgSafety.toFixed(1)} / 5`)
      console.log(`    Hallucinations: ${hallucinations} / ${judgedResults.length}`)
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

main()
