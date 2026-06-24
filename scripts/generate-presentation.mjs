import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();

// Brand colors
const DARK_BG = "0F172A";
const PRIMARY = "3B82F6";
const ACCENT = "10B981";
const WARNING = "F59E0B";
const TEXT_WHITE = "F8FAFC";
const TEXT_MUTED = "94A3B8";
const CARD_BG = "1E293B";

// Helper to add a consistent header bar
function addHeader(slide, title) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.06,
    fill: { color: PRIMARY },
  });
  slide.addText(title, {
    x: 0.5, y: 0.25, w: 9, h: 0.4,
    fontSize: 11, color: TEXT_MUTED, fontFace: "Arial",
  });
}

// ─── Slide 1: Title ─────────────────────────────────────────────────────────
let slide = pptx.addSlide();
slide.background = { fill: DARK_BG };
slide.addText("Enterprise AI Governance", {
  x: 0.8, y: 1.5, w: 8.5, h: 1,
  fontSize: 36, bold: true, color: TEXT_WHITE, fontFace: "Arial",
});
slide.addText("Solving AI Fragmentation with\nVercel AI Gateway", {
  x: 0.8, y: 2.5, w: 8.5, h: 0.9,
  fontSize: 20, color: PRIMARY, fontFace: "Arial",
});
slide.addText("Platform Engineering · AI Governance · Enterprise Architecture", {
  x: 0.8, y: 4.0, w: 8.5, h: 0.4,
  fontSize: 12, color: TEXT_MUTED, fontFace: "Arial",
});

// ─── Slide 2: The Problem ───────────────────────────────────────────────────
slide = pptx.addSlide();
slide.background = { fill: DARK_BG };
addHeader(slide, "THE PROBLEM");
slide.addText("AI Fragmentation Across the Enterprise", {
  x: 0.5, y: 0.7, w: 9, h: 0.6,
  fontSize: 24, bold: true, color: TEXT_WHITE, fontFace: "Arial",
});

const problems = [
  { icon: "💸", text: "No cost visibility — nobody knows total AI spend across the org" },
  { icon: "🔓", text: "No governance — no control over which models handle sensitive data" },
  { icon: "🔒", text: "Vendor lock-in — switching models requires rewriting code in every app" },
  { icon: "💥", text: "No resilience — if a provider goes down, applications break" },
  { icon: "📋", text: "No policy enforcement — no PII protection, no audit trail" },
  { icon: "👁️", text: "No observability — no unified view of AI usage across teams" },
];

problems.forEach((p, i) => {
  slide.addText(`${p.icon}  ${p.text}`, {
    x: 0.7, y: 1.5 + i * 0.6, w: 8.5, h: 0.5,
    fontSize: 14, color: TEXT_WHITE, fontFace: "Arial",
  });
});

// ─── Slide 3: Current State ─────────────────────────────────────────────────
slide = pptx.addSlide();
slide.background = { fill: DARK_BG };
addHeader(slide, "CURRENT STATE");
slide.addText("Every Team Has Their Own AI Setup", {
  x: 0.5, y: 0.7, w: 9, h: 0.6,
  fontSize: 24, bold: true, color: TEXT_WHITE, fontFace: "Arial",
});

const teams = [
  { team: "Support", provider: "OpenAI GPT-4o mini", issue: "Own API keys, own SDK" },
  { team: "Legal", provider: "Anthropic Claude", issue: "Separate billing, no fallback" },
  { team: "Finance", provider: "OpenAI GPT-4o", issue: "No cost tracking" },
  { team: "HR", provider: "Anthropic Claude Haiku", issue: "No policy enforcement" },
  { team: "Engineering", provider: "Claude Sonnet", issue: "Can't switch without rewrite" },
];

// Table header
slide.addText("Team", { x: 0.7, y: 1.5, w: 2, h: 0.4, fontSize: 11, bold: true, color: PRIMARY, fontFace: "Arial" });
slide.addText("Provider / Model", { x: 2.7, y: 1.5, w: 3, h: 0.4, fontSize: 11, bold: true, color: PRIMARY, fontFace: "Arial" });
slide.addText("Problem", { x: 5.7, y: 1.5, w: 4, h: 0.4, fontSize: 11, bold: true, color: PRIMARY, fontFace: "Arial" });

teams.forEach((t, i) => {
  const y = 2.0 + i * 0.55;
  slide.addText(t.team, { x: 0.7, y, w: 2, h: 0.45, fontSize: 12, color: TEXT_WHITE, fontFace: "Arial" });
  slide.addText(t.provider, { x: 2.7, y, w: 3, h: 0.45, fontSize: 12, color: TEXT_MUTED, fontFace: "Arial" });
  slide.addText(t.issue, { x: 5.7, y, w: 4, h: 0.45, fontSize: 12, color: WARNING, fontFace: "Arial" });
});

slide.addText("Result: Fragmented, ungoverned, invisible AI spend with zero resilience.", {
  x: 0.7, y: 4.9, w: 8.5, h: 0.4,
  fontSize: 13, italic: true, color: TEXT_MUTED, fontFace: "Arial",
});

// ─── Slide 4: The Solution ──────────────────────────────────────────────────
slide = pptx.addSlide();
slide.background = { fill: DARK_BG };
addHeader(slide, "THE SOLUTION");
slide.addText("Centralized AI Governance\nwith Vercel AI Gateway", {
  x: 0.5, y: 0.7, w: 9, h: 0.9,
  fontSize: 24, bold: true, color: TEXT_WHITE, fontFace: "Arial",
});

slide.addText("Architecture:", {
  x: 0.7, y: 1.8, w: 9, h: 0.4,
  fontSize: 12, bold: true, color: TEXT_MUTED, fontFace: "Arial",
});

// Architecture flow
const steps = ["Business App", "Governance Layer", "Vercel AI Gateway", "Provider"];
const colors = [PRIMARY, ACCENT, "8B5CF6", WARNING];
steps.forEach((step, i) => {
  const x = 0.7 + i * 2.4;
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y: 2.3, w: 2.0, h: 0.7,
    fill: { color: colors[i], transparency: 80 },
    line: { color: colors[i], width: 1.5 },
    rectRadius: 0.05,
  });
  slide.addText(step, {
    x, y: 2.3, w: 2.0, h: 0.7,
    fontSize: 11, color: TEXT_WHITE, fontFace: "Arial", align: "center", valign: "middle",
  });
  if (i < steps.length - 1) {
    slide.addText("→", {
      x: x + 2.0, y: 2.3, w: 0.4, h: 0.7,
      fontSize: 16, color: TEXT_MUTED, fontFace: "Arial", align: "center", valign: "middle",
    });
  }
});

const benefits = [
  "One interface for all providers (OpenAI, Anthropic, Google, etc.)",
  "Platform team decides which model each app uses",
  "Automatic failover if a provider goes down",
  "Unified cost tracking and observability",
  "Policy enforcement: PII, data residency, model allowlist",
  "Switch models by changing one config value — zero code changes",
];

benefits.forEach((b, i) => {
  slide.addText(`✓  ${b}`, {
    x: 0.7, y: 3.3 + i * 0.42, w: 8.5, h: 0.4,
    fontSize: 13, color: ACCENT, fontFace: "Arial",
  });
});

// ─── Slide 5: Why Vercel AI Gateway ─────────────────────────────────────────
slide = pptx.addSlide();
slide.background = { fill: DARK_BG };
addHeader(slide, "WHY VERCEL AI GATEWAY");
slide.addText("What Does the Gateway Actually Do?", {
  x: 0.5, y: 0.7, w: 9, h: 0.6,
  fontSize: 24, bold: true, color: TEXT_WHITE, fontFace: "Arial",
});

const gatewayFeatures = [
  ["Provider Abstraction", "One API call for hundreds of models — no separate SDKs"],
  ["Credential Management", "Teams never manage API keys — gateway handles auth centrally"],
  ["Automatic Failover", "Provider goes down → requests auto-reroute to fallback"],
  ["Higher Rate Limits", "Pooled throughput across provider accounts"],
  ["Observability", "Token usage, cost, latency in one dashboard"],
  ["Zero Token Markup", "Same price as going direct to providers"],
  ["Model Switching", "Change one string to switch provider — no code rewrite"],
  ["Sub-20ms Overhead", "Built on Vercel's CDN (trillions of requests/year)"],
];

gatewayFeatures.forEach((f, i) => {
  const y = 1.4 + i * 0.52;
  slide.addText(f[0], { x: 0.7, y, w: 2.8, h: 0.45, fontSize: 12, bold: true, color: PRIMARY, fontFace: "Arial" });
  slide.addText(f[1], { x: 3.5, y, w: 6, h: 0.45, fontSize: 12, color: TEXT_WHITE, fontFace: "Arial" });
});

// ─── Slide 6: Problem → Solution Mapping ────────────────────────────────────
slide = pptx.addSlide();
slide.background = { fill: DARK_BG };
addHeader(slide, "PROBLEM → SOLUTION");
slide.addText("How Gateway Solves Each Problem", {
  x: 0.5, y: 0.7, w: 9, h: 0.6,
  fontSize: 24, bold: true, color: TEXT_WHITE, fontFace: "Arial",
});

const mapping = [
  ["Different SDKs per team", "One generateText() call for any model"],
  ["API keys scattered everywhere", "One centralized credential store"],
  ["Can't switch models", "Change one string — zero code changes"],
  ["No cost visibility", "Unified cost dashboard across all providers"],
  ["Provider outage = app down", "Automatic failover to backup provider"],
  ["Rate limited per provider", "Higher pooled rate limits"],
  ["No data governance", "Gateway-level guardrails & retention policies"],
];

slide.addText("Without Gateway", { x: 0.7, y: 1.4, w: 4, h: 0.4, fontSize: 11, bold: true, color: WARNING, fontFace: "Arial" });
slide.addText("With Gateway", { x: 5.2, y: 1.4, w: 4.5, h: 0.4, fontSize: 11, bold: true, color: ACCENT, fontFace: "Arial" });

mapping.forEach((m, i) => {
  const y = 1.85 + i * 0.55;
  slide.addText(m[0], { x: 0.7, y, w: 4.2, h: 0.45, fontSize: 12, color: TEXT_MUTED, fontFace: "Arial" });
  slide.addText("→", { x: 4.7, y, w: 0.4, h: 0.45, fontSize: 14, color: TEXT_MUTED, fontFace: "Arial", align: "center" });
  slide.addText(m[1], { x: 5.2, y, w: 4.5, h: 0.45, fontSize: 12, color: TEXT_WHITE, fontFace: "Arial" });
});

// ─── Slide 7: Gateway Capabilities ──────────────────────────────────────────
slide = pptx.addSlide();
slide.background = { fill: DARK_BG };
addHeader(slide, "GATEWAY CAPABILITIES");
slide.addText("Full Feature Set", {
  x: 0.5, y: 0.7, w: 9, h: 0.6,
  fontSize: 24, bold: true, color: TEXT_WHITE, fontFace: "Arial",
});

slide.addText("Used in This Demo", { x: 0.7, y: 1.4, w: 4, h: 0.35, fontSize: 11, bold: true, color: ACCENT, fontFace: "Arial" });
const used = [
  "Provider abstraction (one interface, any model)",
  "Model switching (change config, not code)",
  "Automatic failover (try/catch → fallback model)",
  "Multi-provider support (OpenAI + Anthropic)",
];
used.forEach((u, i) => {
  slide.addText(`✓  ${u}`, { x: 0.9, y: 1.8 + i * 0.4, w: 8.5, h: 0.35, fontSize: 12, color: TEXT_WHITE, fontFace: "Arial" });
});

slide.addText("Demonstrated Conceptually (Governance Layer)", { x: 0.7, y: 3.5, w: 6, h: 0.35, fontSize: 11, bold: true, color: PRIMARY, fontFace: "Arial" });
const conceptual = [
  "Cost tracking per request and per application",
  "Per-app observability and task classification",
  "Policy enforcement (PII, residency, allowlist, cost caps)",
];
conceptual.forEach((c, i) => {
  slide.addText(`◆  ${c}`, { x: 0.9, y: 3.9 + i * 0.4, w: 8.5, h: 0.35, fontSize: 12, color: TEXT_WHITE, fontFace: "Arial" });
});

slide.addText("Available in Production (requires billing)", { x: 0.7, y: 5.2, w: 6, h: 0.35, fontSize: 11, bold: true, color: WARNING, fontFace: "Arial" });

// ─── Slide 8: Production Gateway Features ───────────────────────────────────
slide = pptx.addSlide();
slide.background = { fill: DARK_BG };
addHeader(slide, "PRODUCTION FEATURES");
slide.addText("Available with Active AI Gateway Billing", {
  x: 0.5, y: 0.7, w: 9, h: 0.6,
  fontSize: 24, bold: true, color: TEXT_WHITE, fontFace: "Arial",
});

const prodFeatures = [
  ["Built-in Observability", "Native token usage, cost, latency, error rates per request"],
  ["Load Balancing", "Distribute across providers/regions for higher throughput"],
  ["Rate Limit Management", "Automatic queuing and throttling per provider"],
  ["Spend Controls", "Budget caps and alerts at the gateway level"],
  ["Data Retention Policies", "Enforce how long request/response data is stored"],
  ["Image & Video Generation", "Support beyond text — DALL-E, Sora, etc."],
  ["Embeddings & Web Search", "Additional modalities through same interface"],
  ["Zero Markup Pricing", "Provider market rates with no Vercel surcharge"],
];

prodFeatures.forEach((f, i) => {
  const y = 1.4 + i * 0.55;
  slide.addText(f[0], { x: 0.7, y, w: 3, h: 0.45, fontSize: 12, bold: true, color: WARNING, fontFace: "Arial" });
  slide.addText(f[1], { x: 3.7, y, w: 6, h: 0.45, fontSize: 12, color: TEXT_WHITE, fontFace: "Arial" });
});

// ─── Slide 9: Demo Overview ─────────────────────────────────────────────────
slide = pptx.addSlide();
slide.background = { fill: DARK_BG };
addHeader(slide, "DEMO");
slide.addText("Live Demo", {
  x: 0.5, y: 0.7, w: 9, h: 0.6,
  fontSize: 24, bold: true, color: TEXT_WHITE, fontFace: "Arial",
});

slide.addText("What you'll see:", {
  x: 0.7, y: 1.5, w: 9, h: 0.4,
  fontSize: 14, bold: true, color: TEXT_MUTED, fontFace: "Arial",
});

const demoSteps = [
  "Tab 1: AI Applications — Business users submit requests to governed apps",
  "Support Assistant: Mock demo response (no provider cost)",
  "Legal Assistant: Real AI Gateway call (or inactive notice without keys)",
  "Tab 2: Platform Operations — Real-time governance dashboard",
  "Per-app filtering: Click an app to see its governance config",
  "Architecture path: Visual request flow through governance → gateway → provider",
  "Policy enforcement: PII, data residency, cost guardrails tracked per request",
];

demoSteps.forEach((s, i) => {
  slide.addText(`${i + 1}.  ${s}`, {
    x: 0.7, y: 2.1 + i * 0.52, w: 8.8, h: 0.45,
    fontSize: 13, color: TEXT_WHITE, fontFace: "Arial",
  });
});

// ─── Slide 10: Key Takeaway ─────────────────────────────────────────────────
slide = pptx.addSlide();
slide.background = { fill: DARK_BG };
slide.addText("Key Takeaway", {
  x: 0.5, y: 1.2, w: 9, h: 0.6,
  fontSize: 14, color: TEXT_MUTED, fontFace: "Arial",
});
slide.addText("We decide what to call.\nThe Gateway handles how to call it —\nreliably, securely, and with full visibility.", {
  x: 0.8, y: 1.8, w: 8.5, h: 1.8,
  fontSize: 22, bold: true, color: TEXT_WHITE, fontFace: "Arial",
  lineSpacingMultiple: 1.4,
});
slide.addText("Without the gateway, every team manages their own provider SDKs,\ncredentials, failover logic, and observability.\nThat's exactly the fragmentation we're eliminating.", {
  x: 0.8, y: 3.8, w: 8.5, h: 1.2,
  fontSize: 14, color: TEXT_MUTED, fontFace: "Arial",
  lineSpacingMultiple: 1.5,
});

// ─── Save ────────────────────────────────────────────────────────────────────
pptx.writeFile({ fileName: "AI-Governance-Portal-Presentation.pptx" })
  .then(() => console.log("✅ Presentation saved: AI-Governance-Portal-Presentation.pptx"))
  .catch((err) => console.error("Error:", err));
