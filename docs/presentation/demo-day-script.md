# Meera — Demo Day Presenter Script

**Event:** KPMG Academic Innovation Challenge 2026 — Demo Day, Microsoft Philippines, June 15, 2026
**Target run time:** ~13 minutes (12 min talk + buffer). Judging criteria: 30% User Interface · 25% Creativity · 25% Data Model Design · 20% Functionality & UX.
**Companion deck:** [meera-deck.html](meera-deck.html) (open in a browser, press `F` for fullscreen, arrow keys to navigate).

**Before you start (checklist):**

- [ ] `pnpm dev` running, `/demo` open in a second browser tab (student view + admin view in separate tabs).
- [ ] `GROQ_API_KEY` set and verified — send one test prompt before going on stage.
- [ ] If demoing desktop overlays live, have `pnpm desktop:dev` running on a Windows machine with another app (e.g., Settings) open. Otherwise use the slide screenshots.
- [ ] Deck open in its own window; demo tabs in another.

> Stage directions are in *italics*. Spoken lines are in plain text. Adjust phrasing to your own voice — the beats and facts are what matter.

---

## Slide 1 — Title (0:00–0:40)

*Deck on title slide. Smile, breathe.*

Good morning! We're here to introduce you to **Meera** — an agentic AI front door for university support.

Every student here has lived this story: it's exam week, the Wi-Fi dies, you email IT… and you wait. Two days later someone replies asking for your student ID and what building you were in. Meera exists so that story never happens again.

---

## Slide 2 — The Problem (0:40–1:40)

University service desks are drowning in repetitive requests — Wi-Fi access, account lockouts, tuition balance questions, registration holds, printer outages. Today these arrive as unstructured emails and forms, and **every single one** needs a staff member to read it, chase missing details, and manually log a ticket.

The result: skilled staff burn hours on intake instead of resolution, and genuinely urgent issues — like losing portal access during enrollment — can wait up to **two days**.

The root cause isn't lazy staff. It's that the *front door* of support is a form, and forms can't think.

---

## Slide 3 — The Idea (1:40–2:30)

Meera replaces that front door with an agent built on one principle: **resolution over routing**.

A student never picks a department. They just describe what's wrong — vague, emotional, typos and all. Meera then produces one of exactly two outcomes:

1. **A safe self-service resolution** — the issue is fixed and no ticket ever exists, or
2. **A structured, staff-ready escalation package** — classified, prioritized, with all the context collected, so staff start at "resolve," never at "intake."

And just as important as what Meera does: what it refuses to do. Meera never approves requests, never changes records, never validates payments, never makes medical judgments. It's a partner to departmental staff, not a replacement.

---

## Slide 4 — How Meera Works (2:30–3:20)

Behind every conversation runs the same agent loop:

**Understand** the natural-language concern → **Classify** the responsible office, urgency, and what's missing → **Resolve** with safe, knowledge-base-backed guidance where possible → **Package** a structured escalation when staff are needed → **Route** it to the right department — or several departments at once.

Five offices are live today: **IT, Registrar, Finance, Medical/Campus Health, and Student Services** — each with its own knowledge base and escalation rules. And this is a real agent: every reply you'll see in this demo is a live LLM call with function calling, not a script.

---

## Slide 5 — Live Demo: the Student Experience (3:20–6:20)

*Switch to the browser, `/demo/student`. The deck slide stays on the 10-prompt list as your safety net — if the live demo fails, walk through the screenshots on slides 5–7 instead.*

This is the student side. Notice what's *not* here: no department dropdown, no form fields. Just a conversation — plus a **case meter** that fills as Meera hears you, researches, diagnoses, and closes the case.

*Run 3–4 of these live; the full 10-prompt functionality matrix is in the appendix and was demonstrated in the submission video:*

1. **"I can't connect to the Wi-Fi and I have an exam soon."** → *Point out:* Meera detects urgency, asks one targeted follow-up, offers safe troubleshooting first — that's a deflected ticket if it works.
2. **"help!! i can't enroll and i think it's because of my tuition?? idk what to do"** → *Point out:* a vague, emotional, cross-department concern. Meera recognizes a registration issue *caused by* a possible payment hold — Registrar **and** Finance — and collects what each office needs.
3. **"Can you just remove the hold on my account?"** → *Point out:* the boundary. Meera refuses to perform a staff-only action, explains why, and escalates with context instead. No system overrides, ever.
4. **"I paid my tuition last week but it still says unpaid."** → *Point out:* Meera collects payment date, channel, and reference number, but never claims to validate the payment — that's Finance staff's call.

*When a ticket is created, show the confirmation.* That ticket — we'll see exactly where it lands in a minute.

You can also just **talk** to Meera — *press the mic button and say a prompt if the room audio allows* — push-to-talk voice input, transcribed by Whisper.

---

## Slide 6 — Battle Mode (6:20–7:40)

*Toggle the view switcher in the chat header from Classic to Battle.*

Now, the part where we admit we had fun. Meera's mascot is **MiRA the meerkat** — and meerkats famously stand up to cobras. So we built **Battle Mode**: the *same* live AI support session, re-skinned as a turn-based battle.

Your problem appears as a boss — each department maps to a different meerkat predator. The AI suggests your next moves as quick-reply buttons, free typing still works, and the enemy's HP **is** your case progress. There are two ways to win: the issue resolves itself — boss defeated — or a ticket gets filed — backup called, staff are on it. Either way the student wins; there is no lose state.

This isn't a gimmick bolted on top. It's the identical agent, identical ticket pipeline — proof that good data modeling lets you put *any* experience on the same engine. And for students, support stops feeling like bureaucracy.

---

## Slide 7 — Beyond the Chat Window: Desktop Overlays (7:40–8:40)

*Slide screenshots, or live on the Windows machine if set up.*

Some problems can't be solved in a chat window — the student is staring at the wrong settings panel and no paragraph of text will fix that.

So Meera also ships as a **desktop assistant**. An Electron app draws transparent, click-through overlays **over any application**: a guiding cursor, arrows, highlights, and instruction bubbles. Meera captures the screen, a multimodal model locates the actual control, and — because single-shot visual grounding is unreliable — we run a **zoom-refine second pass**: crop around the first guess, re-locate at higher resolution, and map back to screen coordinates. All coordinates are normalized 0-to-1, so it works across monitors and resolutions.

The simulator and the AI emit the *same validated command protocol* — one path, fully type-checked at the IPC boundary.

---

## Slide 8 — The Staff Side (8:40–10:00)

*Switch to `/demo/admin`. Pick the IT inbox; find the ticket created during the student demo.*

Here's where Meera's real value lands. Each department gets its own themed workspace, and every ticket arrives **pre-processed**. Open one: an **AI summary**, the **information already collected**, what's **still missing**, **suggested actions**, and a **confidence score** — staff know instantly how much to trust the triage.

Triage itself is visual: the **priority matrix** plots every ticket by severity × complexity, so the critical-and-simple wins get grabbed first. Staff claim tickets, leave internal notes, and move them through a clear status flow.

And when a problem spans offices — that enrollment-blocked-by-tuition case — staff **escalate cross-department**: invite Finance onto the ticket, they accept or reject with a reason, and a shared task board coordinates who does what. Clear ownership, clear boundaries, no forwarded-email chains.

---

## Slide 9 — Knowledge That Compounds (10:00–10:50)

Every resolved ticket is a lesson. With one click, staff **ingest a resolution into the knowledge base**, which is modeled as a **graph** — FAQs, procedures, entities, and departments as nodes, with typed relationships between them. You can literally watch the university's institutional knowledge grow.

The **insights dashboard** closes the loop: ticket volume opened vs. resolved, the severity-complexity heatmap, team load, response and resolution times, the share handled by AI alone — and most importantly, **KB coverage gaps**: clusters of low-confidence tickets that tell you exactly which article to write next. This week's escalation becomes next week's instant answer.

---

## Slide 10 — Data Model Design (10:50–11:50)

*This is a scored criterion — slow down here.*

Everything you just saw sits on a deliberately designed relational schema — nine tables in Drizzle ORM on Cloudflare D1.

The heart is the **tickets** table: beyond title and status, every ticket stores the agent's work product as first-class columns — `aiSummary`, `collectedInformation`, `missingInformation`, `suggestedActions`, and a `confidence` score — plus separate `severity` and `complexity` enums that power the priority matrix. Conversations and staff notes are separate row-per-message tables, so the student transcript and internal discussion never mix.

Cross-department collaboration is a proper **junction table** — ticket × department, with an accept/reject decision and reason — and shared work items live in **tasks**. The knowledge base is **nodes and edges**, not a flat FAQ list, which is what lets Meera reason about relationships like "registration hold *depends on* payment clearance."

One schema serves the student chat, Battle Mode, five admin dashboards, and the analytics — that's the test of a data model: many experiences, zero redesigns.

---

## Slide 11 — Architecture & Trust (11:50–12:40)

The stack: **Next.js 16 + React 19** with Tailwind and shadcn/ui, one codebase that runs in **three targets** — the browser, the **Electron** desktop app, and **Cloudflare Workers** in production, with D1 for data and R2 for files. Runtime-keyed adapters pick the backend per environment, so the same code runs everywhere.

AI inference runs on **Groq** — Llama 3.1 8B for text, Llama 4 Scout when vision is needed, Whisper on Workers AI for voice. Every model call stays **server-side**; the browser never sees a credential. Tool calls are validated before they touch the database or the screen.

And the boundaries are enforced in the system prompt and the tool design, not just promised: no approvals, no record changes, no payment validation, no medical judgments, no system overrides.

---

## Slide 12 — Business Impact (12:40–13:30)

So what does this buy a university?

- **Tickets that never exist.** Safe self-service guidance deflects the repetitive majority — Wi-Fi, lockouts, FAQ-level questions — before they consume staff time.
- **Intake time goes to zero.** Tickets arrive classified, prioritized, and complete. The read-it / chase-details / log-it cycle disappears, and the two-day urgent-issue delay disappears with it.
- **Urgency surfaces instantly.** Severity and deadline awareness means the student locked out during finals jumps the queue automatically.
- **Knowledge compounds.** Resolved tickets feed the KB; coverage-gap analytics tell you what to write next. The system gets cheaper to run every week.
- **It travels.** The same intake pattern — understand, classify, resolve, package, route — fits HR, finance ops, facilities, ITSM. The university is the beachhead, not the ceiling.

Meera reduces ticket volume, raises triage quality, and accelerates resolution — exactly the mandate — while keeping every consequential decision in human hands.

---

## Slide 13 — Close (13:30–14:00)

Support that resolves instead of routes. Staff who start at the solution. Knowledge that compounds. And a student who — for once — might actually *enjoy* asking for help.

We're Team Meera. Scan the QR to try it yourself — and we'd love your questions.

*Hold on the QR slide through Q&A.*

---

## Appendix A — The 10-Prompt Functionality Matrix

Used in the submission video; keep this list handy for Q&A or an extended live demo. Together they cover all five departments, urgency detection, cross-department reasoning, privacy handling, and boundary enforcement.

| # | Prompt | What it demonstrates |
|---|--------|---------------------|
| 1 | "I can't connect to the Wi-Fi and I have an exam soon." | IT · urgency detection · safe troubleshooting first |
| 2 | "My account is locked and I can't log into the LMS." | IT · targeted detail collection (system, error, recovery attempted) |
| 3 | "The library printer charged me but nothing printed." | IT · money involved → must escalate, never refunds |
| 4 | "Why do I have a registration hold? Enlistment closes Friday." | Registrar · deadline awareness · never guesses the hold reason |
| 5 | "I need a transcript for a scholarship application." | Registrar · document intake (type, purpose, deadline, delivery) |
| 6 | "I paid my tuition last week but it still says unpaid." | Finance · collects reference details · never validates payment |
| 7 | "Can I get a medical certificate for my absence last Monday?" | Medical · privacy-aware (no unnecessary health details) |
| 8 | "My ID isn't working at the gate and the guard won't let me in." | Student Services · physical access urgency |
| 9 | "help!! i can't enroll and i think it's because of my tuition?? idk what to do" | Vague + emotional · cross-department (Registrar + Finance) |
| 10 | "Can you just remove the hold on my account?" | Boundary test · refuses staff-only action · escalates with context |

## Appendix B — Likely Q&A

- **"Is the AI real or scripted?"** Real. Student chat and Battle Mode both call `POST /api/ai/chat` → Groq with function calling; tickets are created by a validated `create_support_ticket` tool call. The only scripted thing is nothing — type anything you like.
- **"What about hallucinated policies?"** The system prompt forbids inventing policies, timelines, or contacts; guidance is grounded in the department knowledge base; and anything requiring official records, approvals, or validation is forced down the escalation path by design.
- **"Why Groq / open models?"** Sub-second latency makes the conversation feel live, and it's cheap enough to spend extra calls on quality — e.g., the zoom-refine second pass for visual grounding.
- **"What's Microsoft in the picture?"** The original prototype was built in Copilot Studio; the production architecture integrates with the Microsoft stack (Teams handoffs, SharePoint KB, Power Automate routing, Dataverse records) as the institutional deployment path.
- **"Privacy?"** Meera collects only what the destination department needs, avoids sensitive medical detail by rule, and credentials/model calls never leave the server.
- **"Multi-tenant / other universities?"** Knowledge bases, departments, and escalation rules are data, not code — five departments today, but the schema (`kb_nodes`, `kb_edges`, department enums) is the extension point.
