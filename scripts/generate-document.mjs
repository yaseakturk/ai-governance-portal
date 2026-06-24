import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType,
} from "docx";
import { writeFileSync } from "fs";

// Helper functions
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 400, after: 200 } });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 150 },
    ...opts,
    children: [new TextRun({ text, size: 22, ...opts })],
  });
}
function bold(text) {
  return new Paragraph({
    spacing: { after: 150 },
    children: [new TextRun({ text, size: 22, bold: true })],
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    spacing: { after: 100 },
    bullet: { level },
    children: [new TextRun({ text, size: 22 })],
  });
}

function tableRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map(text => new TableCell({
      width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
      shading: isHeader ? { type: ShadingType.SOLID, color: "2B3544" } : undefined,
      children: [new Paragraph({
        children: [new TextRun({ text, bold: isHeader, size: 20, color: isHeader ? "FFFFFF" : "000000" })],
      })],
    })),
  });
}

// ─── Document Content ─────────────────────────────────────────────────────────
const doc = new Document({
  sections: [{
    properties: {},
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "Enterprise AI Governance Portal", size: 48, bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: "Technical Solution Document", size: 28, color: "666666" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "Vercel AI Gateway Implementation", size: 24, color: "3B82F6" })],
      }),

      // ─── Section 1: The Problem ──────────────────────────────────────────
      heading("1. The Problem: AI Fragmentation Across the Enterprise"),
      para("Large enterprises today face a critical challenge: multiple teams have independently adopted AI tools without centralized coordination. Each department has chosen its own provider, manages its own credentials, and operates without visibility into what other teams are doing."),
      para("This creates a set of compounding problems that become increasingly dangerous as AI usage scales:"),
      bold("1.1 No Cost Visibility"),
      para("When Support uses OpenAI, Legal uses Anthropic, and Finance uses a different OpenAI tier, nobody — not the CTO, not Finance, not Platform Engineering — knows the total AI spend across the organization. Each team has a separate billing dashboard with a separate provider. There is no single pane of glass for AI cost."),
      bold("1.2 No Governance or Policy Enforcement"),
      para("Without a centralized layer, there is no way to enforce data handling policies. Sensitive legal documents may be sent to a model that stores prompts. Employee PII may flow to a provider without a data processing agreement. There is no model allowlist, no data residency enforcement, and no audit trail."),
      bold("1.3 Vendor Lock-In"),
      para("Each team has written their integration code directly against a specific provider SDK. Support imports the OpenAI client library. Legal imports the Anthropic client library. If the organization wants to switch Legal from Claude to GPT-4o (perhaps because of a pricing change or a new capability), the Legal team must rewrite their integration code, update dependencies, test the new SDK, and redeploy. This is expensive and slow."),

      bold("1.4 No Resilience"),
      para("If Anthropic has a 10-minute outage, every team using Claude is down. There is no automatic failover to a backup provider. Each application has a single point of failure. In an enterprise context where AI is embedded in customer-facing support workflows or time-sensitive legal reviews, this is unacceptable."),
      bold("1.5 No Observability"),
      para("Leadership cannot answer basic questions: How many AI requests are we making per day? Which team uses the most tokens? What types of tasks are we using AI for? Are there quality issues or hallucinations? Without centralized observability, AI usage is a black box."),
      bold("1.6 No Quality Assurance"),
      para("There is no systematic way to evaluate whether AI responses meet quality standards. If a model starts hallucinating or producing lower-quality output after a provider update, no one knows until a user complains. There is no regression testing, no rubric-based evaluation, and no automated quality scoring."),

      // ─── Section 2: The Solution ─────────────────────────────────────────
      heading("2. The Solution: Centralized AI Governance with Vercel AI Gateway"),
      para("We propose a centralized AI governance architecture that sits between all internal business applications and AI providers. The architecture has two layers:"),
      bullet("Governance Layer (application-side): Decides which model each application should use, what cost tier applies, what policies are enforced, and what the fallback model is."),
      bullet("Vercel AI Gateway (infrastructure-side): Executes the model call through a unified API, handles credential management, provides failover at the transport level, and delivers built-in observability."),
      para("This separation is intentional. Business decisions (which model should Legal use?) belong in the governance layer where they can be version-controlled, reviewed, and audited. Infrastructure concerns (how do we reliably call that model?) belong in the gateway."),

      bold("2.1 Architecture Overview"),
      para("The request flow is: Business Application → Governance Layer → Vercel AI Gateway → AI Provider (OpenAI / Anthropic / Google)"),
      para("For mock demo applications (no provider cost): Business Application → Governance Layer → Local Mock Execution"),
      para("The governance layer outputs a GovernanceDecision object containing: selected model, fallback model, cost tier, routing reason, and enforced policies. The AI Gateway then receives a single generateText() call with the chosen model ID and handles the rest."),

      // ─── Section 3: Why Vercel AI Gateway ────────────────────────────────
      heading("3. Why Vercel AI Gateway Is the Right Solution"),
      para("The customer specifically wanted to solve this problem using Vercel's platform. Here is why the AI Gateway is the right fit:"),
      bold("3.1 Provider Abstraction"),
      para("The AI Gateway provides a single API endpoint for hundreds of models across OpenAI, Anthropic, Google, xAI, Meta, Mistral, and more. Every model call uses the same interface: generateText({ model: 'provider/model-name', prompt }). There are no separate SDKs to install, no separate client libraries to maintain, and no separate authentication flows. Switching from Claude to GPT-4o is a one-string change."),
      bold("3.2 Centralized Credential Management"),
      para("Instead of every team managing their own API keys (with the security risks of key rotation, exposure, and scattered environment variables), the gateway manages all provider credentials centrally. Teams never see or handle provider keys. This is a significant security improvement for enterprises with strict credential management policies."),
      bold("3.3 Automatic Failover and High Availability"),
      para("The gateway provides automatic failover at the infrastructure level. If a provider returns errors, hits rate limits, or experiences an outage, the gateway can retry or reroute. Our application layer adds a second level of failover: if the primary model fails, we catch the error and retry with the governance-approved fallback model. This gives two layers of resilience."),

      bold("3.4 Higher Rate Limits"),
      para("Single provider accounts have rate limits that can throttle high-volume enterprise workloads. The gateway pools capacity across multiple provider accounts and regions, delivering higher effective throughput than any team could achieve on their own."),
      bold("3.5 Built-in Observability"),
      para("The gateway natively provides token usage per request, cost tracking across all providers in one dashboard, latency percentiles, and error rates. This eliminates the need to juggle separate OpenAI, Anthropic, and Google dashboards. Our governance layer adds business context on top: which application, which team, which task type, which policies were enforced."),
      bold("3.6 Zero Token Markup"),
      para("The gateway charges no markup on model prices. You pay the exact same per-token rate as going directly to the provider. The gateway's value is in the infrastructure (reliability, observability, credential management), not in token arbitrage."),
      bold("3.7 Sub-20ms Latency Overhead"),
      para("Built on Vercel's CDN infrastructure that serves trillions of requests per year, the gateway adds minimal latency overhead on top of the provider's response time. For enterprise applications where response time matters, this is critical."),
      bold("3.8 Data Retention Policies"),
      para("The gateway supports configuring data retention policies at the infrastructure level, controlling how long request and response data is stored. This is important for enterprises with regulatory requirements around data lifecycle management."),

      // ─── Section 4: All Gateway Features ─────────────────────────────────
      heading("4. Complete AI Gateway Feature Set"),
      para("Below is the full set of features available through the Vercel AI Gateway:"),

      new Table({
        rows: [
          tableRow(["Feature", "Description", "Status in Demo"], true),
          tableRow(["Provider Abstraction", "One API for hundreds of models (OpenAI, Anthropic, Google, xAI, Meta, Mistral)", "Used"]),
          tableRow(["Model Switching", "Change one string to switch provider/model — zero code changes", "Used"]),
          tableRow(["Automatic Failover", "Provider failure triggers automatic retry with fallback model", "Used"]),
          tableRow(["Multi-Provider Support", "Route to any supported provider through same interface", "Used"]),
          tableRow(["Credential Management", "Centralized API key management — teams never handle keys", "Available in production"]),
          tableRow(["Built-in Observability", "Native token usage, cost, latency, error rates per request", "Available in production"]),
          tableRow(["Load Balancing", "Distribute requests across providers/regions for higher throughput", "Available in production"]),
          tableRow(["Rate Limit Management", "Automatic queuing and throttling per provider", "Available in production"]),
          tableRow(["Spend Controls", "Budget caps and alerts at gateway level", "Available in production"]),
          tableRow(["Data Retention Policies", "Enforce data lifecycle at infrastructure level", "Available in production"]),
          tableRow(["Image Generation", "Support for DALL-E and other image models", "Available in production"]),
          tableRow(["Video Generation", "Support for video generation models", "Available in production"]),
          tableRow(["Embeddings", "Vector embedding generation through same interface", "Available in production"]),
          tableRow(["Web Search", "Web search capability through gateway models", "Available in production"]),
          tableRow(["Zero Token Markup", "No surcharge — provider market rates only", "Available in production"]),
          tableRow(["Sub-20ms Overhead", "Built on Vercel CDN (trillions of requests/year)", "Available in production"]),
        ],
      }),

      // ─── Section 5: Why This Implementation ──────────────────────────────
      heading("5. Why We Implemented the Solution This Way"),
      bold("5.1 The Payment Constraint"),
      para("The Vercel AI Gateway requires active billing and provider API keys (OpenAI, Anthropic) to route real model requests. Since this is a demonstration environment without production credentials, we designed the architecture to work in two modes:"),
      bullet("Mock Demo mode: Applications return realistic templated responses generated locally. This demonstrates the full governance flow (routing, policy enforcement, cost tracking, observability) without making any paid API calls."),
      bullet("AI Gateway mode: Applications route through the real gateway. When credentials are available, they return actual AI-generated responses with automatic failover. Without credentials, they return a professional notice explaining that the gateway is configured but inactive."),
      para("This dual-mode approach allows us to demonstrate every aspect of the governance story without incurring costs, while making it trivially easy to activate the full gateway flow by adding environment variables."),
      bold("5.2 App-Side Routing vs Gateway-Side Routing"),
      para("We chose to make routing decisions in the application governance layer rather than delegating routing entirely to the gateway. The governance logic lives in lib/governance.ts and determines which model each application uses based on data sensitivity, task complexity, and cost tier rules."),
      para("This was a deliberate choice for three reasons:"),
      bullet("It allows the governance flow to work fully without gateway billing (the mock mode)"),
      bullet("Enterprise routing rules are business decisions that should be version-controlled, code-reviewed, and auditable — not buried in gateway configuration"),
      bullet("The demo is transparent and walkable — you can show customers exactly how routing decisions are made by reading the code"),

      bold("5.3 Alternative Implementation with Full Subscription"),
      para("If we had active AI Gateway billing and provider credentials, the implementation could be enhanced in the following ways:"),
      bullet("Gateway-side fallback chains: Instead of try/catch in application code, configure fallback chains directly in the gateway (try Claude → GPT-4o → Gemini automatically at the infrastructure level)"),
      bullet("Gateway-side rate limiting and spend controls: Set budget caps per team or per application at the gateway level, with automatic blocking when limits are reached"),
      bullet("Real-time observability from the gateway dashboard: Native token counts, cost per request, latency percentiles, and provider health monitoring without building a custom dashboard"),
      bullet("LLM-as-judge evaluation: The evaluation framework would call a judge model through the gateway to score every response on relevance, accuracy, safety, and hallucination detection"),
      bullet("Load balancing across regions: Distribute requests geographically for lower latency and higher availability"),
      bullet("Content filtering at the gateway level: Block or flag responses that contain harmful content before they reach the user"),
      para("The current implementation demonstrates all of these concepts at the application level. Moving them to the gateway level would reduce application code complexity and provide infrastructure-grade reliability."),

      // ─── Section 6: Prompting Strategy ───────────────────────────────────
      heading("6. Prompting, Context Selection, and Fallback Behavior"),
      bold("6.1 System Prompt Design"),
      para("Every request sent through the AI Gateway includes a system prompt that establishes the application context. The system prompt is constructed dynamically based on the application and task type:"),
      bullet("Role assignment: 'You are the AI assistant powering [App Name] for the [Team] team.'"),
      bullet("Task context: 'The requested task type is [Task Name]: [Task Description].'"),
      bullet("Safety boundary: 'Data sensitivity for this application is [Level]. Never request or expose secrets.'"),
      bullet("Format instruction: 'Respond concisely and professionally, formatted for an internal platform tool.'"),

      para("This approach is effective because it gives the model enough context to respond appropriately without over-constraining the output. The model knows its role, the expected task type, the sensitivity level, and the desired format. It does not need to know about governance policies, cost tiers, or routing decisions — those are infrastructure concerns."),
      bold("6.2 Context Selection"),
      para("We deliberately keep the context minimal. The system prompt provides role and constraints. The user prompt provides the actual request. We do not inject additional retrieved context (RAG) in this implementation because:"),
      bullet("The demo focuses on governance, not retrieval quality"),
      bullet("Each application would need its own knowledge base (HR handbook, legal contracts, support tickets) which is out of scope for the governance demo"),
      bullet("In production, each application team would own their retrieval pipeline, and the governance layer would not need to be aware of it"),
      para("If this were extended to production, each application would add its own retrieval context before calling the governance API. The governance layer would remain agnostic to the content."),
      bold("6.3 Fallback Behavior"),
      para("The fallback strategy is a two-level approach:"),
      bullet("Level 1 (Application): If the primary model fails (timeout, rate limit, error), the code catches the error and retries with the governance-approved fallback model. This is a different provider (e.g., Claude fails → retry with GPT-4o) to ensure provider-level resilience."),
      bullet("Level 2 (Gateway): The AI Gateway itself handles retries, circuit breaking, and provider health checks at the transport level before the error even reaches our application code."),
      para("The fallback model is always pre-approved by the platform team and respects the same governance policies (data sensitivity, provider allowlist, cost tier). This ensures that a fallback never routes sensitive data to an unapproved provider."),
      para("If both the primary and fallback models fail (which happens in this demo without credentials), the API returns a professional notice rather than a raw error. This allows the governance flow to be demonstrated end-to-end while clearly communicating that the gateway is configured but inactive."),

      // ─── Section 7: Model Choice and Trade-offs ──────────────────────────
      heading("7. Model Choice, Cost/Latency Trade-offs, and Safety"),
      bold("7.1 Model Selection Rationale"),
      para("The model registry includes four models chosen to represent a realistic enterprise selection:"),
      new Table({
        rows: [
          tableRow(["Model", "Provider", "Cost Tier", "Best For"], true),
          tableRow(["GPT-4o mini", "OpenAI", "Economy ($0.15/1M in)", "High-volume, low-risk: ticket classification, FAQ"]),
          tableRow(["Claude Haiku 4.5", "Anthropic", "Economy ($1.00/1M in)", "Fast drafting with safety guardrails"]),
          tableRow(["GPT-4o", "OpenAI", "Standard ($2.50/1M in)", "Balanced reasoning: financial analysis, general tasks"]),
          tableRow(["Claude Sonnet 4.5", "Anthropic", "Premium ($3.00/1M in)", "Complex reasoning: legal review, code architecture"]),
        ],
      }),
      para("This selection provides diversity across cost tiers, providers, and capability levels. Every application has a cross-provider fallback (OpenAI primary → Anthropic fallback, or vice versa), ensuring that a single provider outage never takes down all applications."),
      bold("7.2 Cost/Latency Trade-offs"),
      para("The cost tier system maps task complexity to acceptable cost levels:"),
      bullet("Economy tier (low complexity): Tasks like classification and summarization use the cheapest models. High volume, low risk — optimized for throughput and cost."),
      bullet("Standard tier (medium complexity): Tasks like data extraction and content drafting use mid-range models. Balanced quality and cost."),
      bullet("Premium tier (high complexity): Tasks like legal reasoning and code generation use frontier models. Quality is paramount; cost is secondary."),

      para("Additionally, data sensitivity upgrades the cost tier: restricted data (legal, finance) is never processed by economy-tier models, even for simple tasks. This ensures that sensitive content always goes through higher-quality, more carefully trained models."),
      bold("7.3 Safety Considerations"),
      para("Safety is enforced at multiple levels:"),
      bullet("Model allowlist: Each application can only call approved providers. Legal cannot accidentally route to a provider without a data processing agreement."),
      bullet("Data residency: Inference is pinned to specific regions (e.g., us-east for SOC 2 compliance). This is declared in the governance config and would be enforced at the gateway level in production."),
      bullet("PII redaction: For confidential and restricted applications, prompts are flagged for PII scrubbing before egress. In this demo, the policy is declared; in production, a middleware layer would perform actual redaction."),
      bullet("System prompt safety boundary: Every model call includes a data sensitivity declaration that instructs the model not to request or expose secrets."),
      bullet("Audit logging: Every request is tracked with full metadata (application, task type, model used, policies applied) for compliance and forensics."),
      bold("7.4 What Could Be Improved"),
      para("For a production deployment, the following enhancements would strengthen the solution:"),
      bullet("Dynamic model selection based on real-time provider health and latency, not just static config"),
      bullet("Token budget enforcement: reject requests that would exceed the application's monthly token budget"),
      bullet("Actual PII redaction middleware (regex + NER model) before prompts leave the application boundary"),
      bullet("Response quality monitoring with automated alerts when evaluation scores drop below threshold"),
      bullet("A/B testing support: route a percentage of traffic to a new model candidate and compare evaluation scores"),
      bullet("Fine-tuned models for specific applications (e.g., a support-specific model trained on historical tickets)"),

      // ─── Section 8: Enterprise Customer Pitch ────────────────────────────
      heading("8. How to Pitch and Implement This with an Enterprise Customer"),
      bold("8.1 The Pitch Structure"),
      para("The pitch follows a problem-solution-proof structure designed for CTO/CIO-level stakeholders:"),
      bullet("Open with the pain: 'Your teams are independently calling AI providers. You have no visibility into spend, no governance over sensitive data, and no resilience if a provider goes down. Every model switch requires a code change and redeployment.'"),
      bullet("Present the architecture: 'We propose a governance layer that controls routing decisions, combined with Vercel AI Gateway that handles execution. Your teams keep their applications. They just stop managing provider connections directly.'"),
      bullet("Show the demo: Tab 1 shows what business users see (simple, clean, no infrastructure noise). Tab 2 shows what the platform team sees (full observability, governance details, cost tracking)."),
      bullet("Quantify the value: 'If you switch Legal from Claude to GPT-4o tomorrow, it is a one-line config change. No code review, no deployment, no testing a new SDK. If Anthropic has an outage, Legal automatically fails over to GPT-4o with zero downtime.'"),
      bullet("Close with the roadmap: 'Phase 1 is governance and routing (what we demonstrated). Phase 2 adds real-time spend controls, automated quality evaluation, and A/B testing for model candidates.'"),
      bold("8.2 Implementation Phases"),
      para("For an enterprise customer, the implementation would follow a phased approach:"),
      bold("Phase 1: Foundation (4-6 weeks)"),
      bullet("Deploy the governance layer with the customer's application inventory"),
      bullet("Configure model routing rules per application based on data sensitivity and task type"),
      bullet("Activate Vercel AI Gateway with the customer's provider credentials"),
      bullet("Enable the Platform Operations dashboard for the platform team"),
      bullet("Migrate 2-3 pilot applications from direct provider calls to the governed gateway"),

      bold("Phase 2: Scale (4-6 weeks)"),
      bullet("Migrate remaining applications to the governed gateway"),
      bullet("Enable spend controls and budget alerts per team/application"),
      bullet("Deploy the evaluation framework with LLM-as-judge for quality monitoring"),
      bullet("Configure data retention policies and audit logging for compliance"),
      bullet("Integrate with the customer's existing observability stack (Datadog, Grafana, etc.)"),
      bold("Phase 3: Optimize (ongoing)"),
      bullet("A/B test new model candidates (e.g., when Claude 5 launches, test it against Claude Sonnet 4.5)"),
      bullet("Implement dynamic routing based on real-time provider health and cost optimization"),
      bullet("Add application-specific retrieval pipelines (RAG) where needed"),
      bullet("Fine-tune models for high-volume applications to reduce cost and improve quality"),
      bullet("Expand to additional modalities (image generation, embeddings) as use cases emerge"),
      bold("8.3 Key Selling Points for Enterprise Stakeholders"),
      para("For the CTO/CIO:"),
      bullet("Complete visibility into AI spend across the organization for the first time"),
      bullet("Governance and compliance posture that satisfies audit requirements"),
      bullet("Provider independence — no single vendor can hold the organization hostage"),
      para("For Platform Engineering:"),
      bullet("One integration point instead of maintaining 5+ provider SDKs"),
      bullet("Model switching without application redeployment"),
      bullet("Built-in failover and resilience without custom infrastructure code"),
      para("For Security/Compliance:"),
      bullet("Centralized credential management — no more scattered API keys"),
      bullet("Data residency enforcement and PII redaction policies"),
      bullet("Full audit trail of every AI request with governance metadata"),

      para("For Business Teams:"),
      bullet("Their applications keep working exactly as before — the governance layer is invisible to end users"),
      bullet("Better reliability — automatic failover means fewer 'AI is down' incidents"),
      bullet("Access to the best models without managing provider relationships"),
      bold("8.4 Objection Handling"),
      para("'Why do we need a gateway if we decide the model ourselves?'"),
      para("Answer: You decide WHAT model to use (governance). The gateway handles HOW to call it — reliably, securely, and with observability. Without the gateway, every team manages their own SDKs, credentials, failover logic, and observability. That is the fragmentation you are trying to eliminate. Think of it like a load balancer: you decide which backend handles a request, but you still use an ALB for TLS termination, health checks, retries, and connection pooling."),
      para("'We could just standardize on one provider.'"),
      para("Answer: That creates a single point of failure and limits your ability to use the best model for each task. Claude is better at legal reasoning. GPT-4o is better at general tasks. GPT-4o mini is cheapest for classification. A governance layer lets you use the right model for each application while maintaining a single operational interface."),
      para("'This seems like overhead we do not need yet.'"),
      para("Answer: The overhead is minimal (one governance config file, one gateway endpoint). The cost of NOT doing this grows exponentially with each new team that adopts AI. Every month you wait, you accumulate more fragmented integrations that are harder to migrate later. The best time to centralize is before the problem becomes painful, not after."),

      // ─── Section 9: Conclusion ───────────────────────────────────────────
      heading("9. Conclusion"),
      para("This solution demonstrates that enterprise AI governance is not just about generating answers — it is about centralized control, visibility, and resilience across all AI usage in the organization."),
      para("The Vercel AI Gateway provides the infrastructure foundation: provider abstraction, credential management, failover, and observability. Our governance layer adds the business logic: which model each application uses, what policies are enforced, and what the cost boundaries are."),
      para("Together, they solve the customer's core problems: fragmented AI usage, invisible costs, zero governance, and brittle single-provider dependencies. The two-tab demo makes this tangible — Tab 1 shows that business users experience zero friction, and Tab 2 shows that the platform team has complete control and visibility."),
      para("The path to production is clear, incremental, and low-risk. Start with 2-3 pilot applications, prove the value, then scale across the organization."),
    ],
  }],
});

// ─── Generate the file ──────────────────────────────────────────────────────
const buffer = await Packer.toBuffer(doc);
writeFileSync("AI-Governance-Solution-Document.docx", buffer);
console.log("✅ Document saved: AI-Governance-Solution-Document.docx");
