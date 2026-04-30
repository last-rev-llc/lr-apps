# Plan: E2E tests for the Slang Translator app

> Seed for `alpha-plan`. Drafted 2026-04-30.

Reuses existing infra: `apps/web/playwright.config.ts`, the `loggedInPage` fixture (`tests/e2e/fixtures/auth.fixture.ts`), and `seedPermission` (`tests/e2e/helpers/db.ts`). Registry: `slug=slang-translator`, `template="minimal"`, `tier="free"`, `auth=true`, `permission="view"`.

## 1. Setup

- **Env vars**: same as Ideas — `E2E_TEST_USER_EMAIL/PASSWORD/ID`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Nothing new.
- **Permissions**: `beforeAll` → `seedPermission(userId, "slang-translator", "view")`; `afterAll` → `deletePermission`. Registry permission is `view`, so `edit`/`admin` are wasted setup.
- **Self-enroll**: do *not* add `slang-translator` to `APP_SELF_ENROLL_SLUGS`. We need the unauthorized path testable.

## 2. Test data strategy (why no helper file)

`template: "minimal"` is real here: **no per-user writes**. The page reads the `slang` table (Gen Alpha rows) and merges with static `data/gen-x-slang.json` (Gen X rows). All interactivity (search, filter pills, translator textarea, quiz) is `useState` only — nothing round-trips.

So **no `tests/e2e/helpers/slang-translator.ts`**. The Ideas-style `seedX`/`listXForUser` pattern doesn't apply because nothing is user-scoped. Test data approach:

- **Trust the seeded `slang` table** for Gen Alpha assertions; target rows whose ids are keys in `lib/gen-x-map.ts` (skibidi, rizz, bussin, sus, slay…) so tests stay valid even if the seed shifts.
- **Static JSON is the stable side** — prefer asserting against Gen X content when stability matters.
- Logic is already covered by unit tests in `app/apps/slang-translator/__tests__/`. E2E covers UI happy paths only.

## 3. Use-case catalog

### Group A — Access & gating (always in scope)

1. Unauth → `/apps/slang-translator` redirects to login
2. Auth without permission → unauthorized page (self-enroll deliberately disabled for this slug)
3. Auth with `view` → page renders Topbar `🗣️ Slang Translator` + `<h1>Slang Translator</h1>`
4. About link → `/apps/slang-translator/about` renders "The Rosetta Stone for Generational Slang"

### Group B — Dictionary tab

5. Default tab is Dictionary; at least one Gen X card visible (static JSON guarantees content)
6. Search filters by term, by alias, and shows empty state `No slang found for that filter combo.` for nonsense input
7. Generation pill `Gen X` → only Gen X cards; `Gen Alpha` → only Gen Alpha cards (skip-if-empty guard for Gen Alpha)
8. Category pill narrows; `N terms found` counter updates
9. Click card → detail modal opens with term/definition/example; Esc + backdrop close it

### Group C — Translator tab

10. Empty input → output shows `Translation appears here…`
11. Unknown text → `No recognized slang terms found.`
12. Known Gen Alpha term (`skibidi`) → output renders bolded `Gnarly / Radical`
13. `⇄ Swap` reverses direction, clears input (per `setInput("")` in handler), swaps labels
14. After swap, known Gen X term translates to Gen Alpha equivalent
15. **XSS guard**: paste `<script>alert(1)</script>` containing a known term; assert `&lt;script&gt;` in output DOM, no execution. Why: `applyTranslationMap` uses `dangerouslySetInnerHTML`, so its escape step is a security invariant worth pinning.

### Group D — Compare & Quiz

16. Compare tab → pair rows render with Gen Alpha + Gen X cards joined by `↔`
17. Quiz `Start Quiz` → first question + 4 option buttons + progress dots render
18. Click option → answer locks (disabled), correct/incorrect styling applied, `Next` appears
19. Complete 10 questions → results screen with score `N/10` and one of `Cross-Gen Master | Bilingual Vibes | Getting There | Generation Gap`. Why shape-based: `buildQuiz` uses `Math.random`, so asserting on a specific score is flaky.

## 4. Spec organization

```
apps/web/tests/e2e/slang-translator/
  access.spec.ts        # A
  dictionary.spec.ts    # B
  translator.spec.ts    # C
  compare-quiz.spec.ts  # D
```

`beforeAll` seeds `view`; `afterAll` removes it. No `afterEach` cleanup — the app writes nothing.

## 5. Selector strategy (do first)

Today the components key off text + emoji + class names. Add minimal `data-testid`s in `components/slang-app.tsx`:

- Tabs: `tab-${dictionary|translator|compare|quiz}`
- Dictionary: `slang-search-input`, `gen-filter-${all|gen-alpha|gen-x}`, `cat-filter-${slug}`, `slang-card`, `slang-detail-modal`, `slang-results-count`
- Translator: `translator-input`, `translator-output`, `translator-swap`
- Quiz: `quiz-start`, `quiz-question`, `quiz-option`, `quiz-next`, `quiz-results-title`, `quiz-results-score`

Avoid binding to emoji copy (`🗣️`, `⇄`) — fragile across font/Unicode renders.

## 6. Running & out of scope

- `pnpm --filter web test:e2e`. No `turbo.json` / `.env.example` changes.
- **Out of scope**: unit-test territory already in `__tests__/` (don't duplicate filter/merge/quiz-builder logic); visual regression; tier gating (`tier: "free"`, no `features` overrides); subdomain routing (covered by `subdomain-routing.spec.ts`).

## Execution order

1. Add `data-testid` hooks (§5) — small PR, no behavior change.
2. `access.spec.ts` (well-trodden gating path).
3. `dictionary.spec.ts` (most surface area).
4. `translator.spec.ts` (includes XSS escape assertion).
5. `compare-quiz.spec.ts` last — Quiz uses `Math.random`, keep assertions shape-based.
