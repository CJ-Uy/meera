# Meera Home Site Design & Build Plan

## 1. Project Summary

Build a polished landing/home site for **Meera**, an AI support companion that helps organizations modernize their service desks.

The site should present Meera as a friendly but enterprise-ready AI support orchestration layer. The goal is to advertise to universities, companies, and business teams that Meera can integrate into existing IT systems and support workflows without requiring them to replace their current tools.

### Core positioning

**Meera is an AI front desk for modern support teams.**

Meera receives messy natural-language requests, understands the concern, attempts safe self-service resolution, collects missing details, and prepares structured escalation packages when human staff support is needed.

### Main tagline

**Support that understands before it routes.**

### Secondary tagline options

- Resolve faster. Escalate smarter.
- A friendly AI layer for your existing support systems.
- From messy requests to ready-to-act tickets.
- Your AI front desk for every support request.

---

## 2. Product Narrative

The landing page should communicate this story:

1. Users do not want to fill out long forms or guess the right department.
2. Support teams waste time reading vague requests, asking for missing details, and manually logging tickets.
3. Meera acts as the intelligent front door.
4. Meera understands the issue, retrieves approved knowledge, guides safe resolution, and escalates only when needed.
5. Staff receive cleaner tickets with context, priority, category, missing details, and suggested next action.
6. Businesses can integrate Meera into their existing tools instead of replacing their current systems.

### One-sentence pitch

**Meera turns unstructured support requests into resolved answers or ready-to-act tickets.**

---

## 3. Target Audience

The home site is aimed at:

- Business decision makers
- IT leaders
- University administrators
- Operations teams
- Helpdesk/service desk managers
- Digital transformation teams
- Microsoft ecosystem users

### What they should believe after visiting the site

- Meera is easy to understand.
- Meera is friendly for end users.
- Meera is practical for staff.
- Meera can plug into existing systems.
- Meera reduces repetitive intake work.
- Meera has clear safety and escalation boundaries.

---

## 4. Brand Personality

Meera should feel:

- **Warm**: approachable and comforting for users.
- **Clear**: easy to understand for non-technical visitors.
- **Capable**: credible enough for enterprise and IT teams.
- **Calm**: not hype-driven or overwhelming.
- **Trustworthy**: transparent about what it can and cannot do.

### Avoid

- Overly childish design
- Overly robotic AI language
- Dark, intimidating enterprise visuals
- Excessive technical jargon
- Making it seem like Meera replaces human staff
- Claims that Meera can approve requests, change records, validate payments, or make policy decisions

---

## 5. Visual Identity

### Design direction

Use a **Friendly Enterprise Garden** aesthetic.

This means:

- Soft cream backgrounds
- Rounded UI cards
- Gentle shadows
- Warm tan and brown mascot visuals
- Green accents from Meera’s grassy base
- Blue accents for enterprise/IT credibility
- Clean modern SaaS-style layouts
- Simple line icons
- Lots of whitespace

The site should feel like a blend of:

- Modern SaaS landing page
- Microsoft Copilot-inspired productivity interface
- Cute mascot-led student support experience
- Clean enterprise service desk dashboard

---

## 6. Color Palette

Use this as the initial design system.

```css
:root {
  --meera-tan: #EFB16D;
  --meera-cream: #FFF8EE;
  --meera-card: #FFFFFF;
  --meera-beige: #F8E4C8;
  --meera-green: #9BCF53;
  --meera-green-dark: #6FA334;
  --meera-brown: #4B2B1F;
  --meera-brown-soft: #7A5036;

  --trust-blue: #3B82F6;
  --trust-blue-soft: #EAF3FF;

  --priority-low: #9CA3AF;
  --priority-normal: #3B82F6;
  --priority-high: #F6B84B;
  --priority-critical: #E85D5D;

  --gray-50: #FAFAFA;
  --gray-100: #F3F4F6;
  --gray-300: #D1D5DB;
  --gray-500: #6B7280;
  --gray-700: #374151;
}
```

### Usage guidance

- Main background: `--meera-cream`
- Main text: `--meera-brown`
- Accent buttons: `--meera-green`
- Enterprise/integration highlights: `--trust-blue`
- Cards: white or cream
- Borders: beige or light gray
- Critical/urgent states: use red sparingly

---

## 7. Typography

Recommended fonts:

- Headings: **Manrope** or **Nunito Sans**
- Body: **Inter**

### Suggested type scale

```css
h1 {
  font-size: clamp(2.5rem, 6vw, 5rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
}

h2 {
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1;
  letter-spacing: -0.04em;
}

h3 {
  font-size: 1.25rem;
  line-height: 1.2;
}

body {
  font-size: 1rem;
  line-height: 1.6;
}
```

### Tone

The copy should be professional, friendly, and concise.

Example tone:

> Meera can help with that. This looks like an IT access issue, and since there is an exam soon, it should be treated as urgent. Let’s try two quick steps first.

Avoid overly playful language like:

> UwU no worries bestie, Meera will fix everything!

The mascot is already cute. The writing should feel dependable.

---

## 8. Mascot Asset System

Use Meera as a functional UI guide, not just decoration.

### Available assets

Place these images in the project under:

```text
/public/assets/meera/
```

Suggested file mapping:

| Asset Filename | Use Case |
|---|---|
| `friendly_meerkat_waving_on_grass_patch.png` | Hero welcome / landing page |
| `curious_meerkat_listening_on_grass.png` | Listening / user sharing concern |
| `thoughtful_meerkat_pondering_ideas.png` | Analyzing / classifying request |
| `curious_meerkat_wonders_why.png` | Asking follow-up questions |
| `meerkat_presenting_checklist_on_tablet.png` | Step-by-step guidance / self-service |
| `friendly_meerkat_with_service_icons.png` | Routing across departments / integrations |
| `cheerful_meerkat_mascot_with_stars.png` | Success / issue resolved |
| `helpful_meerkat_with_support_card.png` | Escalation / structured handoff |
| `3d0b3bd1-6301-4eeb-9662-7f32d29cc991.png` | Original mascot reference |

### Mascot usage rules

Use Meera in:

- Hero section
- Empty states
- Onboarding
- Chat loading states
- Resolution confirmation
- Escalation handoff
- Feature illustrations

Do not overuse Meera in:

- Dense staff dashboards
- Serious warnings
- Legal/policy-heavy sections
- Every single card or button

### Mascot behavior by product state

| Product State | Mascot Treatment |
|---|---|
| Welcome | Meera waves |
| Listening | Meera leans forward with listening cue |
| Thinking | Meera has gears/sparkles |
| Needs detail | Meera has question bubble |
| Giving steps | Meera points to checklist |
| Routing | Meera gestures to department/system icons |
| Resolved | Meera celebrates with checkmark |
| Escalated | Meera calmly holds a clipboard/case file |

---

## 9. UI Component Guidelines

### Buttons

Primary button:

```css
.button-primary {
  background: var(--meera-green);
  color: var(--meera-brown);
  border-radius: 999px;
  padding: 0.85rem 1.25rem;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(75, 43, 31, 0.12);
}
```

Secondary button:

```css
.button-secondary {
  background: rgba(255, 255, 255, 0.7);
  color: var(--meera-brown);
  border: 1px solid var(--meera-beige);
  border-radius: 999px;
  padding: 0.85rem 1.25rem;
  font-weight: 700;
}
```

### Cards

```css
.card {
  background: var(--meera-card);
  border: 1px solid rgba(248, 228, 200, 0.9);
  border-radius: 28px;
  box-shadow: 0 20px 60px rgba(75, 43, 31, 0.08);
}
```

### Chat bubbles

User bubble:

```css
.user-bubble {
  background: #FFFFFF;
  color: var(--gray-700);
  border: 1px solid var(--gray-100);
  border-radius: 20px 20px 6px 20px;
}
```

Meera bubble:

```css
.meera-bubble {
  background: #F3FBE8;
  color: var(--meera-brown);
  border: 1px solid rgba(155, 207, 83, 0.35);
  border-radius: 20px 20px 20px 6px;
}
```

### Priority tags

```css
.priority-low { background: #F3F4F6; color: #6B7280; }
.priority-normal { background: #EAF3FF; color: #2563EB; }
.priority-high { background: #FFF3D6; color: #B7791F; }
.priority-critical { background: #FDECEC; color: #C24141; }
```

---

## 10. Recommended Home Page Structure

Build the homepage as a single polished landing page.

### Section 1: Navbar

#### Purpose

Make the product feel real and navigable.

#### Content

Left:
- Meera logo/avatar
- Wordmark: **Meera**

Center/right nav:
- Product
- How It Works
- Integrations
- Use Cases
- Demo

Right CTA:
- **See Demo**

#### Implementation notes

- Sticky top nav with slight blur
- Cream/white translucent background
- Rounded bottom border or subtle shadow
- Mobile: hamburger or simple stacked menu

---

## 11. Section 2: Hero

### Purpose

Immediately explain the product.

### Layout

Two-column layout.

Left column:
- Eyebrow label
- Main headline
- Supporting copy
- CTA buttons
- Mini trust statement

Right column:
- Meera waving
- Floating chat/demo cards

### Copy

Eyebrow:

> AI support orchestration for modern service teams

Headline:

> Support that understands before it routes.

Subheadline:

> Meera connects to your existing IT and operations systems, resolves common requests, and prepares structured cases when human teams need to step in.

Primary CTA:

> See Meera in action

Secondary CTA:

> View integrations

Mini trust statement:

> Built to support staff, not replace them.

### Hero visual

Create a mock floating UI near Meera:

User message card:

> “I can’t access my account and I have an exam soon.”

Meera process cards:

- Intent detected: IT access issue
- Priority: High
- Next step: Try quick troubleshooting
- Escalation ready if unresolved

### Visual asset

Use:

```text
/public/assets/meera/friendly_meerkat_waving_on_grass_patch.png
```

---

## 12. Section 3: Problem

### Purpose

Show the pain point.

### Headline

> Support teams are buried in messy requests.

### Body

> Requests arrive through emails, chats, forms, and messages. Staff spend time reading vague concerns, asking for missing details, classifying issues, and manually logging tickets before they can even start solving the problem.

### Cards

Card 1:
- Title: Unstructured Requests
- Copy: Users describe issues in their own words, often without department, urgency, or system details.

Card 2:
- Title: Manual Intake
- Copy: Staff repeatedly ask for student IDs, screenshots, device details, payment references, or deadlines.

Card 3:
- Title: Delayed Escalation
- Copy: Urgent issues can get stuck behind routine questions and incomplete tickets.

---

## 13. Section 4: Solution Overview

### Purpose

Explain what Meera does.

### Headline

> Meera turns every request into the next best action.

### Layout

Use a horizontal or vertical workflow.

Workflow steps:

1. **Understand**
   - Meera interprets natural-language concerns, even when vague or emotional.

2. **Classify**
   - Meera identifies the responsible office, category, urgency, and missing details.

3. **Resolve**
   - Meera retrieves approved knowledge and guides safe self-service steps.

4. **Package**
   - If human help is needed, Meera prepares a structured escalation package.

5. **Route**
   - Staff receive a complete, prioritized case inside the connected workflow.

### Visual asset

Use:

```text
/public/assets/meera/thoughtful_meerkat_pondering_ideas.png
```

---

## 14. Section 5: Product Demo Preview

### Purpose

Show how the user-facing and staff-facing experience connect.

### Headline

> One friendly chat. One complete staff handoff.

### Layout

Use three panels.

#### Panel 1: User Chat

Example:

User:

> I paid my tuition already but it still says unpaid.

Meera:

> I can help prepare this for Finance. I won’t validate the payment myself, but I can collect the details staff need to verify it.

#### Panel 2: Meera Analysis

Show structured fields:

```text
Responsible Office: Finance / Billing Support
Category: Payment posting concern
Priority: Normal
Escalation reason: Payment verification requires staff review
Needed details: Student ID, term, payment date, channel, proof of payment
```

#### Panel 3: Staff Ticket

Show a ticket card:

```text
Ticket Title: Tuition payment not reflected
Office: Finance / Billing Support
Priority: Normal
Summary: Student reports payment was made but account still shows unpaid.
Suggested Staff Action: Verify payment record and update student if posting is delayed.
```

### Visual asset

Use:

```text
/public/assets/meera/helpful_meerkat_with_support_card.png
```

---

## 15. Section 6: Integration Promise

### Purpose

Sell the home site’s main business promise.

### Headline

> Works with the systems your teams already use.

### Body

> Meera does not require teams to replace their current tools. It acts as an AI support layer that can connect to knowledge bases, workflows, ticketing systems, email, dashboards, and Microsoft-based automation.

### Integration cards

Include cards for:

- Microsoft Copilot Studio
- Power Automate
- Dataverse
- Microsoft Teams
- SharePoint / Knowledge Base
- Email inbox
- Ticketing systems
- Internal databases

### Visual asset

Use:

```text
/public/assets/meera/friendly_meerkat_with_service_icons.png
```

### Layout idea

Meera in the center with orbiting cards:

```text
             SharePoint KB
                  |
Teams ---- Meera ---- Ticketing System
                  |
             Dataverse
```

---

## 16. Section 7: Use Cases

### Purpose

Show that Meera can apply beyond one department.

### Headline

> Built for support teams across the organization.

### Cards

#### IT Helpdesk

Examples:
- Login issues
- Wi-Fi problems
- Account lockouts
- Software access
- Printer outages

#### Registrar / Academic Operations

Examples:
- Enrollment concerns
- Registration holds
- Transcript requests
- Term status questions

#### Finance / Billing

Examples:
- Tuition balance
- Payment posting
- Proof of payment
- Assessment concerns

#### Campus Health / Medical Admin

Examples:
- Appointment guidance
- Medical certificate requirements
- Clinic access
- Documentation guidance

#### Student Services / General Operations

Examples:
- ID concerns
- Campus access
- Facilities
- General support routing

### Note

If positioning beyond universities, rename the section or add an enterprise row:

- HR Support
- Finance Ops
- Facilities
- Customer Support
- IT Service Management

---

## 17. Section 8: Differentiation

### Purpose

Compare Meera to normal chatbots and static forms.

### Headline

> More than a chatbot. More useful than a form.

### Comparison table

| Basic Form or Chatbot | Meera |
|---|---|
| Makes users pick a department | Understands concerns in natural language |
| Routes immediately | Attempts safe resolution first |
| Collects generic information | Asks only for relevant missing details |
| Produces incomplete tickets | Creates structured escalation packages |
| Has weak context | Includes urgency, category, summary, and attempted steps |
| Feels transactional | Feels like a friendly support companion |

---

## 18. Section 9: Trust and Boundaries

### Purpose

Make Meera feel safe for enterprise, education, and operations settings.

### Headline

> Helpful by default. Careful when it matters.

### Body

> Meera is designed to support human teams, not replace them. It provides safe guidance for common issues and escalates when a request requires approval, verification, policy judgment, sensitive review, or system access.

### Boundary cards

Card 1: Does not approve requests  
Card 2: Does not change official records  
Card 3: Does not validate payments  
Card 4: Does not make medical judgments  
Card 5: Does not override systems  
Card 6: Escalates sensitive or urgent issues

### Visual asset

Use:

```text
/public/assets/meera/curious_meerkat_listening_on_grass.png
```

or

```text
/public/assets/meera/helpful_meerkat_with_support_card.png
```

---

## 19. Section 10: Architecture Preview

### Purpose

Show credibility and data model thinking.

### Headline

> Designed as an agentic support layer.

### Suggested architecture diagram

```text
User Message
   ↓
Meera Orchestrator
   ↓
Intent Classification
   ↓
Knowledge Retrieval
   ↓
Safe Self-Service Guidance
   ↓
Resolution Check
   ↓
Structured Escalation Package
   ↓
Power Automate / Dataverse / Ticketing System
   ↓
Staff Dashboard
```

### Data objects to display

Show these as small cards:

#### Student/User

- Name
- Email
- Student ID or employee ID
- Department/program if relevant

#### Concern

- Original message
- Category
- Responsible office
- System involved
- Urgency reason
- Priority

#### Ticket

- Title
- Summary
- Missing information
- Attempted steps
- Escalation reason
- Suggested staff action
- Status

This section supports the product’s credibility and helps communicate the data model design.

---

## 20. Section 11: Demo CTA

### Purpose

Push visitors to try the prototype.

### Headline

> See how Meera handles real support concerns.

### Body

> Try prompts for account lockouts, payment posting concerns, registration holds, Wi-Fi issues, medical documentation, and ID access.

### CTA buttons

Primary:

> Launch Demo

Secondary:

> View Sample Tickets

### Visual asset

Use:

```text
/public/assets/meera/meerkat_presenting_checklist_on_tablet.png
```

---

## 21. Section 12: Final CTA

### Purpose

End with a clear business pitch.

### Headline

> Make support easier to ask for — and easier to handle.

### Body

> Deploy Meera as your AI support front door and turn messy requests into resolved answers or ready-to-act cases.

### Buttons

- Get Started
- Contact the Team

### Visual asset

Use:

```text
/public/assets/meera/cheerful_meerkat_mascot_with_stars.png
```

---

## 22. Footer

### Include

- Meera logo
- Short product description
- Navigation links
- Team or challenge credit
- Demo link
- Contact link

### Footer copy

> Meera is an AI support companion built to help service teams resolve faster, escalate smarter, and reduce repetitive intake work.

---

## 23. Suggested Page Sections in Order

Use this exact order for the initial build:

1. Navbar
2. Hero
3. Problem
4. Solution Workflow
5. Product Demo Preview
6. Integrations
7. Use Cases
8. Differentiation
9. Trust and Boundaries
10. Architecture Preview
11. Demo CTA
12. Final CTA
13. Footer

---

## 24. Suggested Component Structure

For a React or Next.js build:

```text
/components
  Navbar.tsx
  HeroSection.tsx
  ProblemSection.tsx
  WorkflowSection.tsx
  DemoPreviewSection.tsx
  IntegrationSection.tsx
  UseCasesSection.tsx
  ComparisonSection.tsx
  TrustSection.tsx
  ArchitectureSection.tsx
  DemoCTASection.tsx
  FinalCTASection.tsx
  Footer.tsx
  MeeraImage.tsx
  SectionHeader.tsx
  FeatureCard.tsx
  IntegrationCard.tsx
  PriorityBadge.tsx
  MockChat.tsx
  TicketCard.tsx
```

### Suggested data structure

```ts
type UseCase = {
  title: string;
  description: string;
  examples: string[];
  icon: string;
};

type WorkflowStep = {
  title: string;
  description: string;
};

type Integration = {
  name: string;
  description: string;
  icon: string;
};

type TicketPreview = {
  title: string;
  office: string;
  category: string;
  priority: "Low" | "Normal" | "High" | "Critical";
  summary: string;
  escalationReason: string;
  suggestedAction: string;
};
```

---

## 25. Suggested Microcopy

### Hero badge

> AI-powered support intake

### Integration badge

> No rip-and-replace required

### Trust badge

> Human-in-the-loop by design

### Workflow labels

- Understand
- Classify
- Resolve
- Package
- Route

### Demo sample prompts

- “I can’t connect to the Wi-Fi and I have an exam soon.”
- “I paid my tuition but it still says unpaid.”
- “Why do I have a registration hold?”
- “Can I get a medical certificate for my absence?”
- “My ID is not working at the gate.”

---

## 26. Animation Guidelines

Use subtle animation only.

### Recommended

- Fade-in sections on scroll
- Gentle floating motion for Meera in hero
- Hover lift on cards
- Small pulse on checkmark badge
- Smooth transition for mock chat cards

### Avoid

- Excessive bouncing
- Random sparkles everywhere
- Animations that make the site feel childish
- Motion-heavy sections that distract from the product

---

## 27. Responsive Design

### Desktop

- Two-column hero
- Full workflow row
- Three-panel product demo
- Integration orbit or grid
- Use case cards in 2–3 columns

### Tablet

- Stack hero image under text
- Workflow becomes 2-column cards
- Demo preview becomes vertical panels

### Mobile

- Single-column layout
- Meera image smaller
- CTAs full width
- Cards stacked
- Reduce floating decorative icons

---

## 28. Accessibility Requirements

- All images must have meaningful `alt` text.
- Do not rely on color alone for priority labels.
- Ensure contrast between text and background.
- Use real headings in order: `h1`, `h2`, `h3`.
- Buttons must have clear labels.
- Decorative icons should be marked `aria-hidden="true"` if applicable.
- Avoid text embedded inside images.

### Example image alt text

```html
<img
  src="/assets/meera/friendly_meerkat_waving_on_grass_patch.png"
  alt="Meera the meerkat mascot waving hello"
/>
```

---

## 29. Recommended Tech Notes for Codex

### If using Next.js + Tailwind

Suggested Tailwind theme extensions:

```js
theme: {
  extend: {
    colors: {
      meera: {
        tan: "#EFB16D",
        cream: "#FFF8EE",
        beige: "#F8E4C8",
        green: "#9BCF53",
        brown: "#4B2B1F",
        softBrown: "#7A5036",
      },
      trust: {
        blue: "#3B82F6",
        softBlue: "#EAF3FF",
      },
      priority: {
        low: "#9CA3AF",
        normal: "#3B82F6",
        high: "#F6B84B",
        critical: "#E85D5D",
      }
    },
    borderRadius: {
      "meera": "28px",
    },
    boxShadow: {
      "soft-card": "0 20px 60px rgba(75, 43, 31, 0.08)",
    }
  }
}
```

### Layout container

```css
.container {
  width: min(1120px, calc(100% - 2rem));
  margin-inline: auto;
}
```

---

## 30. Initial Build Checklist

Codex should implement:

- [ ] Landing page with all main sections
- [ ] Responsive navbar
- [ ] Hero with Meera mascot and mock support flow
- [ ] Problem cards
- [ ] Workflow section
- [ ] Demo preview with chat, analysis, and ticket panels
- [ ] Integrations section
- [ ] Use cases grid
- [ ] Comparison table
- [ ] Trust and boundaries section
- [ ] Architecture preview section
- [ ] Final CTA and footer
- [ ] Consistent color palette
- [ ] Mascot assets integrated
- [ ] Responsive mobile layout
- [ ] Accessible image alt text
- [ ] Clean placeholder links for CTAs

---

## 31. Recommended First Prompt to Codex

Use this prompt after placing the assets in `/public/assets/meera/`:

```text
Build a responsive SaaS landing page for Meera, an AI support companion. Use Next.js/React and Tailwind CSS. Follow the design plan in this markdown file. The aesthetic should be friendly enterprise: cream background, rounded cards, warm brown text, green accents, and cute Meera mascot illustrations. Implement the full homepage structure: navbar, hero, problem, workflow, demo preview, integrations, use cases, comparison, trust and boundaries, architecture preview, demo CTA, final CTA, and footer. Use the mascot image assets from /public/assets/meera/. Make the page polished, responsive, accessible, and ready for a competition demo.
```

---

## 32. Final Creative Direction

Meera should feel like:

> A cute AI companion for users, and a serious operations tool for teams.

The homepage should make businesses think:

> “This would be easy to add to our existing support system, and it would immediately reduce repetitive intake work.”
