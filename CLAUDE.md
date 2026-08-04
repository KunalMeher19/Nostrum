# Nostrum · Project Instructions

Luxury olive-oil brand site. Next.js frontend (repo root) + Express/MongoDB backend (`backend/`). Design spec: `NOSTRUM-DESIGN.md` + the `nostrum-design` skill (invoke it for ANY UI work).

## Session protocol (MANDATORY)

### At session start
Read `REMAINING-WORK.md` (repo root) FIRST, before doing any work. It is the single source of truth for:
- what is already built and verified
- what remains, in detail
- what is blocked on the client and why
- decisions made with/for the client (stack choices, deferrals, conventions)

Do this without being asked. Do not re-audit the codebase to rediscover state that file already records.

### At the end of every conversation / completed piece of work
Update `REMAINING-WORK.md` without being asked. Every update must record, in detail:
- what was done this session (files/features, verified how)
- what is left, and what it is waiting on
- any new client decisions, feedback, or constraints received, and the choices made because of them
- anything discovered that changes scope (new blockers, resolved blockers, dead ends)

**Update in place, never append duplicates.** When something already in the file is touched again (reworked, extended, reverted, re-decided), EDIT its existing entry rather than adding a new paragraph or line about the same thing. The revised entry must state: what it was before, what it is now, and why it changed (e.g. "was console-stubbed 2026-08-04; wired to Resend 2026-08-12 after client supplied the API key"). New paragraphs/lines are only for genuinely new items. The goal: one entry per topic that always reads current, with its history compressed inside it — the file must not grow into a repetitive changelog.

Keep its existing structure: §1 blocked-on-client · §2/§3 done-or-actionable work with DONE markers and dates · §4 deferred phase-2 · suggested order of attack · decision log. Convert relative dates to absolute (today is in the environment context). Never lose the fact that something was done; when superseded, fold the old state into the revised entry as its "before".

## Hard project rules
- NEVER use the em-dash character in any user-visible copy (client dislike). Meta titles use "·", prose uses commas/periods.
- All user-visible copy exists in all 5 locale files: `messages/{en,es,ca,it,el}.json`.
- Dark brand pages, white Shop. See the nostrum-design skill for the full design law.
- Google sign-in must never break (it was broken on the client's previous site).
- Email sending is console-stubbed (both `src/lib/auth/mailer.ts` and `backend/src/services/mailer.service.js`) until the client provides a provider; keep new mail flows on that stub pattern.
- Backend tests: `cd backend && npm test` (uses `--runInBand`; running jest directly in parallel races the shared test db).

## Key references
- `REMAINING-WORK.md` — living status tracker (see protocol above)
- `DEPLOY.md` — env vars + launch checklist
- `NOSTRUM-DESIGN.md` — full design/product spec from the client brief
- Order layer swap point: `backend/src/services/orders.service.js` (Shopify-vs-Stripe pending); checkout must create orders through `createOrder()` so confirmation mail fires.
