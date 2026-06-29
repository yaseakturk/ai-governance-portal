# AI Governance Portal

An enterprise AI governance demo built with Next.js and the Vercel AI SDK, demonstrating how organizations can centrally manage, observe, and control AI usage across multiple internal applications through Vercel's AI Gateway.

---

## Customer Problem

The customer is a large enterprise where multiple teams have independently adopted AI:

- **Support team** uses one provider, **Legal** uses another, **Finance** uses yet another
- Every team manages their own API keys, SDKs, and provider accounts
- **No cost visibility** — leadership has no idea how much is being spent on AI across the organization
- **No governance** — no control over which models handle sensitive or restricted data
- **Vendor lock-in** — switching models requires rewriting code in every application
- **No resilience** — if a provider goes down, the application breaks
- **No policy enforcement** — no PII protection, no data residency guarantees, no audit trail
- **No observability** — no unified view of AI usage, task types, or routing decisions

The customer wanted to solve this using Vercel's platform and AI Gateway is the right fit.

---

## The Solution

An AI Governance Portal was built that demonstrates a centralized governance layer sitting between internal business applications and AI providers, routed through the Vercel AI Gateway. The solutions was designed only to show some capabilities of the AI gateway and adapted to be shown as a demo.

### Architecture

```
Business App → Governance Layer (routing, policies, cost tier) → Vercel AI Gateway → Provider (OpenAI / Anthropic)
```

The governance layer decides **what** model to use based on enterprise policy. The AI Gateway handles **how** to call it — reliably, securely, and with observability.

---

## Why Two Tabs

The application is split into two tabs to clearly communicate the separation between consumers and operators:

### Tab 1: AI Applications (Business Users)

This is what internal teams see. They select their application, type a request, and get an answer. They don't see:
- Which model was selected
- What governance policies were applied
- Cost tier or routing decisions
- Architecture diagrams

**Reason:** A business user doesn't care which model answered. They care that the AI application returned a useful response.

### Tab 2: Platform Operations (Governance Stakeholders)

This is what Platform Engineering, Enterprise Architecture, and CIO/CTO stakeholders see:
- Total requests, estimated spend, token usage
- Per-application usage breakdown
- Execution mode distribution (Mock Demo vs AI Gateway)
- Provider/model distribution (OpenAI vs Anthropic)
- Task classification distribution
- Governance details per application (model, fallback, cost tier, policies)
- Dynamic architecture path visualization
- Policy enforcement summary

**Reason:** The platform team needs visibility and control. They need to know which team is spending how much, on what model, for what type of task, and whether governance policies are being respected.

This separation demonstrates the core value proposition: **enterprise AI governance at scale** — not just generating AI answers.

---

## Why This Architecture (Payment Restriction)

The Vercel AI Gateway requires active billing and provider API keys to route real model requests. Since this is a demo environment without production credentials:

- **2 applications (Support Assistant, HR Assistant)** run in **Mock Demo** mode — they return realistic templated responses locally without calling any provider. This allows the full governance flow to be demonstrated end-to-end without cost.
- **3 applications (Legal Assistant, Finance Analytics, Code Assistant)** are configured to route through the **AI Gateway**. When credentials are provided, they return real AI responses with automatic failover. Without credentials, they show a professional "AI Gateway configured but inactive" notice.

The governance decision logic (model selection, fallback, cost tier, policy enforcement) runs on the application side before sending to the gateway. This was chosen because:

1. It allows the full governance story to be demonstrated without gateway billing
2. The business logic for "which model should Legal use" is inherently an enterprise decision, not an infrastructure decision
3. The code is transparent and walkable — you can show customers exactly how routing works

In production, you could additionally configure gateway-level guardrails (rate limits, spend caps, content filtering) on top of this application-level governance.

---

## Why Vercel AI Gateway Is the Right Solution

The customer's core problems map directly to AI Gateway capabilities:

| Customer Problem | AI Gateway Solution |
|-----------------|---------------------|
| Every team uses different provider SDKs | One unified API — `generateText({ model: "provider/model" })` |
| API keys scattered across teams | Centralized credential management |
| Can't switch models without code changes | Change one string to switch provider/model |
| No cost visibility across the org | Unified usage tracking and cost dashboard |
| Provider outage breaks applications | Automatic failover and high availability |
| Rate limited by single provider accounts | Higher pooled rate limits across providers |
| No way to enforce data policies | Gateway-level guardrails and data retention policies |

---

## AI Gateway Features — Used vs Not Used in This Demo

### Used in This Demo

| Feature | How It's Used |
|---------|---------------|
| **Provider Abstraction** | All model calls use `generateText({ model: "provider/model" })` — one interface for OpenAI and Anthropic |
| **Model Switching** | Changing `primaryModelId` in the governance config switches the model with zero code changes |
| **Automatic Failover** | Gateway `order` option defines fallback priority — gateway handles provider failover automatically |
| **Provider Restriction** | Gateway `only` option enforces governance-approved providers per application |
| **Data Privacy Controls** | `disallowPromptTraining` for confidential apps, `zeroDataRetention` for restricted apps — enforced at gateway level based on sensitivity |

---

## Tech Stack

- **Next.js 16** — React framework
- **Vercel AI SDK** (`ai` package) — unified model interface
- **React 19** — UI layer
- **Tailwind CSS 4** — styling
- **TypeScript** — type safety
- **shadcn/ui** — component library
- **Zod** — schema validation (used in evaluation framework)

---

## Response Evaluation Framework

Every response goes through a quality evaluation pipeline before being returned to the user. This is implemented in `lib/evaluation.ts` and called from the API route.

### Two-Layer Evaluation

**Layer 1: Deterministic Checks (runs on every request, no credentials needed)**
- Response has content (non-empty)
- Meets minimum length threshold
- Contains required keywords for the application context
- Avoids prohibited/off-topic keywords
- No refusal language detected

**Layer 2: LLM-as-Judge (production mode, requires AI Gateway credentials)**

Uses the AI SDK's `generateObject()` to have a model evaluate responses with structured output:

```typescript
import { generateObject } from "ai"
import { z } from "zod"

const { object } = await generateObject({
  model: "openai/gpt-4o-mini",
  schema: EvaluationResultSchema,
  prompt: `Evaluate this AI response against the rubric...`,
})
```

Scoring dimensions:
- **Relevance** (1–5) — Is the response on-topic?
- **Accuracy** (1–5) — Are facts correct?
- **Completeness** (1–5) — Is key information covered?
- **Safety** (1–5) — Is the response appropriate for enterprise use?
- **Hallucination detection** (boolean) — Did the model fabricate facts?

### Running the Eval Suite

```bash
# Deterministic checks only (works without credentials)
npm run eval

# Full evaluation with LLM-as-judge via AI Gateway
npm run eval:llm
```

The test suite includes 7 test cases across all 5 applications with defined rubrics, expected behaviors, and pass/fail criteria.

### Why This Matters for Governance

An enterprise governing AI at scale needs to verify output quality, not just route requests. The evaluation framework ensures:
- Quality regression detection when switching models
- Hallucination monitoring across applications
- Safety compliance verification
- Objective quality scoring that doesn't depend on human review for every request

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### To activate AI Gateway (optional)

Create `.env.local`:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

With keys configured, Legal Assistant, Finance Analytics, and Code Assistant will return real AI responses through the Vercel AI Gateway.

---

## Project Structure

```
app/
  page.tsx                    — Main page (renders GovernancePortal)
  api/governance/route.ts     — API route: executes governance decisions, calls models, runs evaluation
lib/
  governance.ts               — Governance brain: model registry, app configs, routing logic, policies
  request-store.ts            — Client-side state store for cross-tab communication
  evaluation.ts               — Evaluation framework: test cases, rubric, LLM-as-judge, deterministic checks
components/
  governance-portal.tsx       — Tab layout (AI Applications / Platform Operations)
  ai-applications-tab.tsx     — Tab 1: Business user experience
  platform-operations-tab.tsx — Tab 2: Governance dashboard
scripts/
  run-eval.ts                 — Evaluation runner (deterministic or full LLM-as-judge mode)
```
