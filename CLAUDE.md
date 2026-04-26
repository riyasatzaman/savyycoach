# SavyyCoach — Claude Code Context

This file is loaded by Claude Code on every session. It is the source of truth for how to work on this project. Read this fully before any task.

---

## What this project is

SavyyCoach is a culturally fluent AI texting coach for the South Asian diaspora. It analyzes real conversations, generates better replies, and helps users navigate dating/talking-stage texting.

- **Long-term vision:** see `docs/VISION.md`
- **What we are building right now (V1):** see `docs/V1_SPEC.md`
- **The two are different documents on purpose.** Vision is the north star. V1_SPEC is the build plan. When in doubt about scope, V1_SPEC wins.

---

## What's in V1 (and what is NOT)

### In V1
- Screenshot + paste input with context chips (gender, recipient type)
- Three situation modes: Live convo / Dead chat / Pickup line
- Analysis output (qualitative bands, no fake percentages)
- Reply generation: 1 primary + 2 alternates, with Safe/Balanced/Bold tone control
- Local history (IndexedDB), no auth
- English only

### NOT in V1 (do not build, even if asked)
- Authentication / accounts
- Cloud sync / Supabase
- Bangla, Benglish, Hindi, Urdu, or any non-English output
- Friendship mode (dating/talking-stage only)
- Persona simulator / charisma meter (this is V1.5)
- Gamification, streaks, levels, XP
- Dashboards, deep analytics
- Mobile app (web-first)
- Monetization, paywalls, premium tiers

If a prompt asks for something on the "NOT in V1" list, push back and ask the user to confirm before building.

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Hosting:** Vercel
- **AI:** OpenAI GPT-4o (vision for analysis, text for replies)
- **Storage:** IndexedDB via `idb` package (no backend DB in V1)
- **Validation:** Zod for all API input/output shapes
- **Rate limiting:** Upstash Redis (with in-memory fallback for dev)
- **Package manager:** pnpm

---

## File structure

```
/app                   # Next.js routes
  /page.tsx            # Home (input)
  /result/page.tsx     # Analysis result
  /pickup/page.tsx     # Pickup line tab
  /history/page.tsx    # Local history
  /api
    /analyze/route.ts
    /generate-replies/route.ts
    /pickup-lines/route.ts

/components            # React components, grouped by screen
/lib
  /prompts             # System prompts (versioned, treated as IP)
    /analyze.ts
    /replies.ts
    /pickup.ts
  /openai.ts           # OpenAI client wrapper
  /storage.ts          # IndexedDB layer
  /types.ts            # Shared types (AnalysisJSON, ReplyVariant, etc.)
  /rateLimit.ts

/eval
  /test-cases          # Real conversation test cases for prompt eval
  /runs                # Eval run outputs (gitignored)

/scripts
  /eval-prompts.ts     # Prompt evaluation harness

/docs
  /VISION.md
  /V1_SPEC.md
```

---

## Hard rules

1. **Never expose `OPENAI_API_KEY` client-side.** All OpenAI calls go through `/api/*` routes.
2. **Never commit `.env` or `.env.local`.** They are gitignored — keep it that way.
3. **System prompts live in `/lib/prompts/` and are versioned in git.** Each prompt file exports the prompt as a const. Treat prompt edits like code commits — meaningful messages, no drive-by changes.
4. **Every API route validates input and output with Zod.** No exceptions.
5. **Rate-limit every API route.** Even in V1, even without auth.
6. **No fake percentages or invented psychology terms in output.** Use qualitative bands (Low/Medium/High/Very High). This is a brand rule, enforced in the prompts.
7. **Replies should never be longer than the user's longest natural message in the conversation.** Enforced in the reply generation prompt.
8. **No external UI libraries beyond Tailwind + headlessui (if needed).** Keep dependencies minimal. No Material UI, Chakra, etc.
9. **No client-side state libraries (Redux, Zustand) unless justified.** React state + context is enough for V1.

---

## Build phases (current status)

Update this section as phases complete.

- [x] **Phase 1:** Project skeleton + 4 routes static
- [x] **Phase 2:** Input layer (UI only, no API)
- [ ] **Phase 3a:** Prompt eval harness + analyze prompt
- [ ] **Phase 3b:** `/api/analyze` endpoint
- [ ] **Phase 4:** Result UI wired to analyze
- [ ] **Phase 5:** Reply generation prompt + API + eval
- [ ] **Phase 6:** Reply UI (tone selector, regenerate, save)
- [ ] **Phase 7:** IndexedDB + history screen
- [ ] **Phase 8:** Pickup line tab
- [ ] **Phase 9:** Polish + visual layer
- [ ] **Phase 10:** Private beta

**Do not jump phases.** If asked to skip ahead, push back.

---

## How to work with the user

- The user is a final-year CS student, technically capable, building this with a less-technical friend.
- Prefer concise, direct responses. No excessive hand-holding, no over-explanation.
- When making non-obvious choices, state them in one line. Don't justify at length.
- When something in a request is off-spec or risks scope creep, flag it before building.
- When a prompt is ambiguous, ask one focused question rather than guessing.
- Show file trees and key code, not full file dumps unless asked.

---

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm typecheck    # TS check
pnpm lint         # Lint
pnpm eval         # Run prompt eval harness (added in Phase 3a)
```

---

## Versioning prompts

When editing a system prompt in `/lib/prompts/`:
1. Bump the `VERSION` const at the top of the file
2. Commit with message format: `prompt(analyze): v1.2 — fix friendzone false positives`
3. Run `pnpm eval` and note the change in regression / improvement
