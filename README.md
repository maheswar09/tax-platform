# TaxFlow — AI-Powered Tax Platform Prototype

A working clickable prototype addressing all 10 challenges from the AI Engineer case study.

## Running locally

```bash
npm install
npm run dev
# → http://localhost:5173
```

## What's real vs. simulated

**Genuinely wired up:**
- Role switching (CPA / Client / Reviewer / Admin / Business Owner / Seasonal Staff) — sidebar nav, breadcrumbs, dashboard content, action permissions, and data scoping all adapt per role
- Return list with real search, filter (stage / type / preparer), sort (urgency / deadline / name), and bulk reassign (select rows → reassign preparer) — state persists in the URL, so back/forward/refresh restore exactly where you left off
- Source document traceability panel — click any field to see the source document, raw value, transformation, and AI confidence, with a doc-type-accurate excerpt (W-2 / 1099-INT / 1099-DIV / 1098 / K-1 each render their actual boxes, not one generic template)
- AI confidence visualization — per-field confidence bars, expandable reasoning, alternative interpretations
- Full field-decision workflow — Verify & Accept, Approve (senior reviewer/admin only), Reject (with required reason), Override (persists the corrected value + audit trail), and Undo (30-second window) all actually mutate state, not just show a toast. Also available as bulk actions (select multiple → bulk verify/approve) in the AI Review Queue
- **State is shared across the whole app, not per-screen.** Field/thread edits live in a `ReturnsDataContext` — approve a field in the AI Review Queue and it's already approved when you open the return detail page, the Dashboard, or Reports. This was a deliberate refactor (see `src/context/ReturnsDataContext.tsx`) so cross-page workflows don't show stale data.
- Role-gated actions — a client sees a read-only explanation and "Ask a Question," not the CPA/reviewer decision buttons
- Field state affordance system — 8 states (AI-extracted, verified, corrected, rejected, client-provided, needs-approval, locked, manual) with consistent color/icon treatment across every screen
- Collaboration threads — internal vs. client-visible toggle, owner-action indicators, linked to specific fields/documents, sending a message actually appends it, threads can be marked resolved/reopened, and "Ask a Question" from a field creates or reuses a linked thread
- Status pipeline — CPA sees 6 stages; client sees simplified 4-stage version
- Dashboard prioritization — "Do These First" surfaces critical+blocked returns with clickable rows and a preparer filter; a client sees "we need something from you" pulled directly from their open threads
- **Tasks** (`/tasks`) — every open blocker, clarification thread, and AI-review item across your returns in one filterable list, owner-labeled and clickable into exact context
- **AI Review Queue** (`/ai-review`) — every reviewable field across all your returns, prioritized (rejected → needs-approval → lowest-confidence first), with the same evidence/approve/reject/override/undo affordances as the return detail, plus "next item" and bulk actions
- **Messages** (`/messages`) — every conversation across your returns, grouped and filterable by open/resolved and by owner
- **Reports** (`/reports`) — real metrics computed from actual data: stage/priority distribution, AI confidence distribution, correction and rejection rates
- **Settings** (`/settings`) — a live roles & permissions matrix generated from the same `permissionsFor()` logic that gates the actual buttons (not a separately-maintained table), plus notification preferences
- Global command palette (⌘K / Ctrl+K, `/`, or the header search icon) — fuzzy-searches returns by client/type/ID, scoped to what that role can see
- Keyboard shortcuts — ⌘1–5 to navigate, `?` for a shortcuts reference, `Esc` to close dialogs
- Missing-document blockers render as an actionable row in the Documents tab, not just a header chip

**Simulated / hardcoded:**
- All data (returns, documents, fields, messages) starts from static mock data in `src/data/mockData.ts` but is held in shared React context — edits are real and consistent across every screen within a session, but reset on page reload (no backend)
- No real auth — role switching is a UI demo
- No real document parsing or OCR — fake traceability data with representative, doc-type-correct excerpts
- No real AI — confidence scores and reasoning are fabricated but representative
- Document viewer shows a text excerpt; no actual PDF rendering
- No loading-skeleton states — all data is synchronous mock data, so there's nothing to load
- Notification bell in the header is decorative — there's no notification data model behind it

## Challenge coverage

| # | Challenge | Where |
|---|-----------|-------|
| 01 | Source Document Traceability | Return detail → click any field → Source panel |
| 02 | Client & CPA Collaboration | Return detail → Messages tab |
| 03 | Where to Start | Switch to Client role → Dashboard |
| 04 | Getting Lost | Breadcrumbs in top bar; field→document→thread linking |
| 05 | Role-Aware Experiences | Role switcher (bottom-left) → observe nav + content shift |
| 06 | Return Status & Progress | Return detail header + status pipeline |
| 07 | Actionable Dashboard | CPA Dashboard → "Do These First" + preparer filter; also Tasks (`/tasks`) for a cross-return list |
| 08 | Clickable vs. Editable | Field legend + per-field state badges across return detail and AI Review Queue |
| 09 | Complexity Made Navigable | Returns list (search/filter/sort, URL-persisted) + section collapse in return detail + ⌘K command palette |
| 10 | Trustworthy AI | Field source panel → confidence bar + reasoning + correction history; AI Review Queue for the cross-return view |

## Beyond the 10 challenges

`UX_SPECIFICATION.md` and `PRODUCT_ARCHITECTURE.md` describe a larger surface than the 10 challenges alone — a full information architecture with Tasks, AI Review Queue, Messages, Reports, and Settings as first-class screens, plus a command palette and keyboard shortcuts. Those are now built (see above) since they directly serve the same trust/navigation/ownership pillars the case study evaluates.

**Deliberately not built**, because they don't serve those pillars and would be scope creep for a prototype: real authentication/onboarding, a standalone cross-return Documents browser (each return's own Documents tab already covers this), team performance metrics beyond what's in Reports, compliance report generation, offline/mobile-specific handling, and a full WCAG audit.

## Key design decisions

**Status language**: CPA and client see different labels for the same stage. "Corrections Needed" (CPA) shows as "Being Prepared" (client) — avoids alarming clients with internal language.

**Traceability first**: Every AI-extracted field is clickable and shows the exact page, section, raw value, and transformation. CPAs should never have to take the software's word for a number.

**Internal vs. external messaging**: A single toggle distinguishes firm-only notes from client-facing messages. Internal messages use dark styling (slate-800 background) to make them visually unmistakable.

**Affordance system**: Eight field states have distinct visual treatment — colors, icons, and micro-badges — consistent across all screens. Locked fields show a lock icon; AI-generated fields show a sparkle icon with a confidence bar; rejected fields show a red ✗ and block progression until corrected or clarified.

**Permissions, not just roles**: Field-level actions are gated by what a role can actually do, not just what they can see. A CPA can verify a clean AI extraction but can't sign off a `needs_approval` field — that requires a reviewer or admin. A client sees the same evidence but only an "Ask a Question" action, never the decision buttons.

**Dashboard action-orientation**: The dashboard leads with "Do These First" (critical + blocked returns) rather than statistics. Numbers are secondary to the decision the preparer needs to make.
