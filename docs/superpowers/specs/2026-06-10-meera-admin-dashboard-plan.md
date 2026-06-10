# Meera Admin Dashboard — Build Plan

## Context

The Meera demo currently bundles the student experience and the admin experience into one 604-line scripted client component ([meera-demo-experience.tsx](src/components/demo/meera-demo-experience.tsx)). The admin side is a static mock: a `Student | Admin` toggle, a sub-bar of **DEPT tabs** + **VIEW tabs** (Inbox/Cross-dept), a left rail of nav items mixed with stat blocks, and a read-only ticket detail. Nothing persists, nothing is editable, and most "pages" (Insights, Knowledge, Routing, Team) are nav labels with no implementation.

We are turning the admin side into a **real, persistent admin dashboard**. The goal: a clean conventional admin shell with a full feature set for triaging Meera's escalated tickets — search/sort/filter, rich ticket detail with chat review, severity + complexity grading, admin-only collaboration threads with "dibs", a knowledge-base ingest loop, a real cross-department workflow, an insights dashboard, and a GraphRAG knowledge-base view with CRUD.

**On the "department dropdown":** the clutter to remove is the old *DEPT tab strip + VIEW tab strip*, not the ability to change department. The top bar keeps a **department dropdown** that swaps the whole dashboard to that department's admin view — this is essential for demoing the cross-department flow (escalate as IT, switch the dropdown to Registrar, see the incoming cross-dept ticket, accept and collaborate from the other side). The old "Inbox / Cross-dept" VIEW tabs go away: cross-dept tickets simply appear in the normal inbox with a badge. Pages are reached via the left nav, not top tabs.

**Decisions locked with the user:**
- **Persistence:** full backend via the repo's existing **adapter architecture** — `getDatabaseAdapter()` with thin Next.js route handlers under `/api/admin/*`. We **extend the existing `DatabaseAdapter`**, not invent a parallel one. **UI is built first** against an in-memory client adapter, then the store is switched to the API adapter — no component rewrites.
- **Default DB mode = shared remote dev** (`APP_ENV=shared`): the team works against the shared dev D1 (`meera-dev-db`) through the deployed shared dev API Worker, so generated tickets/notes/KB are visible to all devs. This means the **`shared-api` adapter must be fully implemented** (not stubbed) and matching **`/internal/admin/*`** typed endpoints must exist (mirroring `/internal/users`). Migrations target the **remote dev** DB (`pnpm db:migrate:dev`).
- **Architecture:** refactor the admin side out of the monolith into a modular `/demo/admin` routed shell backed by a single **client demo store (`useReducer` + Context) with a client-side data adapter interface** (distinct from the server-side `DatabaseAdapter`).
- **Department dropdown** in the top bar swaps the dashboard across departments (to demo cross-dept from both sides); the old DEPT/VIEW tab strips are removed.
- **Graph viz:** interactive library — **React Flow (`@xyflow/react`)** for the knowledge graph (custom styled, clickable nodes).
- **Charts:** **Recharts** for the Insights dashboard.
- **Admin identity:** seeded **"act-as" switcher** (2–3 admins per department, no login flow). Notes, dibs, and cross-dept membership attribute to the acting admin.
- **Phasing:** UI-cleanup first; persistence last. Each phase is independently demo-able.

---

## Pre-flight corrections (from Codex review of the real code)

These are real gaps in the current repo that the build must handle explicitly:

- **Canonical department enum.** Two inconsistent sets exist today: persisted `IT | REG | MED | SS` ([admin-demo-data.ts](src/features/admin/admin-demo-data.ts)) vs UI `it | registrar | health | studsvcs | finance` ([monolith](src/components/demo/meera-demo-experience.tsx)). **Decision:** adopt the 5-dept UI set as canonical (`IT | REG | MED | SS | FIN`), add **Finance** to the persisted model, and define one `DepartmentCode` enum in `src/features/admin/types.ts` reused everywhere. Provide a label map for display.
- **`aic_*` tables don't exist in Drizzle.** `admin-demo-data.ts` queries `aic_knowledge_article` / `aic_support_ticket`, but [schema.ts](src/db/schema.ts) only has `users` and the lone migration doesn't create them (they live only in the separate `meera-admin-demo` D1). P6 must add the admin tables to `schema.ts` + a real migration; a fresh `meera-dev-db` won't have them otherwise.
- **Consolidate the two admin backends.** Retire the standalone admin-demo path ([wrangler.admin-demo.jsonc](wrangler.admin-demo.jsonc), [src/server/admin-demo-cloudflare.ts](src/server/admin-demo-cloudflare.ts) which bypasses the adapter, [/api/admin-demo](src/app/api/admin-demo/route.ts) with permissive CORS) in favor of the single adapter-based `/api/admin/*` path. Do this as an explicit P6 step, not an afterthought.
- **Security on mutations.** `/api/admin-demo` today has open CORS and no auth — do **not** copy that for `/api/admin/*`. Mutations require at minimum the act-as admin id + a server-side CSRF check; `SHARED_API_TOKEN` stays strictly server-side (never shipped to the browser). Auth is demo-scoped (no real login) — note this limitation.
- **Dependencies + SSR.** `@xyflow/react` (React Flow) and `recharts` are not yet in [package.json](package.json). Add them, and render graph/chart components via `dynamic(() => import(...), { ssr: false })` (Next 16 / React 19 / OpenNext) inside a `"use client"` boundary.
- **Typed endpoint contracts.** Each `/api/admin/*` and `/internal/admin/*` endpoint gets a **Zod-validated** request/response contract (repo already uses Zod) so phases can't drift on shapes.
- **State must be shared, not local.** Today `AdminCrossDept` keeps `approved`/`sent` in local `useState` and `switchAdminDept` bumps `resetKey` to remount — so decisions are lost on dept switch. The P0 store must hold cross-dept/accept-reject state **keyed by ticket id**, and the shell must **not remount** the dashboard on department change.

> **Note on sequencing:** Codex suggested moving DB/schema/worker work before the client store. We deliberately keep **UI-first** (P0–P5 on the in-memory source, persistence in P6) per the locked decision — the `AdminDataSource` seam makes this safe. Within P6 the order is schema → migration → adapter methods → `/internal/admin/*` → deploy → `api-source` swap → seed.

## Target Architecture

### Routes (Next.js App Router)
Move admin into its own routed section so the left nav is real navigation and tickets are URL-addressable (needed for deep-linking chat review and for persistence).

```
src/app/demo/page.tsx              # chooser: Student vs Admin (separate pages now)
src/app/demo/student/page.tsx      # StudentExperience (former monolith student flow)
src/app/demo/admin/
  layout.tsx                       # admin shell: topbar + left rail + <AdminStoreProvider>
  page.tsx                         # redirect -> ./inbox
  inbox/page.tsx                   # queue + filters; selecting a ticket -> detail panel/route
  inbox/[ticketId]/page.tsx        # ticket detail (or rendered as a panel within inbox)
  insights/page.tsx
  knowledge/page.tsx
  routing/page.tsx
  team/page.tsx
```

### Feature module
```
src/features/admin/
  types.ts                         # unified DemoTicket, AdminNote, KbNode/KbEdge, CrossDept, Task, Admin
  data/seed.ts                     # extend existing admin-demo-data.ts into full seed
  store/
    admin-store.tsx                # Context provider + useReducer + useAdmin() hook
    reducer.ts                     # pure reducer (all mutations)
    data-source.ts                 # AdminDataSource interface (async, client-side)
    in-memory-source.ts            # Phase 0–5: mutates local seed
    api-source.ts                  # Phase 6: fetches /api/admin/* (thin routes -> getDatabaseAdapter())
  components/
    shell/  TopBar, DeptDropdown, ActAsSwitcher, AccountMenu, LeftRail
    inbox/  InboxQueue, QueueRow, InboxFilters, PriorityMatrix, SearchBar
    ticket/ TicketDetail, AiSummary, SuggestedActions, ChatReview,
            SeverityComplexityControls, EditTicketForm, ResolveControls
    thread/ AdminThread, NoteComposer, DibsButton
    kb/     KbIngestPrompt, KbIngestForm, KnowledgeGraph, KbNodeInspector, KbList
    crossdept/ CrossDeptBadge, EscalateCrossDept, AcceptRejectPanel,
               CollaborationWorkspace, TaskBoard
    insights/ InsightsDashboard + chart cards
```

### Shared types (unify the two existing models)
The lean demo `Ticket` and the richer `DepartmentTicket` ([admin-demo-data.ts](src/features/admin/admin-demo-data.ts)) collapse into one:

```ts
type Severity = "Low" | "Medium" | "High" | "Critical";
type Complexity = "Low" | "Medium" | "High";
type TicketStatus = "New" | "In progress" | "Awaiting student" | "Resolved";

type DemoTicket = {
  id: string; title: string; student: string;         // email
  ownerDept: DepartmentCode; tag: string;
  severity: Severity; complexity: Complexity;          // both AI-set, admin-editable
  status: TicketStatus; createdAt: number;
  aiSummary: string; collectedInformation: string; missingInformation: string;
  suggestedActions: string[]; confidence: number;      // 0–1
  conversation: ChatMessage[];                         // full student<->AI transcript for review
  notes: AdminNote[];                                  // admin-only thread
  claimedBy: string | null;                            // adminId (dibs)
  edited: boolean; kbIngested: boolean;
  cross?: CrossDeptState;
};

type ChatMessage = { role: "student" | "meera"; text: string; at: number };
type AdminNote   = { id: string; adminId: string; text: string; at: number };
type Admin       = { id: string; name: string; dept: DepartmentCode; role: string };

type CrossDeptState = {
  initiatedBy: "ai" | string;                          // "ai" or adminId
  participants: { dept: DepartmentCode; decision: "pending"|"accepted"|"rejected"; reason?: string }[];
  active: boolean;                                     // true once enough accept
  tasks: Task[];
};
type Task = { id: string; title: string; ownerDept: DepartmentCode; assignee?: string;
              status: "todo"|"doing"|"done"; due?: number };

// Knowledge graph
type KbNode = { id: string; dept: DepartmentCode | "shared";
                kind: "faq"|"procedure"|"entity"|"department";
                label: string; body?: string; meta?: Record<string,string> };
type KbEdge = { id: string; from: string; to: string; relation: string };
```

### Client data-source pattern (the key to "UI first, then persistence")
`AdminDataSource` is the **client-side** async interface the store talks to (not to be confused with the server-side `DatabaseAdapter`). The reducer stays pure; the provider calls the data source then dispatches. Phase 0–5 use `in-memory-source` (mutates seed, resolves instantly). Phase 6 drops in `api-source` — which `fetch`es `/api/admin/*`, whose thin routes call `getDatabaseAdapter()`. Zero component changes.

```ts
interface AdminDataSource {
  loadSnapshot(): Promise<{ admins: Admin[]; tickets: DemoTicket[]; kb: { nodes: KbNode[]; edges: KbEdge[] } }>;
  claimTicket(id, adminId): Promise<void>;   releaseTicket(id): Promise<void>;
  addNote(id, note): Promise<void>;
  setSeverity(id, s): Promise<void>;          setComplexity(id, c): Promise<void>;
  updateTicket(id, patch): Promise<void>;     resolveTicket(id): Promise<void>;
  ingestKb(node): Promise<void>;              createKbNode(node, edges): Promise<void>;  deleteKbNode(id): Promise<void>;
  escalateCrossDept(id, depts, by, reason): Promise<void>;
  respondCrossDept(id, dept, decision, reason?): Promise<void>;
  addTask(id, task): Promise<void>;           updateTask(id, taskId, patch): Promise<void>;
}
```

---

## Phase 0 — UI cleanup & shell (no features yet)

**Goal:** the dashboard *looks* like a conventional admin app and the modular skeleton exists.

- Create `src/app/demo/admin/layout.tsx` shell:
  - **TopBar:** Meera mark, **department dropdown** (replaces the DEPT tab row; selecting a department swaps the whole dashboard to that department's admin view — used to demo cross-dept from both sides), **ActAsSwitcher** (which admin within the selected dept you're acting as — drives dibs/notes/cross-dept attribution), spacer, global search, notifications bell, **AccountMenu** at the right. The old "Inbox / Cross-dept" VIEW tabs are removed.
  - **LeftRail:** conventional nav only — **Inbox / Insights / Knowledge / Routing / Team** (active state driven by route). **Remove** the "Resolved by Meera", "Recurring issues", "KB suggestions" blocks from the rail (recurring issues + KB suggestions relocate to Insights/Knowledge pages). Pin the **admin account** (avatar, name, dept, settings, sign-out) to the **bottom** of the rail.
- Stand up the store: `admin-store.tsx`, `reducer.ts`, `adapter.ts`, `in-memory-adapter.ts`, `types.ts`, and extend [admin-demo-data.ts](src/features/admin/admin-demo-data.ts) into `data/seed.ts` (add severity/complexity/conversation/notes/admins; keep the 4 depts IT/REG/MED/SS, add Finance to match current demo's 5).
- Port the existing inbox 3-column layout into `inbox/page.tsx` reading from the store (parity move, no new behavior).
- Reuse existing primitives: `Icon`, `IconChip`, `Pill`, `Confidence`, `Button`, `Card`, design tokens in [globals.css](src/app/globals.css). Keep `Student | Admin` reachable: student demo stays at `/demo` with an "Enter admin" entry.

**Representative files:** `src/app/demo/admin/layout.tsx`, `src/features/admin/store/*`, `src/features/admin/components/shell/*`, `src/features/admin/data/seed.ts`.

---

## Phase 1 — Inbox + Ticket detail

**Inbox queue** (`components/inbox/*`):
- **Search** across id/title/student/summary.
- **Sort**: chronological (newest/oldest), by severity, and **severity + complexity combined** (composite score, e.g. severity weight × complexity weight) — the "high-severity / low-complexity first" quick-win ordering.
- **Filters**: status, tag, claimed/unclaimed, cross-dept, plus a **Priority Matrix** filter — a 4×3 severity×complexity grid; clicking a cell filters to that bucket. Highlight the **high-severity / low-complexity "do-first"** cell.

**Ticket detail** (`components/ticket/*`):
- AI summary, collected/missing info, **suggested actions**, confidence.
- **Chat review**: button opens the full student↔Meera transcript (`ChatReview` modal/side panel) from `ticket.conversation`.
- **Severity & Complexity controls**: dropdowns the admin can override (dispatch `setSeverity`/`setComplexity`).
- **Edit details**: `EditTicketForm` to correct anything the AI got wrong (title/summary/collected info/suggested actions) → `updateTicket`, sets `edited`.
- **Mark resolved**: `ResolveControls` (since all student comms go by email, resolving just closes the ticket) → `resolveTicket`.

---

## Phase 2 — Admin thread, dibs & KB ingest

- **Admin-only thread** (`components/thread/*`): `AdminThread` renders `ticket.notes`; `NoteComposer` adds notes attributed to the acting admin. **Dibs**: `DibsButton` claims/releases (`claimTicket`/`releaseTicket`), showing `claimedBy` in the queue and detail.
- **KB ingest loop** (`components/kb/KbIngestPrompt` + `KbIngestForm`): on a resolved/resolvable ticket, prompt the admin to "Add this to the knowledge base." Opens a form **pre-filled by AI** (proposed question, answer, "ask for", "escalate if", source ticket) for the admin to review/edit/confirm → `ingestKb` creates a `KbNode` (kind `faq`/`procedure`) linked to the dept. Sets `kbIngested`. This is the data that later powers automated responses to similar questions.

---

## Phase 3 — Cross-department flow

**Trigger paths**
1. **AI-initiated**: Meera detects a dependency at escalation and creates a cross-dept ticket targeting 2+ depts. Each targeted dept sees an **Accept / Reject** prompt in its inbox (`AcceptRejectPanel`). Reject = "our dept isn't needed" + reason.
2. **Admin-initiated**: on a single ticket, `EscalateCrossDept` lets an admin convert it to cross-dept, pick other dept(s), and state why. The initiating dept is auto-in; the **other depts still must Accept/Reject**.

**Decision rules** (in reducer `respondCrossDept`):
- A dept **rejects** with a reason; **accepts** to join.
- **Auto-accept-last**: if a rejection would leave exactly one `pending` participant and **zero** `accepted`, that last dept is auto-accepted (ticket can never fall through the cracks).
- Once ≥1 dept (besides initiator) is `accepted` — or auto-accept fires — `active = true`.

**Collaboration workspace** (`CollaborationWorkspace`, shown when `active`):
- The admin thread **expands to all participating depts' admins** — shared notes/comments.
- **TaskBoard**: create tasks, assign to a dept/admin, track `todo/doing/done` (`addTask`/`updateTask`). Evolves the existing read-only `SharedTimeline` into an editable board.
- Cross-dept tickets show a `CrossDeptBadge` in every participating dept's inbox. Ticket resolves when all tasks are `done` or the lead marks resolved.

---

## Phase 4 — Insights dashboard

`components/insights/InsightsDashboard` (Recharts), with a time-window switch (Today / 7d / 30d / Term). Metric cards to build (derive from seeded ticket history):

- **Throughput**: avg first-response time, avg resolution time, tickets opened vs resolved.
- **Auto-resolution**: % resolved by Meera without a human (deflection), escalation rate, reopen rate.
- **Volume**: tickets over time (area), by category/tag (bar), by department.
- **Grading**: severity distribution, complexity distribution, **severity×complexity heatmap**, AI-confidence distribution.
- **Backlog**: open-ticket aging buckets, SLA-breach count, oldest unclaimed.
- **Cross-dept**: count of cross-dept tickets, avg cross-dept resolution time, dept-collaboration frequency.
- **Knowledge**: KB deflection (answered by KB vs escalated), **coverage gaps** (low-confidence/no-article questions → candidates to ingest), most-used articles.
- **Recurring issues**: top recurring topics with trend (relocated from the old left-rail block).
- **Team load**: tickets per admin, claimed vs unclaimed, per-admin avg response.
- **Impact**: estimated staff time saved (resolved × avg handle time).

---

## Phase 5 — Knowledge base (GraphRAG) + CRUD

- **KnowledgeGraph** (`@xyflow/react`): nodes for departments, FAQs, procedures, entities; edges for relations. **Toggle**: *department graph* (default — this admin's dept) vs *whole-system graph* (all depts, color-coded, shared nodes bridging them). Pan/zoom; clicking a node opens `KbNodeInspector`.
- **CRUD**: review current knowledge (FAQs, procedures, entities) via `KbList` + the graph; **add** (manually or accept an AI-ingest candidate from Phase 2 / Insights coverage gaps) and **delete** stale nodes (`createKbNode`/`deleteKbNode`). Edges editable to express relations.
- Seed graph data in `data/seed.ts` (build on the existing per-dept FAQ structure in [admin-demo-data.ts](src/features/admin/admin-demo-data.ts)).

---

## Phase 6 — Persistence (swap data source to real backend)

UI is complete by Phase 5; this phase makes it durable with **no component changes**, reusing the repo's existing adapter architecture (see [docs/architecture/adapters.md](docs/architecture/adapters.md), [overview.md](docs/architecture/overview.md), [shared-dev-onboarding.md](docs/setup/shared-dev-onboarding.md)). Default mode is **shared remote dev** so all devs share the data.

**Request path (shared mode):** browser `api-source.ts` → `/api/admin/*` (thin app route) → `getDatabaseAdapter()` = `SharedApiDatabaseAdapter` → `/internal/admin/*` (deployed dev Worker) → `getDatabaseAdapter()` = `d1` → `meera-dev-db`.

- **Drizzle schema** ([src/db/schema.ts](src/db/schema.ts)): add `admins`, `tickets`, `ticket_messages`, `ticket_notes`, `kb_nodes`, `kb_edges`, `cross_dept_participants`, `tasks`. Align column names with the existing `aic_*` conventions in [admin-demo-data.ts](src/features/admin/admin-demo-data.ts) where practical.
- **Extend `DatabaseAdapter`** ([src/db/types.ts](src/db/types.ts)) with the admin operations (list/get/mutate tickets, notes, kb, cross-dept, tasks). Implement in **all three** adapters — [d1.ts](src/db/adapters/d1.ts), [local-sqlite.ts](src/db/adapters/local-sqlite.ts), and **fully** in [shared-api.ts](src/db/adapters/shared-api.ts) (it's the default, so no stubbing) — and the selector in [src/db/index.ts](src/db/index.ts) picks by `APP_ENV`.
- **Typed internal endpoints** `src/app/internal/admin/*` mirroring [/internal/users](src/app/internal/users/route.ts), guarded by [shared-api-auth](src/server/shared-api-auth.ts), calling `getDatabaseAdapter()` (= `d1` inside the worker). These are served by the shared dev Worker ([cloudflare/shared-dev-api.ts](cloudflare/shared-dev-api.ts), `wrangler.shared-dev-api.jsonc`).
- **Thin app routes** `src/app/api/admin/*` calling `getDatabaseAdapter()` (mirroring [/api/users/route.ts](src/app/api/users/route.ts)). Do **not** import `getCloudflareContext()` directly — go through `getDatabaseAdapter()` / [src/server/cloudflare.ts](src/server/cloudflare.ts).
- **api-source.ts**: implement `AdminDataSource` against the `/api/admin/*` routes; switch the provider from `in-memory-source` to `api-source`.
- **Migrate + deploy + seed**: `pnpm db:generate` → `pnpm db:migrate:dev` (remote `meera-dev-db`) → `pnpm deploy:shared-api` (publish the new `/internal/admin/*` endpoints) → seed dev D1 from `data/seed.ts` so the shared demo opens populated. (`pnpm db:migrate:local` + plain `pnpm dev` remains available as an offline fallback.)

---

## Additional page ideas (Routing & Team)

You asked for ideas on the two pages you were unsure about, plus any extras.

**Routing** — make Meera's triage visible and tunable:
- Routing rules table (keyword/topic → department) the admin can edit.
- **Confidence thresholds**: auto-resolve vs escalate cutoffs, per dept.
- Routing accuracy (correctly routed vs reassigned) + a misroute/reassignment log that feeds future tuning.
- Cross-dept collaboration map (which depts pair up most — chord/sankey).
- Fallback/overflow and coverage rules.

**Team** — the people side of the dept:
- Admin roster (acting dept), roles, online status, current load.
- Dibs overview (who's on what), reassignment controls.
- Per-admin performance (resolved, avg response).
- Coverage schedule / out-of-office.

**Extra pages worth considering** (optional, post-P5): a **Settings** page (dept profile, SLA targets, auto-resolve threshold, email templates), an **Email composer/preview** (since all student comms are email), and an **Audit log**.

---

## Verification

- **Per phase, run the app**: `pnpm dev`, open `/demo/admin`, exercise the phase's features (the `/run` skill or Playwright MCP for click-through). Phases 0–5 run entirely on the in-memory store, no DB needed. Each phase is demo-able on its own.
- **Phase 0**: department dropdown swaps the whole dashboard to another dept; nav routes work; account sits at rail bottom; old DEPT/VIEW tab strips and stat blocks gone.
- **Phase 1**: search/sort (incl. severity+complexity composite) and the priority-matrix filter reorder the queue; chat review opens the transcript; severity/complexity/edit/resolve mutate the ticket and survive navigation within the session.
- **Phase 2**: notes post under the acting admin; dibs shows in queue + detail; KB-ingest creates a node visible in Phase 5's graph.
- **Phase 3 (the marquee demo)**: escalate a ticket cross-dept as IT → switch the **department dropdown to Registrar** → the incoming cross-dept ticket shows an accept/reject prompt → accept → both sides see the shared thread + task board. Rejecting down to the last pending dept auto-accepts.
- **Phase 4**: charts render from seeded history; window switch changes values.
- **Phase 5**: graph toggles dept ↔ whole-system; node click inspects; add/delete reflects in graph + list.
- **Phase 6 (shared remote dev default, `APP_ENV=shared`)**: after `pnpm db:generate` → `pnpm db:migrate:dev` → `pnpm deploy:shared-api` → seed, a ticket/note/KB change made on one machine is visible to **another dev** against the same `meera-dev-db`; reload persists. Offline fallback (`APP_ENV=local`, `pnpm db:migrate:local`) also works. `pnpm build` (OpenNext) passes.
- **Typecheck/test after every phase**: `pnpm typecheck`, `pnpm test`. Add reducer unit tests (pure, easy) and data-source tests, in the style of [src/db/index.test.ts](src/db/index.test.ts) and [meera-demo-experience.test.ts](src/components/demo/meera-demo-experience.test.ts).
