# Design prompt — Meera interactive demo pages

> Paste everything in the **PROMPT** block below into Claude Design (huashu-design /
> frontend-design). The sections above the block are notes for you (the human); the
> block itself is self-contained for the design agent.

---

## PROMPT — copy from here ↓

You are designing high-fidelity, production-grade pages for **Meera**, an agentic AI
front door for university support. An existing marketing landing page already defines the
brand and ships three small embedded preview demos. Your job is **not** to touch the
landing page's content — it is to design a new **interactive "Open demo" environment**:
a persistent control nav across the top that switches between fully flushed-out pages, with
the real student/admin page rendering below it.

**Design the pages only. Do NOT build any backend, AI, or real data.** Everything is a
scripted, faked, front-end prototype (see Guardrails). Treat this as a clickable demo whose
job is to *show what the product does* to a hackathon audience.

### 1. The product & the problem it solves

University service desks (IT, Registrar, Health, Student Services, Finance) drown in
repetitive student requests — Wi-Fi/account lockouts, tuition balances, registration holds,
printer outages — arriving as unstructured emails. Staff manually read each one, chase
missing identifiers (student ID, term, device), and log a ticket. Simple requests waste
skilled time; genuinely urgent ones (access failures during exams) wait days.

**Meera is a cross-departmental agent that prioritizes resolution over routing.** It:
- interprets a student's vague/emotional request *without* asking them to pick a department,
- resolves what it can from institutional FAQs (imagine a GraphRAG knowledge base — but for
  this demo the answers are scripted),
- asks targeted follow-up questions only when needed,
- captures identity + structures the issue (identity, issue type, urgency),
- and when a human is required, **auto-creates a high-fidelity, fully-populated ticket**
  routed to the right department — so staff skip intake entirely.

Meera never makes policy decisions or overrides systems; it reduces ticket volume and
improves triage quality. The mascot is a friendly **meerkat** (lookout/sentinel theme).

### 2. Brand system — use these exact tokens

Fonts (already loaded via Google Fonts):
- Display/UI: **Plus Jakarta Sans** (400–800; headings 800, letter-spacing ~-0.03em).
- Mono/labels/eyebrows: **DM Mono** (used for tiny uppercase labels, IDs, metadata, confidence %).

Color tokens (CSS variables; keep these names):
```
--cream:#FBF6EE  --cream-2:#F5ECDD  --cream-3:#EFE4D2  --paper:#FFFFFF
--ink:#1C3349    --ink-2:#33495C    --muted:#6E7E8B    --line:#EAE0D1  --line-2:#E2D6C2
--teal:#2E9C8E (primary)  --teal-600:#26867A  --teal-700:#1E6A60  --teal-050:#E4F1EE  --teal-100:#CDE7E2
--sand:#E79B6B   --sand-600:#D9844F  --sand-050:#FBEADD
--gold:#D9A65A   --gold-050:#F7EBD3
--green:#7FB85C  --green-050:#EAF3E0  --rose:#E08769
--navy-deep:#16293B
--accent:#2E9C8E (tweakable — mirrors --teal by default)
```
Radii: `--r-sm:10px --r-md:16px --r-lg:24px --r-xl:34px --r-pill:999px`.
Shadows: soft, navy-tinted (`--sh-sm/md/lg` already defined). Background is warm cream,
cards are white with `1px solid --line`, generous rounding, soft shadows. Aesthetic =
warm, calm, trustworthy, slightly playful (not corporate-cold, not childish).

Existing reusable primitives (reuse, don't reinvent): `Icon` (24px stroke icons),
`MeerkatMark`/`Logo`, `IconChip` (tinted rounded icon square), `Confidence` (mini
gradient meter teal→green), `.btn`/`.btn-primary`/`.btn-ghost`/`.btn-dark`, `.card`,
`.pill`, `.mono`, `.eyebrow`. Mascot art lives in `assets/`: `meera-avatar`, `meera-wave`,
`meera-laptop`, `meera-connect`, `meera-clipboard`, `meera-celebrate`.

Existing components to evolve into full pages (study them first):
- `MeerorDemo` — on-screen overlay that spotlights real form fields and guides the student.
- `ChatTicketDemo` — chat → diagnostics → auto-created `TicketCard`.
- `DashboardPreview` ("Meera Lookout") — admin queue + AI summary + suggested solution +
  cross-dept dependency banner + recurring issues + KB suggestions.

### 3. The demo shell (control nav + stage)

A new "Open demo" CTA enters a full-screen demo environment with a **persistent top
cockpit** over a swappable **stage**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🦦 Meera   View as: [ Student | IT | Registrar | Health | Student Svcs   │  persona axis
│            | Finance ]                        · DEMO ·  ⟳ reset  ✕ exit   │
├────────────────────────────────────────────────────────────────────────┤
│  Contextual sub-row (changes with persona):                              │
│   Student → Where:[Meera site · Embedded]  How:[Screenshare · Chat ·     │
│             Build the Mound]                                             │
│   Admin   → [Inbox · Cross-dept workflow]                               │
├────────────────────────────────────────────────────────────────────────┤
│                      ← THE FULL PAGE RENDERS HERE →                      │
└────────────────────────────────────────────────────────────────────────┘
```

- **View as** is the primary axis and reads like a product login ("logged in as IT admin").
  The five departments are admin personas; Student is its own persona.
- The **sub-row is contextual**: student personas show Where + How; admin personas show
  Inbox vs Cross-dept workflow. Selecting a tab swaps the stage with a smooth transition.
- Keep a small **· DEMO ·** badge, a **reset** (re-run the current scripted scenario), and
  **exit** (back to landing). The existing floating **Tweaks panel** should still work
  (accent color etc.).

### 4. Student pages — 5 views, one resolution engine

Two context skins × interaction modes. All modes converge on **Resolved** or **Escalated**
(section 4f). Use scripted, auto-advancing-but-replayable flows like the current demos.

**4a. Where = Meera site.** A hosted help destination (`help.northvale.edu · powered by
Meera`). Co-branded header (university wordmark + Meera lockup), a warm greeting from the
meerkat, one large "Describe what's going on…" input, and chips for common issues
("Can't register", "Wi-Fi won't connect", "Tuition hold", "Reset my password"). The whole
page *is* Meera. Calm, spacious, cream background.

**4b. Where = Embedded (Clerk-style).** The university's *own* portal fills the screen
(reuse the navy-sidebar portal chrome from `MeerorDemo`). Meera mounts as a drop-in: a
launcher bubble bottom-right that expands into a chat panel wearing Meera's brand but
floating over the host site. Caption/eyebrow that sells "add Meera to any site in one line —
it wears your brand." Same engine, their chrome.

**4c. How = Screenshare / Meeror.** Full-screen build-out of `MeerorDemo`: a realistic
university portal with Meera **spotlighting the actual element** to act on (scrim + pulsing
teal ring + popup with step title, body, confidence %, step dots). Add a **side rail**
showing "what Meera sees" (a live read of the page state / detected blockers) and the running
confidence meter. Tray actions: switch to Chat, escalate to Human, "this tab only" privacy
note. For the *"let me just show you the screen"* student.

**4d. How = Chat.** Full-height build-out of `ChatTicketDemo`. Flow:
vague/emotional opener → Meera empathizes + asks **targeted follow-ups** → **FAQ answer
cards with citations** (small card: answer + "from IT Knowledge Base · 3 sources" chip) →
a "Running diagnostics" checklist that ticks items (✓/✗ with notes) → **identity prompt**
(email or student ID, with a "this tab only / you control what's shared" reassurance) →
resolution check: **"Did this fix it?  ✓ Yes  ·  Still stuck."** Yes → Resolved; Still
stuck → Escalated.

**4e. How = Build the Mound (gamified, co-op).** Same resolution flow, meerkat skin.
A **mound visual builds in stages as you and Meera clear troubleshooting steps together**:
`dig → stack → reinforce → lookout post on top = solved`. Each step is a small "quest" card
("Confirm your student ID", "Try clearing the hold", "Check your enrollment term");
completing one adds a layer to the mound and a little meerkat pops up to cheer. Tone is
**encouraging but never flippant** (students may be stressed) — and there's a one-tap
**"just chat normally"** escape hatch that drops to the 4d chat. Solved → lookout meerkat on
top + confetti using `meera-celebrate`. Unresolved → the built mound visually "packs down"
into the case package that gets handed off (nice transition into the ticket).

**4f. Convergence — every mode ends one of two ways:**
- **Resolved:** FAQ-sourced fix confirmed → a calm success state (meerkat celebrate, "Glad
  that's sorted", optional "rate this"). No ticket created.
- **Escalated:** Meera first asks for any **missing required fields** (only what's needed),
  then renders the **auto-created ticket** — evolve the existing `TicketCard`:
  `#NV-xxxx · created by Meera · just now`, urgency pill, **AI summary**, **routed-to
  department**, **attempted-by-Meera** steps, **attached context** (screenshot/session),
  **suggested next step**. Student-facing closer: "Handed to the Bursar's Office — you'll
  hear back. Ticket #NV-4827." Show the same ticket is what the admin receives (ties to §5).

### 5. Admin pages — one template, five departments + cross-dept workflow

All admin personas render the **Meera Lookout** dashboard (`DashboardPreview`) reskinned
with that department's sample tickets. Sub-row toggles **Inbox** vs **Cross-dept workflow**.

**5a. Inbox (per department).** Keep the three-pane layout: left rail (resolved-by-Meera %,
recurring issues, KB suggestions) · ticket queue sorted by urgency · detail pane. The
**detail pane is the hero** — it's the AI handoff package:
- AI-generated summary, **Suggested solution** with **`Approve & send` / `Edit` /
  `Escalate`** actions, confidence meter, attempted steps, collected identity/context.
- Seed **department-specific tickets**: IT → VPN drops, printer outage, password reset;
  Registrar → financial-hold blocks registration, enrollment errors, term queries;
  Finance/Bursar → tuition balance, hold clearing; Health → appointment scheduling, doc
  guidance; Student Services → ID access, facilities, general. Same component, different data.

**5b. Cross-dept workflow.** When Meera *or* an admin flags a ticket needs multiple
departments, the existing red **dependency banner** expands into a **proposed ordered
workflow** the lead admin approves:
- A left-to-right **stepper with department avatars + check states**, e.g.
  `1. Finance clears hold → 2. Registrar reopens registration → 3. Meera re-notifies student`,
  each step tagged with **owner department + the action they must take**.
- Lead admin actions: **`Approve workflow` / `Edit steps` / `Reassign owner`**.
- On approve: show the plan **fanning out to each owning department's inbox** as a linked
  sub-task ("You're step 2 — waiting on Finance") with a **shared timeline** so every dept
  sees progress as steps complete. Echo the student's "building one solution together" feel.

### 6. Shared components to reuse / extend
`Icon`, `IconChip`, `Confidence`, `MeerkatMark`/`Logo`, `.btn*`, `.card`, `.pill`, `.mono`,
`.eyebrow`, the navy portal chrome (from `MeerorDemo`), the chat `Bubble`/`Typing`/
`ChecksCard`/`TicketCard`, and the Lookout three-pane shell. New shared pieces you'll
likely add: the **demo cockpit** (persona switcher + contextual sub-row), the **mound
progress** component, the **FAQ citation card**, and the **cross-dept stepper**.

### 7. Guardrails — what to fake / not build
- **No backend, no real AI, no network calls, no auth.** All flows are scripted arrays that
  auto-advance and can replay/reset (mirror the existing `CHAT_SCRIPT` / `MEEROR_STEPS`
  pattern). FAQ answers, diagnostics, tickets, and routing are hand-authored sample data.
- Keep the existing **stack**: React 18 + Babel standalone in the browser, plain JSX files
  loaded from one HTML file, inline styles + the CSS-variable design system. No build step,
  no new dependencies, no TypeScript.
- Keep the floating **Tweaks panel** working; expose at least the accent color and any new
  view-relevant toggles (e.g. a Build-the-Mound on/off, density).
- **Responsive**: must hold up at laptop demo size; degrade gracefully narrower (the cockpit
  sub-row can wrap/scroll). Respect `prefers-reduced-motion`.
- Reuse mascot assets in `assets/`; don't invent a new visual identity. Match the existing
  warmth, rounding, mono-label rhythm, and confidence-meter motif throughout.
- Don't rewrite the marketing landing sections; only change the CTA to **"Open demo"** and
  add the demo environment it opens into.

### 8. Deliverable
Design + build the demo environment as new JSX page/component files in the same style and
file structure as the existing `meera-*.jsx`, wired into the one HTML entry. Provide:
(1) the demo cockpit/shell, (2) the 5 student views + both convergence states, (3) the admin
template with the 5 department datasets, and (4) the cross-dept workflow. Prioritize visual
fidelity and a smooth, demo-ready scripted flow over engineering completeness.

## PROMPT — copy to here ↑

---

## Notes for you (not for the design agent)

- **Decisions locked in this brainstorm:** deliverable = this prompt (you drive the build via
  Claude Design); nav = persona-switcher cockpit (departments folded into the persona list);
  gamified mode = "Build the Mound" co-op; AI layer = UI-only / faked.
- **If Claude Design over-scopes:** have it build the cockpit + Chat + one admin Inbox first
  (the spine), then Screenshare, Embedded, Build the Mound, and Cross-dept workflow as
  follow-ups. Each is independent once the shell exists.
- **Things you may want to decide later:** which university is the demo tenant ("Northvale"
  is the current placeholder), whether Resolved offers a CSAT/rating, and whether the
  Embedded skin should also show an inline (non-bubble) mounted variant.
