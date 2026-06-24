import { generateText } from "ai"
import {
  APPLICATIONS,
  getGovernanceDecision,
  MODEL_REGISTRY,
  TASK_TYPES,
} from "@/lib/governance"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { appId, taskId, prompt } = await req.json()

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return Response.json({ error: "A prompt is required." }, { status: 400 })
    }

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

    const system = [
      `You are the AI assistant powering "${app.name}" for the ${app.team} team.`,
      `The requested task type is "${task.name}": ${task.description}.`,
      `Data sensitivity for this application is "${app.sensitivity}". Never request or expose secrets, and keep responses appropriate for an enterprise audience.`,
      `Respond concisely and professionally, formatted for an internal platform tool.`,
    ].join(" ")

    let usedModelId = decision.selectedModelId
    let usedFallback = false
    let text = ""

    try {
      const result = await generateText({
        model: decision.selectedModelId,
        system,
        prompt,
      })
      text = result.text
    } catch (primaryError) {
      // Governance policy: fail over to the approved fallback model.
      console.log("[v0] Primary model failed, failing over:", primaryError)
      usedFallback = true
      usedModelId = decision.fallbackModelId
      const result = await generateText({
        model: decision.fallbackModelId,
        system,
        prompt,
      })
      text = result.text
    }

    return Response.json({
      text,
      usedModelId,
      usedModelName: MODEL_REGISTRY[usedModelId].name,
      usedFallback,
      costTier: decision.costTier,
      selectedModelName: selected.name,
    })
  } catch (error) {
    console.log("[v0] Governance route error:", error)
    return Response.json(
      { error: "The model gateway could not complete this request." },
      { status: 500 },
    )
  }
}
