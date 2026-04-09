You just implemented GitHub issue #40: Dad Joke of the Day: component migration

## Original Requirements
## Summary
Replace inline UI in Dad Joke of the Day with `@repo/ui` shared components.

## Details
- Replace joke cards with shared Card component
- Replace category pills with shared Badge
- Replace joke viewer UI with shared components

## Acceptance Criteria
- [ ] Joke cards use `@repo/ui` Card
- [ ] Category pills use `@repo/ui` Badge
- [ ] Joke viewer uses shared components
- [ ] `pnpm build` passes

## Code Changes (first 5000 chars)
diff --git a/apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx b/apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx
index 117f3b6..6c1f1fc 100644
--- a/apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx
+++ b/apps/web/app/apps/dad-joke-of-the-day/components/joke-viewer.tsx
@@ -144,28 +144,40 @@ export function JokeViewer({ jokes, initialJoke, categories }: JokeViewerProps)
       {/* Category filter */}
       <div className="flex flex-wrap gap-2 justify-center">
         <button
+          type="button"
           onClick={() => handleCategoryChange("all")}
-          className={[
-            "px-3 py-1 rounded-full text-sm border transition-colors",
-            selectedCategory === "all"
-              ? "border-amber-400 bg-amber-400/10 text-amber-400"
-              : "border-white/10 text-muted-foreground hover:border-white/30",
-          ].join(" ")}
+          className="focus:outline-none"
         >
-          All
+          <Badge
+            variant="outline"
+            className={[
+              "cursor-pointer rounded-full transition-colors",
+              selectedCategory === "all"
+                ? "border-amber-400 bg-amber-400/10 text-amber-400"
+                : "border-white/10 text-muted-foreground hover:border-white/30",
+            ].join(" ")}
+          >
+            All
+          </Badge>
         </button>
         {categories.map((cat) => (
           <button
             key={cat}
+            type="button"
             onClick={() => handleCategoryChange(cat)}
-            className={[
-              "px-3 py-1 rounded-full text-sm border transition-colors",
-              selectedCategory === cat
-                ? "border-amber-400 bg-amber-400/10 text-amber-400"
-                : "border-white/10 text-muted-foreground hover:border-white/30",
-            ].join(" ")}
+            className="focus:outline-none"
           >
-            {cat}
+            <Badge
+              variant="outline"
+              className={[
+                "cursor-pointer rounded-full transition-colors",
+                selectedCategory === cat
+                  ? "border-amber-400 bg-amber-400/10 text-amber-400"
+                  : "border-white/10 text-muted-foreground hover:border-white/30",
+              ].join(" ")}
+            >
+              {cat}
+            </Badge>
           </button>
         ))}
       </div>
@@ -203,15 +215,17 @@ export function JokeViewer({ jokes, initialJoke, categories }: JokeViewerProps)
                   </p>
                   <div className="flex flex-wrap gap-2 justify-center">
                     {RATINGS.map(({ key, emoji, label }) => (
-                      <button
+                      <Button
                         key={key}
+                        variant="outline"
+                        size="icon"
                         title={label}
                         onClick={() => rateJoke(key)}
                         disabled={ratingSubmitting}
-                        className="text-2xl p-2 rounded-xl border-2 border-white/10 bg-white/5 hover:border-amber-400 hover:scale-110 transition-all disabled:opacity-50"
+                        className="text-2xl h-11 w-11 rounded-xl border-2 border-white/10 bg-white/5 hover:border-amber-400 hover:scale-110 transition-all"
                       >
                         {emoji}
-                      </button>
+                      </Button>
                     ))}
                   </div>
                 </div>

## Review Summary
Component migration complete — Badge, Button, Card all wired from @repo/ui; fixed a11y regression where clickable Badge (div) replaced original button elements

Analyze the implementation and list any assumptions or decisions you had to make where the requirements were ambiguous or incomplete. Output ONLY a markdown document with this structure:

## Assumptions
- (list each assumption made, e.g. "Assumed the date format should be ISO 8601 since it wasn't specified")
- If no assumptions were needed, write "None — requirements were fully specified"

## Decisions
- (list each design/implementation decision where multiple valid approaches existed, e.g. "Chose to validate on the server side rather than client side for security")
- If no notable decisions, write "None — implementation was straightforward"

## Items to Validate
- (list specific things the user should check, e.g. "Verify the error message wording matches your team's style guide")
- If nothing needs validation, write "None"

Keep it concise. Only include genuinely ambiguous items, not obvious implementation choices.