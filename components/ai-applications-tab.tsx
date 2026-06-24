"use client"

import { useCallback, useState } from "react"
import { Play, Loader2, AlertTriangle, ShieldCheck, FlaskConical, Cloud, CheckCircle2, Terminal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  APPLICATIONS,
  TASK_TYPES,
  getGovernanceDecision,
  MODEL_REGISTRY,
} from "@/lib/governance"
import {
  addRequest,
  estimateTokens,
  estimateCost,
  type RequestRecord,
} from "@/lib/request-store"

// Map each application to its most natural task type for demo simplicity.
// Business users don't pick task types — the platform classifies automatically.
const APP_DEFAULT_TASK: Record<string, string> = {
  "support-assistant": "summarization",
  "hr-assistant": "extraction",
  "legal-assistant": "reasoning",
  "finance-analytics": "extraction",
  "code-assistant": "code-generation",
} as const

export function AIApplicationsTab() {
  const [appId, setAppId] = useState(APPLICATIONS[0].id)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<{
    text?: string
    executionMode: string
    gatewayInactive?: boolean
    notice?: string
  } | null>(null)

  const currentApp = APPLICATIONS.find((a) => a.id === appId) ?? APPLICATIONS[0]
  // Auto-classify task based on application context
  const taskId = APP_DEFAULT_TASK[appId] ?? TASK_TYPES[0].id

  async function handleSubmit() {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch("/api/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, taskId, prompt }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Request failed.")
        return
      }

      setResponse({
        text: data.text,
        executionMode: data.executionMode,
        gatewayInactive: data.gatewayInactive,
        notice: data.notice,
      })

      // Record for the Platform Operations tab
      const decision = getGovernanceDecision(appId, taskId)
      const selectedModel = MODEL_REGISTRY[decision.selectedModelId]
      const fallbackModel = MODEL_REGISTRY[decision.fallbackModelId]
      const inputTokens = estimateTokens(prompt)
      const outputTokens = data.text ? estimateTokens(data.text) : 150

      const record: RequestRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        appId,
        appName: currentApp.name,
        taskId,
        taskName: TASK_TYPES.find((t) => t.id === taskId)?.name ?? taskId,
        prompt,
        executionMode: data.executionMode,
        selectedModelId: decision.selectedModelId,
        selectedModelName: selectedModel.name,
        fallbackModelId: decision.fallbackModelId,
        fallbackModelName: fallbackModel.name,
        costTier: decision.costTier,
        usedFallback: data.usedFallback ?? false,
        gatewayInactive: data.gatewayInactive ?? false,
        provider: selectedModel.provider,
        estimatedInputTokens: inputTokens,
        estimatedOutputTokens: outputTokens,
        estimatedCost: estimateCost(
          inputTokens,
          outputTokens,
          selectedModel.inputPrice,
          selectedModel.outputPrice,
        ),
        decision,
      }
      addRequest(record)
    } catch {
      setError("Network error reaching the AI service.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Enterprise AI Applications
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select an internal AI application and submit your request.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left — Input */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <h3 className="text-sm font-medium text-foreground">Submit a Request</h3>

          {/* Application Selector */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Application
            </p>
            <div className="grid gap-2">
              {APPLICATIONS.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  aria-pressed={appId === app.id}
                  onClick={() => {
                    setAppId(app.id)
                    setResponse(null)
                  }}
                  className={`relative flex items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm cursor-pointer transition-colors ${
                    appId === app.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  <span className="font-medium">{app.name}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase tracking-wider pointer-events-none"
                  >
                    {app.executionMode === "mock" ? "Mock Demo" : "AI Gateway"}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-border" />

          {/* Prompt Input */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your Request
            </p>
            <textarea
              id="prompt-input"
              aria-label={`Enter your request for ${currentApp.name}`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit()
                }
              }}
              placeholder={`Ask ${currentApp.name} a question…`}
              rows={4}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              {prompt.length} characters · ⌘+Enter to submit
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Request
          </button>
        </div>

        {/* Right — Response */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">AI Response</h3>
            {response && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 text-xs">
                  {response.executionMode === "mock" ? (
                    <FlaskConical className="h-3 w-3" />
                  ) : (
                    <Cloud className="h-3 w-3" />
                  )}
                  {response.executionMode === "mock" ? "Mock Demo" : "AI Gateway"}
                </Badge>
                {!response.gatewayInactive && response.text && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Success
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex-1">
            {loading && (
              <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm">Processing your request…</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && response?.gatewayInactive && (
              <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    AI Gateway configured but inactive
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {response.notice}
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && !response && (
              <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Terminal className="h-5 w-5" />
                </div>
                <p className="max-w-xs text-sm leading-relaxed">
                  Select an application, enter your request, and click Run
                  Request.
                </p>
              </div>
            )}

            {!loading && !error && response && !response.gatewayInactive && (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {response.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
