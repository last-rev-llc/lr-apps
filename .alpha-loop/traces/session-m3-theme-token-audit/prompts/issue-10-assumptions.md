You just implemented GitHub issue #10: Standardize glass/shadow/animation usage

## Original Requirements
## Summary
Replace inline glass effects, shadows, and animations with shared theme utilities across all apps.

## Acceptance Criteria
- [ ] All inline glass effects replaced with `glass`, `glass-sm`, `glass-strong` utilities
- [ ] All inline shadows replaced with theme shadow tokens (`shadow-glass`, `shadow-glass-sm`, `shadow-glow`)
- [ ] All inline animations replaced with `animate-fade-in-up`, `animate-scale-in` utilities
- [ ] No duplicate glass/shadow/animation definitions remain in app-level CSS
- [ ] Build passes with no TypeScript errors

## Code Changes (first 5000 chars)
diff --git a/apps/web/app/apps/age-of-apes/layout.tsx b/apps/web/app/apps/age-of-apes/layout.tsx
index c9f392e..f94f27b 100644
--- a/apps/web/app/apps/age-of-apes/layout.tsx
+++ b/apps/web/app/apps/age-of-apes/layout.tsx
@@ -16,7 +16,7 @@ export default function AgeOfApesLayout({ children }: { children: ReactNode }) {
   return (
     <div className="min-h-screen">
       {/* Sticky header */}
-      <header className="sticky top-0 z-50 border-b border-surface-border backdrop-blur-md bg-surface-bg/85">
+      <header className="glass-header sticky top-0 z-50">
         <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
           <div className="flex items-center gap-4 min-w-0">
             <Link
diff --git a/apps/web/app/apps/brommie-quake/brommie-quake.css b/apps/web/app/apps/brommie-quake/brommie-quake.css
new file mode 100644
index 0000000..c0f7dce
--- /dev/null
+++ b/apps/web/app/apps/brommie-quake/brommie-quake.css
@@ -0,0 +1,586 @@
+@import url('https://fonts.googleapis.com/css2?family=Russo+One&family=Bebas+Neue&family=Inter:wght@400;700;900&display=swap');
+
+:root {
+  --quake-blue: #0067B1;
+  --quake-dark-blue: #003DA5;
+  --quake-black: #000000;
+  --quake-white: #FFFFFF;
+  --quake-red: #CE0F2D;
+  --quake-gold: #D4A843;
+  --glow-blue: rgba(0, 103, 177, 0.6);
+}
+
+@keyframes bqScreenShake {
+  0%, 100% { transform: translate(0, 0) rotate(0deg); }
+  10% { transform: translate(-3px, -2px) rotate(-0.5deg); }
+  20% { transform: translate(3px, 2px) rotate(0.5deg); }
+  30% { transform: translate(-2px, 3px) rotate(-0.3deg); }
+  40% { transform: translate(2px, -3px) rotate(0.3deg); }
+  50% { transform: translate(-3px, 1px) rotate(-0.5deg); }
+  60% { transform: translate(3px, -1px) rotate(0.5deg); }
+  70% { transform: translate(-1px, 3px) rotate(-0.2deg); }
+  80% { transform: translate(1px, -2px) rotate(0.2deg); }
+  90% { transform: translate(-2px, 2px) rotate(-0.4deg); }
+}
+
+@keyframes bqDrawSeismo {
+  to { stroke-dashoffset: 0; }
+}
+
+@keyframes bqParticleFloat {
+  0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
+  50% { transform: translateY(-80px) scale(1.5); opacity: 1; }
+}
+
+@keyframes bqFadeSlideDown {
+  from { opacity: 0; transform: translateY(-30px); }
+  to { opacity: 1; transform: translateY(0); }
+}
+
+@keyframes bqTitleSlam {
+  0% { transform: scale(3) translateY(-50px); opacity: 0; filter: blur(10px); }
+  60% { transform: scale(0.95); }
+  80% { transform: scale(1.02); }
+  100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
+}
+
+@keyframes bqWordTremor {
+  0%, 45% { transform: translate(0,0); }
+  47% { transform: translate(-2px, 1px); }
+  48% { transform: translate(3px, -1px); }
+  49% { transform: translate(-1px, 2px); }
+  50% { transform: translate(2px, -2px); }
+  51% { transform: translate(-3px, 1px); }
+  52% { transform: translate(1px, -1px); }
+  53% { transform: translate(-2px, 2px); }
+  54% { transform: translate(0, 0); }
+  55%, 100% { transform: translate(0,0); }
+}
+
+@keyframes bqLetterCrumble {
+  0%, 54% {
+    transform: translateY(0) translateX(0) rotate(0deg) scale(1);
+    opacity: 1;
+    filter: brightness(1);
+  }
+  55% { transform: translateY(-4px) translateX(3px) rotate(1deg) scale(1); filter: brightness(1.5); }
+  56% { transform: translateY(3px) translateX(-4px) rotate(-2deg) scale(1); }
+  57% { transform: translateY(-5px) translateX(2px) rotate(2deg) scale(1.02); filter: brightness(2); }
+  58% { transform: translateY(2px) translateX(-3px) rotate(-1deg) scale(1); }
+  60% {
+    transform: translateY(-25px) translateX(0) rotate(0deg) scale(1.1);
+    opacity: 1;
+    filter: brightness(2.5);
+    text-shadow: 0 0 60px #fff, 0 0 120px rgba(206,15,45,1);
+  }
+  65% {
+    transform: translateY(40px) translateX(var(--fall-x)) rotate(calc(var(--fall-rot) * 0.5)) scale(0.9);
+    opacity: 0.9;
+    filter: brightness(1);
+  }
+  72% {
+    transform: translateY(180px) translateX(calc(var(--fall-x) * 2)) rotate(var(--fall-rot)) scale(0.6);
+    opacity: 0.5;
+  }
+  78% {
+    transform: translateY(350px) translateX(calc(var(--fall-x) * 3)) rotate(calc(var(--fall-rot) * 2)) scale(0.3);
+    opacity: 0.1;
+  }
+  82% {
+    transform: translateY(500px) translateX(calc(var(--fall-x) * 4)) rotate(calc(var(--fall-rot) * 3)) scale(0);
+    opacity: 0;
+  }
+  83%, 92% { transform: translateY(500px) scale(0); opacity: 0; }
+  93% {
+    transform: translateY(-60px) scale(1.3);
+    opacity: 1;
+    filter: brightness(3);
+    text-shadow: 0 0 80px #fff, 0 0 160px rgba(206,15,45,1);
+  }
+  96% {
+    transform: translateY(5px) scale(0.98);
+    opacity: 1;
+    filter: brightness(1.5);
+  }
+  98% { transform: translateY(-2px) scale(1.01); filter: brightness(1.2); }
+  100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; filter: brightness(1); }
+}
+
+@keyframes bqCrackFlash {
+  0%, 56% { opacity: 0; }
+  58% { opacity: 1; }
+  60% { opacity: 0; }
+}
+
+@keyf

## Review Summary
Glass/shadow/animation standardization well-executed; shared utilities created and adopted across apps, build and typecheck pass. Some inline shadows remain in untouched files but are context-specific edge cases.

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