You just implemented GitHub issue #46: Cringe Rizzler: component migration

## Original Requirements
## Summary
Replace standard UI in Cringe Rizzler with `@repo/ui` shared components while preserving custom dark-themed animated blob aesthetic.

## Details
- Replace buttons, cards with `@repo/ui` equivalents
- Keep custom animation code (animated blobs)
- Ensure dark theme tokens are used consistently

## Acceptance Criteria
- [ ] Standard buttons use `@repo/ui` Button
- [ ] Cards use `@repo/ui` Card
- [ ] Custom blob animations preserved
- [ ] Dark theme tokens used consistently
- [ ] `pnpm build` passes

## Code Changes (first 5000 chars)
diff --git a/apps/web/app/apps/cringe-rizzler/about/page.tsx b/apps/web/app/apps/cringe-rizzler/about/page.tsx
index 648bb91..b49e7d4 100644
--- a/apps/web/app/apps/cringe-rizzler/about/page.tsx
+++ b/apps/web/app/apps/cringe-rizzler/about/page.tsx
@@ -1,4 +1,5 @@
 import Link from "next/link";
+import { Card, CardContent, Button } from "@repo/ui";
 
 export const metadata = {
   title: "About Cringe Rizzler — Embarrass Gen Alpha",
@@ -103,50 +104,52 @@ export default function CringeRizzlerAboutPage() {
           Embarrass Gen Alpha.<br />
           One Phrase at a Time.
         </h1>
-        <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
+        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
           AI-powered cringe phrases and memes that weaponize Gen Alpha slang for maximum
           parental embarrassment. No cap fr fr.
         </p>
-        <Link
-          href="/apps/cringe-rizzler"
-          className="inline-block px-8 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 hover:scale-105"
+        <Button
+          asChild
+          className="rounded-xl px-8 py-3 font-bold text-white hover:opacity-90 hover:scale-105 border-0"
           style={{
             background: "linear-gradient(135deg, #ec4899, #a855f7)",
             boxShadow: "0 0 24px rgba(236,72,153,0.4)",
           }}
         >
-          Start the Cringe →
-        </Link>
+          <Link href="/apps/cringe-rizzler">Start the Cringe →</Link>
+        </Button>
       </div>
 
       {/* Features */}
       <section className="space-y-6">
         <div className="text-center">
-          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
+          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
             What it does
           </p>
-          <h2 className="font-heading text-2xl font-bold text-white">
+          <h2 className="font-heading text-2xl font-bold text-foreground">
             Your Dad Joke Arsenal,<br />Gen Alpha Edition
           </h2>
-          <p className="text-white/50 mt-2 text-sm">
+          <p className="text-muted-foreground mt-2 text-sm">
             Tools designed to make your kids cringe so hard they question their life choices.
           </p>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {FEATURES.map((f) => (
-            <div
+            <Card
               key={f.title}
-              className="p-5 rounded-2xl border border-white/8 bg-white/5 backdrop-blur-sm space-y-3 hover:bg-white/8 transition-all"
+              className="glass-sm hover:bg-white/8 transition-all"
             >
-              <div
-                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
-                style={{ background: f.color + "20", border: `1px solid ${f.color}30` }}
-              >
-                {f.icon}
-              </div>
-              <h3 className="font-semibold text-white">{f.title}</h3>
-              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
-            </div>
+              <CardContent className="p-5 space-y-3">
+                <div
+                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
+                  style={{ background: f.color + "20", border: `1px solid ${f.color}30` }}
+                >
+                  {f.icon}
+                </div>
+                <h3 className="font-semibold text-foreground">{f.title}</h3>
+                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
+              </CardContent>
+            </Card>
           ))}
         </div>
       </section>
@@ -154,40 +157,42 @@ export default function CringeRizzlerAboutPage() {
       {/* How it works */}
       <section className="space-y-6">
         <div className="text-center">
-          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
+          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
             How it works
           </p>
-          <h2 className="font-heading text-2xl font-bold text-white">
+          <h2 className="font-heading text-2xl font-bold text-foreground">
             Three Steps to<br />Maximum Embarrassment
           </h2>
-          <p className="text-white/50 mt-2 text-sm">
+          <p className="text-muted-foreground mt-2 text-sm">
             It&apos;s never been easier to ruin your kid&apos;s social standing.
           </p>
         </div>
         <div className="space-y-3">
           {STEPS.map((step, i) => (
-            <div
+            <Card
               key={step.num}
-              className="flex gap-5 p-5 rounded-2xl border border-white/8 bg-white/5 backdrop-blur-sm"
+              className="glass-sm"
             >
-              <div
-                className

## Review Summary
Cringe Rizzler component migration complete — all acceptance criteria met after fixing remaining token inconsistencies

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