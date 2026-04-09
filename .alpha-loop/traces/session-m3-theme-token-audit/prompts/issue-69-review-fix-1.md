The code review for issue #69 found problems that need to be fixed.

## Code Review Findings (MUST FIX)

Token migration is incomplete — ~219 Tailwind default palette classes (amber-400, green-500, pink-400, etc.) remain across all 10 consumer apps instead of referencing project theme tokens (accent, green, pill-*, etc.)

- [CRITICAL] (apps/web/app/apps/soccer-training/components/drill-library.tsx) soccer-training has 39 remaining Tailwind default palette classes (green-500, yellow-500, red-500, purple-500, blue-500, pink-500, cyan-500, rose-500, teal-500, orange-500) in drill-library.tsx and training-app.tsx that should use theme tokens (green, yellow, red, pill-0, pill-1, pill-6, pill-7, etc.)
- [CRITICAL] (apps/web/app/apps/hspt-tutor/components/tutor-app.tsx) hspt-tutor has 35 remaining violations — emerald-400/500/600/700, amber-400/500, blue-400, red-400/500, purple-400 classes in tutor-app.tsx should use theme tokens (green, accent, blue, red, pill-0)
- [CRITICAL] (apps/web/app/apps/roblox-dances/components/dance-app.tsx) roblox-dances has 33 remaining violations — pink-400/500/600, yellow-400, green-400/500, blue-300, purple-400/500, red-400/500 classes in dance-app.tsx should use theme tokens (pill-6, yellow, green, blue, pill-0, red)
- [CRITICAL] (apps/web/app/apps/hspt-practice/components/practice-app.tsx) hspt-practice has 25 remaining violations — indigo-400/500/600, emerald-400/500, amber-400/500, red-400/500 classes in practice-app.tsx should use theme tokens
- [CRITICAL] (apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx) cringe-rizzler has 24 remaining violations across about/page.tsx and cringe-app.tsx — pink-400/500/600, violet-400, blue-400, green-400 should use pill-6, pill-8, blue, green theme tokens
- [CRITICAL] (apps/web/app/apps/dad-joke-of-the-day/about/page.tsx) dad-joke-of-the-day has 20 remaining violations in about/page.tsx and joke-viewer.tsx — amber-400/500, violet-400, blue-400, green-400, pink-400, cyan-400 should use accent, pill-8, blue, green, pill-6, pill-7 theme tokens
- [CRITICAL] (apps/web/app/apps/slang-translator/components/slang-app.tsx) slang-translator has 17 remaining violations in slang-app.tsx — amber-400/500, green-400, red-400, blue-400, purple-400 should use accent, green, red, blue, pill-0 theme tokens
- [CRITICAL] (apps/web/app/apps/proper-wine-pour/components/wine-app.tsx) proper-wine-pour has 15 remaining violations — green-400/500, yellow-400/500, orange-400/500, red-400/500 in wine-app.tsx POUR_RATING_COLORS and GuideTab noteColor props should use green, yellow, orange, red theme tokens
- [CRITICAL] (apps/web/app/apps/age-of-apes/) age-of-apes has 7 remaining violations in page.tsx and calculators.ts — amber-400/500, green-400 should use accent, green theme tokens
- [CRITICAL] (apps/web/app/apps/generations/components/slang-dictionary.tsx) generations has 4 remaining violations in slang-dictionary.tsx and slang-quiz.tsx — green-400, amber-400, red-400 should use green, accent, red theme tokens
- [WARNING] (apps/web/app/apps/proper-wine-pour/components/wine-app.tsx) proper-wine-pour gradient still has hardcoded #7f1d1d (dark red) at line 238 and rgba(255,255,255,0.8) shadow at line 241 — should use theme token or CSS variable
- [INFO] (apps/web/app/apps/*/layout.tsx) themeColor metadata values in layout.tsx files use hex — this is expected since the browser meta theme-color API requires literal color values, not CSS variables
- [INFO] (apps/web/app/apps/cringe-rizzler/components/cringe-app.tsx) Canvas API colors (#ffffff, #000000) in cringe-rizzler meme generator are acceptable — Canvas 2D context requires literal color strings
- [INFO] (packages/theme/src/globals.css) Theme infrastructure additions (glass-header, glass-input, glass-overlay utilities, new shadow tokens, brand colors, slate palette, keyframe consolidation) are well-structured and correctly implemented
- [INFO] (apps/web/app/apps/command-center/) Scope exceeded issue #69 — also modified ~30 internal/command-center apps (batch 1 territory from issue #68) in the same branch, which adds noise and makes review harder

Instructions:
1. Address each finding listed above
2. Run tests to make sure nothing is broken
3. Commit your fixes with: git commit -m "fix(#69): address review findings"