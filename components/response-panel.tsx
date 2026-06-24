"use client"

import {
  Sparkles,
  Loader2,
  AlertTriangle,
  GitBranch,
  Terminal,
  ShieldCheck,
  FlaskConical,
  Cloud,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ExecutionMode } from "@/lib/governance"

export type ResponseState = {
  text?: string
  usedModelName: string
  usedFallback: boolean
  executionMode: ExecutionMode
  gatewayInactive?: boolean
  notice?: string
} | null

export function ResponsePanel({
  loading,
  error,
  response,
}: {
  loading: boolean
  error: string | null
  response: ResponseState
}) {
  return (
    <Card className="flex h-full flex-col border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          AI response
        </CardTitle>
        {response && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1 border-border text-muted-foreground"
            >
              {response.executionMode === "mock" ? (
                <FlaskConical className="h-3 w-3" />
              ) : (
                <Cloud className="h-3 w-3" />
              )}
              {response.executionMode === "mock" ? "Mock Demo" : "AI Gateway"}
            </Badge>
            {response.usedFallback && (
              <Badge
                variant="outline"
                className="border-warning/30 bg-warning/15 text-warning"
              >
                <GitBranch className="h-3 w-3" />
                Failover
              </Badge>
            )}
            {!response.gatewayInactive && (
              <Badge variant="secondary">{response.usedModelName}</Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 pt-5">
        {loading && (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Routing through the governance layer…</p>
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
                AI Gateway integration configured
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
              Select an application and task, enter a prompt, and run a governed
              request. The response and the model that served it appear here.
            </p>
          </div>
        )}

        {!loading && !error && response && !response.gatewayInactive && (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {response.text}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
