"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  DollarSign,
  Hash,
  Shield,
  Layers,
  ArrowRight,
  Server,
  GitBranch,
  BarChart3,
  PieChart,
  FileText,
  Cpu,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  useRequests,
  type RequestRecord,
} from "@/lib/request-store"
import { APPLICATIONS, MODEL_REGISTRY, getGovernanceDecision } from "@/lib/governance"

export function PlatformOperationsTab() {
  const requests = useRequests()
  const [selectedAppName, setSelectedAppName] = useState<string | null>(null)

  // Filtered requests based on selected app
  const filteredRequests = useMemo(() => {
    if (!selectedAppName) return requests
    return requests.filter((r) => r.appName === selectedAppName)
  }, [requests, selectedAppName])

  // Find the selected app's config for governance details
  const selectedAppConfig = useMemo(() => {
    if (!selectedAppName) return null
    return APPLICATIONS.find((a) => a.name === selectedAppName) ?? null
  }, [selectedAppName])

  // Latest request (filtered or global)
  const latest = filteredRequests.length > 0
    ? filteredRequests[filteredRequests.length - 1]
    : null

  // ─── Aggregated metrics (respond to filter) ─────────────────────────────
  const totalRequests = filteredRequests.length
  const estimatedSpend = filteredRequests.reduce((sum, r) => sum + r.estimatedCost, 0)
  const estimatedTokens = filteredRequests.reduce(
    (sum, r) => sum + r.estimatedInputTokens + r.estimatedOutputTokens,
    0,
  )
  const governedApps = selectedAppName
    ? (filteredRequests.length > 0 ? 1 : 0)
    : new Set(requests.map((r) => r.appId)).size
  const fallbackEvents = filteredRequests.filter((r) => r.usedFallback).length
  const policyChecks = filteredRequests.reduce(
    (sum, r) => sum + r.decision.policies.length,
    0,
  )

  // ─── Application usage (always global) ────────────────────────────────
  const appUsage: Record<string, number> = {}
  APPLICATIONS.forEach((a) => (appUsage[a.name] = 0))
  requests.forEach((r) => {
    appUsage[r.appName] = (appUsage[r.appName] ?? 0) + 1
  })

  // ─── Filtered metrics (respond to app selection) ──────────────────────
  const filteredTotal = filteredRequests.length
  const mockCount = filteredRequests.filter((r) => r.executionMode === "mock").length
  const gatewayCount = filteredRequests.filter((r) => r.executionMode === "gateway").length

  const providerCounts: Record<string, number> = {}
  filteredRequests.forEach((r) => {
    providerCounts[r.provider] = (providerCounts[r.provider] ?? 0) + 1
  })

  const taskCounts: Record<string, number> = {}
  filteredRequests.forEach((r) => {
    taskCounts[r.taskName] = (taskCounts[r.taskName] ?? 0) + 1
  })

  // Policy enforcement summary (filtered)
  const policySummary = {
    piiRedaction: 0,
    costGuardrails: 0,
    modelAllowlist: 0,
    dataResidency: 0,
    automaticFailover: 0,
    auditLogging: 0,
  }
  filteredRequests.forEach((r) => {
    r.decision.policies.forEach((p) => {
      if (p.label.toLowerCase().includes("pii")) policySummary.piiRedaction++
      if (p.label.toLowerCase().includes("cost")) policySummary.costGuardrails++
      if (p.label.toLowerCase().includes("allowlist")) policySummary.modelAllowlist++
      if (p.label.toLowerCase().includes("residency")) policySummary.dataResidency++
      if (p.label.toLowerCase().includes("failover")) policySummary.automaticFailover++
    })
    policySummary.auditLogging++
  })

  // Governance decision for selected app (even without requests)
  const appGovernance = useMemo(() => {
    if (!selectedAppConfig) return null
    // Use a default task type for the app to show its governance config
    const defaultTasks: Record<string, string> = {
      "support-assistant": "summarization",
      "hr-assistant": "extraction",
      "legal-assistant": "reasoning",
      "finance-analytics": "extraction",
      "code-assistant": "code-generation",
    }
    const taskId = defaultTasks[selectedAppConfig.id] ?? "summarization"
    return getGovernanceDecision(selectedAppConfig.id, taskId)
  }, [selectedAppConfig])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          AI Platform Operations Console
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Governance, observability, and cost control across all enterprise AI
          traffic.
        </p>
      </div>

      {/* Operational Dashboard — Top-level metrics (filtered when app selected) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={<Activity className="h-4 w-4" />}
          label="Total Requests"
          value={totalRequests.toString()}
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Estimated Spend"
          value={`$${estimatedSpend.toFixed(4)}`}
        />
        <MetricCard
          icon={<Hash className="h-4 w-4" />}
          label="Estimated Tokens"
          value={estimatedTokens.toLocaleString()}
        />
        <MetricCard
          icon={<Layers className="h-4 w-4" />}
          label="Governed Apps"
          value={governedApps.toString()}
        />
        <MetricCard
          icon={<GitBranch className="h-4 w-4" />}
          label="Fallback Events"
          value={fallbackEvents.toString()}
        />
        <MetricCard
          icon={<Shield className="h-4 w-4" />}
          label="Policy Checks"
          value={policyChecks.toString()}
        />
      </div>

      {/* Active filter indicator */}
      {selectedAppName && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <span className="text-sm text-foreground">
            Filtering by: <span className="font-medium">{selectedAppName}</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedAppName(null)}
            className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear filter
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Application Usage — clickable to filter */}
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              Application Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="mb-3 text-xs text-muted-foreground">
              Click an application to filter details below.
            </p>
            <div className="space-y-2">
              {Object.entries(appUsage).map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    setSelectedAppName(selectedAppName === name ? null : name)
                  }
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors cursor-pointer ${
                    selectedAppName === name
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  <span className="text-sm text-foreground">{name}</span>
                  <Badge variant="secondary">{count}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Execution Mode Distribution */}
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PieChart className="h-4 w-4 text-primary" />
              Execution Mode Distribution
              {selectedAppName && (
                <Badge variant="outline" className="ml-auto text-[10px]">Filtered</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <DistributionBar
                label="Mock Demo"
                count={mockCount}
                total={filteredTotal}
                color="bg-amber-500"
              />
              <DistributionBar
                label="AI Gateway"
                count={gatewayCount}
                total={filteredTotal}
                color="bg-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Provider / Model Distribution */}
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Server className="h-4 w-4 text-primary" />
              Provider / Model Distribution
              {selectedAppName && (
                <Badge variant="outline" className="ml-auto text-[10px]">Filtered</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {Object.entries(providerCounts).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {selectedAppName
                    ? `No requests yet for ${selectedAppName}.`
                    : "No requests yet."}
                </p>
              ) : (
                Object.entries(providerCounts).map(([provider, count]) => (
                  <DistributionBar
                    key={provider}
                    label={provider}
                    count={count}
                    total={filteredTotal}
                    color={
                      provider === "OpenAI"
                        ? "bg-green-500"
                        : provider === "Anthropic"
                          ? "bg-orange-500"
                          : "bg-purple-500"
                    }
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Classification Distribution */}
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              Task Classification Distribution
              {selectedAppName && (
                <Badge variant="outline" className="ml-auto text-[10px]">Filtered</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {Object.entries(taskCounts).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {selectedAppName
                    ? `No requests yet for ${selectedAppName}.`
                    : "No requests yet."}
                </p>
              ) : (
                Object.entries(taskCounts).map(([task, count]) => (
                  <div
                    key={task}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <span className="text-sm text-foreground">{task}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Governance Details — shows selected app config OR latest request */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Cpu className="h-4 w-4 text-primary" />
            Governance Details
            {selectedAppName ? (
              <span className="ml-1 font-normal text-muted-foreground">
                — {selectedAppName}
              </span>
            ) : latest ? (
              <span className="ml-1 font-normal text-muted-foreground">
                — Latest Request
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* If an app is selected, show its governance config */}
          {selectedAppName && selectedAppConfig && appGovernance ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Application" value={selectedAppConfig.name} />
              <DetailItem label="Team" value={selectedAppConfig.team} />
              <DetailItem label="Data Sensitivity" value={selectedAppConfig.sensitivity} />
              <DetailItem
                label="Selected Model"
                value={MODEL_REGISTRY[appGovernance.selectedModelId]?.name ?? appGovernance.selectedModelId}
              />
              <DetailItem
                label="Fallback Model"
                value={MODEL_REGISTRY[appGovernance.fallbackModelId]?.name ?? appGovernance.fallbackModelId}
              />
              <DetailItem label="Cost Tier" value={appGovernance.costTier} />
              <DetailItem
                label="Execution Mode"
                value={appGovernance.executionMode === "mock" ? "Mock Demo" : "AI Gateway"}
              />
              <DetailItem
                label="Routing Reason"
                value={appGovernance.routingReason}
              />
              <DetailItem
                label="Region"
                value={selectedAppConfig.region}
              />
              <DetailItem
                label="Allowed Providers"
                value={selectedAppConfig.allowedProviders.join(", ")}
              />
              <DetailItem
                label="Applied Policies"
                value={appGovernance.policies.map((p) => p.label).join(", ")}
              />
              {latest && (
                <DetailItem
                  label="Last Request Task"
                  value={latest.taskName}
                />
              )}
            </div>
          ) : !latest ? (
            <p className="text-sm text-muted-foreground">
              Submit a request from the AI Applications tab, or select an
              application above to see governance details.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Application" value={latest.appName} />
              <DetailItem label="Detected Task Type" value={latest.taskName} />
              <DetailItem
                label="Classification Reason"
                value={latest.decision.routingReason}
              />
              <DetailItem label="Selected Model" value={latest.selectedModelName} />
              <DetailItem label="Fallback Model" value={latest.fallbackModelName} />
              <DetailItem label="Cost Tier" value={latest.costTier} />
              <DetailItem
                label="Execution Mode"
                value={
                  latest.executionMode === "mock" ? "Mock Demo" : "AI Gateway"
                }
              />
              <DetailItem
                label="Routing Reason"
                value={latest.decision.rationale[0]}
              />
              <DetailItem
                label="Applied Policies"
                value={latest.decision.policies.map((p) => p.label).join(", ")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dynamic Architecture Overview */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-primary" />
            Architecture Path
            {selectedAppName ? (
              <span className="ml-1 font-normal text-muted-foreground">
                — {selectedAppName}
              </span>
            ) : latest ? (
              <span className="ml-1 font-normal text-muted-foreground">
                — Latest Request
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Show architecture for selected app config OR latest request */}
          {selectedAppName && selectedAppConfig && appGovernance ? (
            <AppArchitecturePath app={selectedAppConfig} decision={appGovernance} />
          ) : !latest ? (
            <p className="text-sm text-muted-foreground">
              Submit a request or select an application to visualize the
              architecture path.
            </p>
          ) : (
            <ArchitecturePath record={latest} />
          )}
        </CardContent>
      </Card>

      {/* Policy Enforcement Summary */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            Policy Enforcement Summary
            {selectedAppName && (
              <Badge variant="outline" className="ml-auto text-[10px]">Filtered</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {selectedAppName && appGovernance && filteredRequests.length === 0 ? (
            // Show the policies that WOULD apply even without requests
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-3">
                Policies configured for {selectedAppName} (no requests recorded yet):
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {appGovernance.policies.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <span className="text-sm text-foreground">{p.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PolicyMetric label="PII Redaction" count={policySummary.piiRedaction} />
              <PolicyMetric label="Cost Guardrails" count={policySummary.costGuardrails} />
              <PolicyMetric label="Model Allowlist Checks" count={policySummary.modelAllowlist} />
              <PolicyMetric label="Data Residency Checks" count={policySummary.dataResidency} />
              <PolicyMetric label="Automatic Failover" count={policySummary.automaticFailover} />
              <PolicyMetric label="Audit Logging" count={policySummary.auditLogging} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide">
            {label}
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function DistributionBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {count} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

function PolicyMetric({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <Badge variant={count > 0 ? "default" : "secondary"}>{count}</Badge>
    </div>
  )
}

function ArchitecturePath({ record }: { record: RequestRecord }) {
  const selectedModel = MODEL_REGISTRY[record.selectedModelId]
  const fallbackModel = MODEL_REGISTRY[record.fallbackModelId]

  if (record.executionMode === "mock") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StepBox label={record.appName} variant="app" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepBox label="Governance Layer" variant="governance" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepBox label="Mock Execution" variant="mock" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StepBox label={record.appName} variant="app" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepBox label="Governance Layer" variant="governance" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepBox label="Vercel AI Gateway" variant="gateway" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepBox
          label={`${selectedModel.provider} / ${selectedModel.name}`}
          variant="provider"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Fallback: {fallbackModel.provider} / {fallbackModel.name}
      </p>
    </div>
  )
}

function AppArchitecturePath({
  app,
  decision,
}: {
  app: { name: string; executionMode: string }
  decision: { selectedModelId: string; fallbackModelId: string }
}) {
  const selectedModel = MODEL_REGISTRY[decision.selectedModelId]
  const fallbackModel = MODEL_REGISTRY[decision.fallbackModelId]

  if (app.executionMode === "mock") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StepBox label={app.name} variant="app" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepBox label="Governance Layer" variant="governance" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepBox label="Mock Execution" variant="mock" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StepBox label={app.name} variant="app" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepBox label="Governance Layer" variant="governance" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepBox label="Vercel AI Gateway" variant="gateway" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <StepBox
          label={`${selectedModel.provider} / ${selectedModel.name}`}
          variant="provider"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Fallback: {fallbackModel.provider} / {fallbackModel.name}
      </p>
    </div>
  )
}

function StepBox({
  label,
  variant,
}: {
  label: string
  variant: "app" | "governance" | "gateway" | "provider" | "mock"
}) {
  const colors = {
    app: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    governance: "border-primary/30 bg-primary/10 text-primary",
    gateway: "border-green-500/30 bg-green-500/10 text-green-400",
    provider: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    mock: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium ${colors[variant]}`}
    >
      {label}
    </span>
  )
}
