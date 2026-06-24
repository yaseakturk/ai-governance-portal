"use client"

import { useMemo, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  APPLICATIONS,
  TASK_TYPES,
  getGovernanceDecision,
  MODEL_REGISTRY,
} from "@/lib/governance"
import { PortalHeader } from "@/components/portal-header"
import { ApplicationSelector } from "@/components/application-selector"
import { TaskTypeSelector } from "@/components/task-type-selector"
import { PromptInput } from "@/components/prompt-input"
import { ModelCard } from "@/components/model-card"
import { CostTierIndicator } from "@/components/cost-tier-indicator"
import { GovernancePanel } from "@/components/governance-panel"
import { ResponsePanel, type ResponseState } from "@/components/response-panel"

export function GovernancePortal() {
  const [appId, setAppId] = useState(APPLICATIONS[0].id)
  const [taskId, setTaskId] = useState(TASK_TYPES[0].id)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<ResponseState>(null)

  const decision = useMemo(
    () => getGovernanceDecision(appId, taskId),
    [appId, taskId],
  )

  const selectedModel = MODEL_REGISTRY[decision.selectedModelId]
  const fallbackModel = MODEL_REGISTRY[decision.fallbackModelId]

  async function handleSubmit() {
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
      } else {
        setResponse({
          text: data.text,
          usedModelName: data.usedModelName,
          usedFallback: data.usedFallback,
        })
      }
    } catch {
      setError("Network error reaching the governed gateway.")
    } finally {
      setLoading(false)
    }
  }

  // Reset stale routing config when inputs change.
  function changeApp(id: string) {
    setAppId(id)
    setResponse(null)
  }
  function changeTask(id: string) {
    setTaskId(id)
    setResponse(null)
  }

  const servedSelected = response && !response.usedFallback
  const servedFallback = response?.usedFallback ?? false

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h2 className="text-balance text-xl font-semibold text-foreground">
            Model routing console
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure a governed request. Routing, cost tier, and fallback are
            enforced automatically by platform policy.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left column — request configuration + response */}
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Request configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <ApplicationSelector value={appId} onChange={changeApp} />
                  <TaskTypeSelector value={taskId} onChange={changeTask} />
                </div>
                <Separator />
                <PromptInput
                  value={prompt}
                  onChange={setPrompt}
                  onSubmit={handleSubmit}
                  loading={loading}
                />
              </CardContent>
            </Card>

            <ResponsePanel
              loading={loading}
              error={error}
              response={response}
            />
          </div>

          {/* Right column — routing decision sidebar */}
          <aside className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Routed models
              </p>
              <ModelCard
                model={selectedModel}
                variant="selected"
                active={!!servedSelected}
              />
              <ModelCard
                model={fallbackModel}
                variant="fallback"
                active={servedFallback}
              />
            </div>

            <CostTierIndicator tier={decision.costTier} />

            <GovernancePanel decision={decision} />
          </aside>
        </div>
      </main>
    </div>
  )
}
