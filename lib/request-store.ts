// Client-side state store for cross-tab communication.
// Every request submitted from Tab 1 is recorded here and read by Tab 2.
// Uses useSyncExternalStore-compatible API for proper React integration.

import { useSyncExternalStore } from "react"
import { type GovernanceDecision, type ExecutionMode } from "./governance"

export type RequestRecord = {
  id: string
  timestamp: number
  appId: string
  appName: string
  taskId: string
  taskName: string
  prompt: string
  executionMode: ExecutionMode
  selectedModelId: string
  selectedModelName: string
  fallbackModelId: string
  fallbackModelName: string
  costTier: string
  usedFallback: boolean
  gatewayInactive: boolean
  provider: string
  estimatedInputTokens: number
  estimatedOutputTokens: number
  estimatedCost: number
  decision: GovernanceDecision
}

type Listener = () => void

let _requests: RequestRecord[] = []
const _listeners: Set<Listener> = new Set()

function notify() {
  _listeners.forEach((fn) => fn())
}

export function addRequest(record: RequestRecord) {
  _requests = [..._requests, record]
  notify()
}

export function getRequests(): RequestRecord[] {
  return _requests
}

export function subscribe(listener: Listener): () => void {
  _listeners.add(listener)
  return () => {
    _listeners.delete(listener)
  }
}

/** React hook for subscribing to the request store. */
export function useRequests(): RequestRecord[] {
  return useSyncExternalStore(subscribe, getRequests, getRequests)
}

// Simple token estimation based on character count (4 chars ≈ 1 token).
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Estimate cost based on model pricing and token counts.
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  inputPrice: number,
  outputPrice: number,
): number {
  return (inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000
}
