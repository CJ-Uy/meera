# Meera — "Mound Battle" mode plan

Status: **frontend mockup, hardcoded, no backend.** This doc is both the build plan
and the brief for Codex (asset generation + later wiring). Right now it only has to
*look* the part — the chat does not call any AI yet.

## 1. The idea

Today the student chat has one accessory: the **Case Meter** (a progress ring + a
"build the mound" stack). It works but feels plain. We want the product to feel
unique and fun, so the chat gets a second, optional skin:

**Mound Battle — a Pokémon-style battle screen.**

- The student describes a problem; Meera/MiRA solves it **step by step**.
- Each step is shown as a short **game dialogue** (the AI's response) plus a small
  **multiple-choice** of actions the student can take.
- Picking a **good step** deals damage to the enemy. A step that hits a blocker
  (e.g. a financial hold) deals damage **to you (MiRA)** instead, and Meera then
  offers the real fix.
- **Win:** enemy HP hits 0 → the issue is resolved. Celebration screen.
- **Lose:** MiRA HP hits 0 → Meera escalates and **a ticket is sent to the admin**
  (this maps to our existing admin/ticket flow). Defeat screen.

MiRA = our existing meerkat mascot (hero). The enemy = a new creature that
embodies "the problem / red tape". Meerkats famously face down **cobras**, so the
default boss is a cartoon **cobra** ("the Hold"). Different issue types can later
map to different bosses.

## 2. Two skins, one toggle

The chat's own header (the bar with the MiRA icon) gets a segmented toggle:

| Skin | What it is | State |
| --- | --- | --- |
| **Classic** | The current case-meter chat, visually cleaned up | hardcoded script |
| **Battle** | The Mound Battle arena described above | hardcoded script |

Both are hardcoded mockups. The toggle just swaps the right-hand experience.

## 3. Battle screen anatomy (what the mockup renders)

```
┌───────────────────────────────────────────────┐
│  [ENEMY name + HP bar]              ╭────────╮  │   enemy info top-left,
│                                     │ ENEMY  │  │   sprite top-right
│                                     │ sprite │  │
│   ╭────────╮                        ╰────────╯  │
│   │  MiRA  │            [MiRA name + HP bar]     │   MiRA sprite bottom-left,
│   ╰────────╯                                     │   info bottom-right
├───────────────────────────────────────────────┤
│  ▶  <game dialogue: the AI's current line>      │   Pokémon-style dialogue box
├───────────────────────────────────────────────┤
│  [ choice A ]   [ choice B ]                     │   command box (multiple choice)
│  [ choice C ]   [ choice D ]                     │
└───────────────────────────────────────────────┘
│  > type a reply…                          [→]   │   chat input stays at the bottom
```

- **HP bars:** segmented bar, green > 50%, gold 20–50%, rose < 20%, animated width,
  `HP 72 / 100` readout.
- **Hit feedback:** sprite shake + flash, floating damage number ("-25").
- **Dialogue box:** white, thick rounded border, blinking ▶ caret, narration of each move.
- **Command box:** 2–4 clickable choices. One advances + damages enemy; "wrong" /
  blocked ones damage MiRA. After a blocker, the real fix is revealed as the next move.
- **Win overlay:** `meera-celebrate.png`, "Issue resolved!", reward line, Play again.
- **Lose overlay:** dimmed MiRA, "MiRA fainted…", a ticket card ("#NV-4827 → Registrar"),
  Try again. This is the bridge to the admin app.

### Hardcoded sample quest ("Check my grades / registration hold")
1. *"A wild **HOLD** blocks your grades! First — where do your grades live?"*
   - Open the student portal ✅ (dmg enemy) / Refresh email ❌ (dmg MiRA)
2. *"Log in."* — Enter student ID + password ✅ / Guess the password ❌
3. *"Open **My Grades**."* → triggers the blocker: a **$310 financial hold** blocks the
   page and **hits MiRA**. Meera reveals the real fix.
4. *"Clear the hold."* — Pay the $310 hold ✅ (big dmg) / Ignore and retry ❌
5. *"Final move — load your grades."* — View grades ✅ → **enemy defeated → WIN.**

(Repeated ❌ choices drain MiRA to 0 → **LOSE → ticket to admin.**)

## 4. Assets for Codex to generate

Hero (MiRA) already exists in `public/assets/`:
`meera-avatar.png`, `meera-wave.png`, `meera-celebrate.png`, `meera-clipboard.png`,
`meera-connect.png`, `meera-laptop.png`, `public/assets/meera/meera_icon.svg`.

**Need: the enemy boss sprites.** Default boss = a cartoon **cobra ("The Hold")**.

Style brief — must match MiRA exactly:
- Flat, modern vector cartoon; soft rounded shapes; friendly-but-cheeky villain.
- Warm palette from our tokens: teal `#2E9C8E`, sand `#E79B6B`, gold `#D9A65A`,
  cream `#FBF6EE`, ink `#1C3349`, green `#7FB85C`, rose `#E08769`.
- Transparent PNG, square canvas ~512×512, centered, consistent scale + soft shadow.
- Facing **left** (toward the hero). Same line weight / shading language as `meera-avatar.png`.

Deliver these files into `public/assets/battle/`:
- `cobra-idle.png` — coiled, hood flared, smug. (default state)
- `cobra-attack.png` — lunging / hissing forward.
- `cobra-hurt.png` — recoiling, dizzy.
- `cobra-defeated.png` — knocked out, deflated hood, swirly eyes.

Nice-to-have (optional) MiRA battle poses if we want crisper combat:
- `mira-attack.png` — determined, paw/fist forward.
- `mira-hurt.png` — flinching.
(For now the mockup reuses `meera-avatar.png` / `meera-celebrate.png` and a labelled
placeholder where the cobra sprite will go.)

Later boss variants (not needed for the mockup): `wifi-gremlin`, `lost-password-ghost`,
`server-504-blob` — same style brief.

## 5. Frontend architecture (this repo)

- `src/components/demo/shared.tsx` — shared primitives (Icon, MeerkatMark, IconChip,
  Confidence, Pill, Button, Card, tokens) extracted so student/admin/battle reuse them.
- `src/components/demo/battle.tsx` — the hardcoded `BattleView` (state machine above).
- `src/components/demo/meera-demo-experience.tsx` — now exports **two** experiences:
  `StudentExperience` (landing → chat with the Classic|Battle toggle) and
  `AdminExperience` (Lookout + cross-dept). No shared demo chrome.
- Pages:
  - `/demo` → chooser (Student vs Admin).
  - `/demo/student` → `StudentExperience`.
  - `/demo/admin` → `AdminExperience`.
- Nav cleanup: removed the `· DEMO ·` pill, the Student/Admin toggle, and Reset/Exit.

## 6. Later (real backend, out of scope now)

Drive the battle from the real assistant: each AI troubleshooting step = one move;
tool/STEP success = damage to enemy; detected blocker = damage to MiRA; resolution =
win; escalation = lose + real ticket via the existing admin flow. The battle is a
view layer over the same case state the Classic meter already shows.
