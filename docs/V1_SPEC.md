# SavyyCoach — V1 Build Spec

> **Source of truth for V1 build.** Treat the original brainstorm PDF as the long-term vision; treat this as the V1 implementation plan. Any V1 scope question gets answered against this doc, not the vision doc.

---

## Locked decisions

| Decision | Value |
|---|---|
| Primary user | Diaspora guy, early 20s, dating apps + IG DMs |
| Mode | Dating / talking-stage only |
| Languages | English only (Bangla + Benglish in V1.1) |
| Input | Screenshot upload (multi, max 4) + paste text |
| Output | Analysis JSON + 3 reply variants (1 primary + 2 alternates) |
| Tone control | Safe / Balanced / Bold |
| History | Local-only (IndexedDB), no auth |
| Monetization | Free in V1, no paywall |
| Stack | Next.js 14 + TypeScript + Tailwind + Vercel + GPT-4o |
| Quality target | Quality-first, no fixed timeline |

---

## V1 feature scope

### In V1
1. Screenshot + paste input with context chips (your gender, who they are, situation)
2. Three situation modes: Live convo / Dead chat / Pickup line
3. Analysis output (no fake percentages — Low/Medium/High/Very High bands)
4. Reply generation with Safe/Balanced/Bold tone control
5. Local history with delete + clear all
6. Politeness-vs-interest detection (the South Asian soft-rejection thing)

### Out of V1 (deferred)
- Auth, monetization, Bangla/Benglish, persona mode, friendship mode, simulator, gamification, dashboards, mobile app

---

## Screen-by-screen spec

### Screen 1 — Home / Input

**Top:** Logo + "Read the room" tagline.

**Situation selector (chips, single-select, default Live convo):**
`[Live convo] [Dead chat] [Pickup line]`

**Input zone (changes based on situation):**
- *Live convo / Dead chat:* drop zone for 1–4 screenshots, with "or paste text" toggle that swaps to a textarea (max 3000 chars). Helper text: "Conversation too long? Just paste the last ~20 messages."
- *Pickup line:* small textarea labeled "Tell me about her (optional) — her bio, what you know, what platform" + platform chip `[Hinge] [Bumble] [IG DM] [In person]`.

**Context chips (always visible for Live/Dead, hidden for Pickup):**
- "I am: [Guy] [Girl]" (default Guy)
- "She/he is my: [Match] [Crush] [Situationship] [Ex] [Friend (suspected friendzone)]"

**Primary CTA:** `Read the room` (Live), `Revive this chat` (Dead), `Generate lines` (Pickup).

**Footer:** "Your chats stay on your device. Nothing uploaded, nothing saved to a server." Real differentiator — surface it.

### Screen 2 — Analysis result (Live convo / Dead chat only)

**Verdict block:** one-line read in big text. Below it, recommendation pill: `Pursue` / `Ease off` / `Reset the energy` / `Walk away`.

**Four cards (2x2 grid on desktop, stack on mobile):**
1. **Interest read** — bands, not numbers. Example: "Her interest: Medium. Your interest signal: Very High. The gap is doing damage."
2. **Green flags** — bullet list, max 4. Empty state: "Nothing strong yet."
3. **Red flags** — bullet list, max 4. Empty state: "No red flags. Just calibration issues."
4. **Friendzone signal** — Low/Medium/High + one-line reason. Flag polite-but-not-interested patterns ("haha", "hehe", "tc", excessive emojis without engagement).

**Reply generator section:**
- Tone selector: `[Safe] [Balanced] [Bold]` (default Balanced)
- Primary reply card (prominent): reply + "Why this works" expandable + Copy button
- Two alternate reply cards (smaller): same structure
- Bottom actions: `Regenerate` (same tone) and `Save to history`

**Critical UX:** if verdict is `Walk away` and user picks Bold, show soft warning above replies: *"Heads up — based on the read, Bold here probably backfires. Try Safe or skip the reply altogether."* Don't block. Warn.

### Screen 3 — Pickup line result

5 lines stacked, each with copy button + "why this works" one-liner. `Regenerate all` button. No verdict, no analysis.

### Screen 4 — History

List view, newest first. Each row: timestamp, first 60 chars, verdict tag (color-coded). Tap to reopen full analysis. Bulk select + delete. `Clear all` with confirmation modal.

### What's NOT a screen in V1
No settings page. No onboarding. No about page. No login. Resist all four.

---

## Data model (IndexedDB)

```typescript
type Analysis = {
  id: string;                    // uuid
  createdAt: number;             // unix ms
  situation: 'live' | 'dead' | 'pickup';
  input: {
    type: 'screenshot' | 'paste';
    screenshots?: string[];      // base64
    pastedText?: string;
    userGender: 'guy' | 'girl';
    recipientType: 'match' | 'crush' | 'situationship' | 'ex' | 'friendzone_suspect';
  };
  analysisResult: AnalysisJSON;
  replies: {
    tone: 'safe' | 'balanced' | 'bold';
    generated: ReplyVariant[];   // append-only across regenerations
  }[];
};
```

Use the `idb` npm package. 50-item cap with "oldest auto-deleted" notice. Store screenshots as base64 — fine for V1, optimize later.

---

## API architecture

Two Next.js API routes. Both server-side (never expose OpenAI key client-side).

- **`POST /api/analyze`** — accepts `{ screenshots[], pastedText, userGender, recipientType, situation }`, returns `AnalysisJSON`. Vision call. ~$0.02–0.05/call.
- **`POST /api/generate-replies`** — accepts `{ analysisJSON, tone, situation, userGender, recipientType }`, returns 3 reply variants. Text call. ~$0.005/call.
- **`POST /api/pickup-lines`** — accepts `{ platform, bio? }`, returns 5 lines.

**Why split analyze and generate-replies:** users will change tone or regenerate replies multiple times per conversation. Don't make them pay for re-analysis.

**Rate limiting from day one:** even without auth, rate-limit by IP. Vision calls are expensive — abuse will burn through your OpenAI credit fast. Use Upstash Redis (free tier). Cap ~20 analyses/day/IP for V1.

---

## Build order

1. Next.js skeleton + Tailwind + 4 routes (Home, Result, Pickup, History) all static
2. Input layer — screenshot upload, paste mode, context chips, situation chips. Pure UI.
3. **`/api/analyze` endpoint + system prompt v1.** Test with 30 real screenshots before touching UI. Iterate prompt until output is consistently good.
4. Wire result UI to analysis JSON
5. **`/api/generate-replies` endpoint + system prompt v1.** Same approach — test against analysis outputs from step 3 before UI.
6. Reply UI — tone selector, copy, regenerate, save
7. IndexedDB layer + history screen
8. Pickup line tab
9. Polish pass — loading/empty/error states + desi visual layer
10. Private beta — 20 users, watch session recordings (PostHog free), tune prompts

**Steps 3 and 5 are 60% of the product quality.** Spend disproportionate time there.

---

# V1.5 Roadmap — Persona Mode (build after V1 ships + has 50 users)

## Approach: post-conversation feedback, not real-time meter

User chats freely with a persona. After 10+ exchanges (or "End conversation" tap), they get a coaching breakdown. No real-time scoring. Sidesteps the gimmicky-meter trap and makes the AI eval problem tractable.

## Persona library (ship with 4)

Each persona needs a 500-word character bible.

1. **Aisha** — 23, MBA student in Toronto, sarcastic, hard to impress, well-read. Tests banter.
2. **Priya** — 22, undergrad, warm and chatty, easily bored. Tests holding attention.
3. **Zara** — 25, working professional, direct, busy. Tests confidence and clarity.
4. **Mehek** — 24, artsy, indirect, expects emotional intelligence. Tests reading between lines.

Each persona has: backstory, opening message, hard limits (will leave the chat if user is creepy/persistent), interests, dealbreakers, "what makes them open up."

## Conversation flow

1. User picks persona + scenario (cold IG DM / matched on Hinge / mutual friend introduction / coffee shop)
2. Persona sends opening message
3. User and persona chat freely (no reply suggestions — this is practice)
4. Persona behaves consistently — pulls back if user is thirsty, leans in if user is sharp
5. After 10 exchanges OR user taps "End": coaching breakdown screen

## Coaching breakdown screen

- **Overall read:** 1–2 sentences
- **What worked:** 2–4 specific moments quoted, with why
- **What fumbled:** 2–4 specific moments quoted, with why and a better alternative
- **Charisma read (qualitative bands, not numbers):** Wit, Restraint, Cultural calibration, Confidence — each Low/Medium/High
- **Verdict:** "Aisha would probably reply tomorrow." / "Aisha is leaving you on read." / "Aisha would meet up."

## V1.5 explicitly doesn't have

No levels, XP, streaks, or unlockable personas. Add gamification later if retention proves out.

---

# System Prompt Architecture

> The prompt IS the product. Version these in your repo. Treat prompt edits like code commits.

## Analysis prompt (Call 1)

```
You are an analyst for a texting coach app. Your job is to read a 
conversation between a user and someone they're talking to romantically, 
and return a structured read of the dynamic.

CONTEXT:
- The user is a [USER_GENDER] in their early 20s, South Asian diaspora.
- The other person is their [RECIPIENT_TYPE].
- Situation: [SITUATION] (live conversation / dead chat).

YOUR JOB:
Read the transcript. Identify:
1. Who's more interested, and by how much.
2. Whether the user is overplaying their hand (texting too much, too 
   eager, asking too many questions, double-texting, over-explaining).
3. Whether the other person is showing real interest or polite-but-
   distant engagement. Be especially careful with South Asian politeness 
   patterns: "haha", "hehe", "tc", "thik ache", excessive emojis without 
   substance, late one-word replies, and "lol" as a conversation closer 
   often signal disinterest, not warmth.
4. Friendzone signals: do they redirect flirty energy to platonic 
   territory? Mention other guys casually? Reference the user as "bro" 
   or equivalent?
5. Red flags (the user being chased away, the other person being 
   unavailable / inconsistent / love-bombing) and green flags (genuine 
   curiosity, asking questions back, initiating, callbacks to earlier 
   topics, vulnerability).

VOICE:
- Direct. No therapy-speak. No "it's complicated" hedging.
- Culturally fluent — you understand desi diaspora dating dynamics, 
  family pressure subtext, the difference between flirty teasing and 
  real interest.
- Honest. If the user is being delusional about interest, say so 
  kindly but clearly.

RULES:
- Never use exact percentages. Use bands: Low / Medium / High / Very High.
- Never use fake psychology terms (real terms like "breadcrumbing" or 
  "love-bombing" are okay; invented labels are not).
- The "verdict.recommendation" must be one of: pursue, ease_off, 
  reset_energy, walk_away.
- If the conversation is ambiguous (under 5 messages, no clear 
  signals), say so honestly rather than inventing a read.

OUTPUT FORMAT (strict JSON, no other text):
{
  "transcript_summary": "2-sentence summary of what's happening",
  "interest_read": {
    "their_interest": "low|medium|high|very_high",
    "user_interest_signal": "low|medium|high|very_high",
    "imbalance_note": "1 sentence on the gap, or empty if balanced"
  },
  "politeness_vs_interest": {
    "flag": true|false,
    "reason": "1 sentence — only if flag is true"
  },
  "green_flags": ["...", "..."],
  "red_flags": ["...", "..."],
  "friendzone_signal": {
    "level": "low|medium|high",
    "reason": "1 sentence"
  },
  "verdict": {
    "headline": "one-line read, max 15 words",
    "recommendation": "pursue|ease_off|reset_energy|walk_away",
    "reasoning": "2-3 sentences"
  }
}

[For screenshot input: extract the conversation from the images first. 
The user is the one identified by USER_GENDER and the side you can 
infer from the screenshot layout.]
```

## Reply generation prompt (Call 2)

```
You are a texting coach generating reply suggestions for a South Asian 
diaspora user (early 20s, [USER_GENDER]) talking to their [RECIPIENT_TYPE].

CONTEXT YOU HAVE:
- The full conversation transcript
- A read of the dynamic (provided as JSON)
- The user wants tone: [TONE]

TONE DEFINITIONS:
- SAFE: low effort, casual, plausibly deniable. Easy to send. Won't 
  embarrass. Often shorter than the user expects.
- BALANCED: confident, warm, slight tease. Clearly engaged but not 
  thirsty. The default sweet spot.
- BOLD: direct, flirty, takes a swing. Only generates well if the 
  read supports it.

VOICE:
- Sound like a desi diaspora 20-something who actually knows what 
  they're doing. Not Western pickup-artist. Not Bollywood-cheesy. 
  Not generic ChatGPT-flirty.
- Restraint > effort. Charisma is what you DON'T say.
- Specific > generic. Reference something real from the conversation.
- Cultural fluency shows up subtly: knowing when to pull back, 
  knowing what "haha" means, knowing not to over-explain.

HARD RULES:
- Never suggest manipulation, negging, jealousy plays, or persistence 
  after disinterest.
- Never use cringe phrases: "hey beautiful", "hey gorgeous", "milady", 
  "princess" (unironically), "your eyes", "sweetheart".
- Never use shayari / poetry quotes unless the conversation already 
  established that vibe.
- Never write replies longer than the user's longest natural message. 
  If they text in 1 line, you reply in 1 line.
- If verdict was "walk_away" and tone is "BOLD", still generate the 
  reply but include a tone_warning in the response.

OUTPUT FORMAT (strict JSON, no other text):
{
  "primary": {
    "text": "the reply",
    "why_it_works": "1 sentence — what this reply is doing"
  },
  "alternate_1": { "text": "...", "why_it_works": "..." },
  "alternate_2": { "text": "...", "why_it_works": "..." },
  "tone_warning": "string or null"
}

GENERATE 3 DISTINCT REPLIES. Distinct = different angles, not 
different wordings of the same line.
```

## Pickup line prompt (Call 3)

```
You are generating cold opener lines for a South Asian diaspora user 
texting on [PLATFORM]. Optional context about the recipient: [BIO].

VOICE:
- Witty, specific when possible, never generic.
- South Asian diaspora-fluent — references that land for someone in 
  Toronto, NYC, London, Sydney with desi roots.
- Never cringe. Never "are you a magician because..."
- Hinge openers should reference something specific if a bio was 
  provided. IG DMs should be lower-effort and more curious. In-person 
  follow-ups should reference the meeting.

HARD RULES:
- No religious or family pressure references.
- No body-comment openers.
- No "negging".
- 5 distinct lines. Distinct = different angles, not rewordings.

OUTPUT (strict JSON):
{
  "lines": [
    { "text": "...", "why_it_works": "..." }
  ]
}
```

## Prompt iteration plan

1. Build a test set: 30 real conversation screenshots/transcripts (your own + friends'). Cover: clearly-interested, clearly-uninterested, ambiguous, dead chats, friendzone, ex situations, fresh matches.
2. Run analysis prompt on all 30. Hand-grade outputs. 80%+ accuracy = ship-ready.
3. Same for reply generation across all 3 tones.
4. Version prompts in your repo. Treat prompt edits like code commits.

---

## Open decisions (not blocking V1, but soon)

1. **App name** — still TBD. Worth a separate session.
2. **Conversation length cap UX** — when user uploads a 10-screenshot novel, do you truncate from the top or ask them to pick the relevant section?
3. **The "walk_away" reply UX** — generate replies anyway behind a click-through, or hide replies entirely? Recommendation: lead with verdict, "Show me replies anyway" button.
4. **Visual layer timing** — when in the build order do you bring in the desi-aesthetic poster influence? Recommendation: step 9, after functional V1 works end-to-end.
