You just implemented GitHub issue #26: Accounts: component migration

## Original Requirements
## Summary
Complete `@repo/ui` migration for Accounts app. Already partially uses shared components.

## Details
- Audit remaining inline UI patterns
- Replace any remaining inline buttons, cards, inputs with `@repo/ui`
- Ensure client list, PR aggregation, contact display use shared components

## Acceptance Criteria
- [ ] All UI elements use `@repo/ui` components
- [ ] Client list display uses shared Table/Card
- [ ] Contact display uses shared components
- [ ] No inline Tailwind button/card patterns remain
- [ ] `pnpm build` passes

## Code Changes (first 5000 chars)
diff --git a/apps/web/app/apps/accounts/components/accounts-app.tsx b/apps/web/app/apps/accounts/components/accounts-app.tsx
index 24d539c..86eb811 100644
--- a/apps/web/app/apps/accounts/components/accounts-app.tsx
+++ b/apps/web/app/apps/accounts/components/accounts-app.tsx
@@ -1,7 +1,21 @@
 "use client";
 
 import { useState } from "react";
-import { Tabs, TabsContent, TabsList, TabsTrigger, Card } from "@repo/ui";
+import {
+  Tabs,
+  TabsContent,
+  TabsList,
+  TabsTrigger,
+  Card,
+  CardHeader,
+  CardTitle,
+  CardContent,
+  Button,
+  Badge,
+  StatusBadge,
+  EmptyState,
+  cn,
+} from "@repo/ui";
 import type {
   Client,
   Contact,
@@ -47,7 +61,7 @@ function extLink(url?: string | null, label?: string) {
   );
 }
 
-// ── Badge ──────────────────────────────────────────────────────────────────
+// ── Badge color mapping ───────────────────────────────────────────────────
 
 type BadgeColor =
   | "green"
@@ -58,66 +72,33 @@ type BadgeColor =
   | "gray"
   | "cyan";
 
-const BADGE_STYLES: Record<BadgeColor, string> = {
-  green: "bg-green-500/12 text-green-400 border-green-500/20",
-  amber: "bg-amber-500/12 text-amber-400 border-amber-500/20",
-  red: "bg-red-500/12 text-red-400 border-red-500/20",
-  purple: "bg-purple-500/12 text-purple-400 border-purple-500/20",
-  blue: "bg-blue-500/12 text-blue-400 border-blue-500/20",
-  gray: "bg-gray-500/12 text-muted-foreground border-gray-500/20",
-  cyan: "bg-cyan-500/12 text-cyan-400 border-cyan-500/20",
+const STATUS_VARIANT_MAP: Record<
+  BadgeColor,
+  "success" | "warning" | "error" | "info" | "neutral"
+> = {
+  green: "success",
+  amber: "warning",
+  red: "error",
+  blue: "info",
+  gray: "neutral",
+  purple: "neutral",
+  cyan: "neutral",
 };
 
-function Badge({
-  text,
-  color = "gray",
-}: {
-  text: string;
-  color?: BadgeColor;
-}) {
+const BADGE_CLASS_OVERRIDES: Partial<Record<BadgeColor, string>> = {
+  purple:
+    "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400",
+  cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
+};
+
+function ColorBadge({ text, color = "gray" }: { text: string; color?: BadgeColor }) {
   return (
-    <span
-      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${BADGE_STYLES[color]}`}
+    <StatusBadge
+      variant={STATUS_VARIANT_MAP[color]}
+      className={BADGE_CLASS_OVERRIDES[color]}
     >
       {text}
-    </span>
-  );
-}
-
-// ── Section Card ───────────────────────────────────────────────────────────
-
-function SectionCard({
-  title,
-  children,
-}: {
-  title: string;
-  children: React.ReactNode;
-}) {
-  return (
-    <Card className="glass border-surface-border">
-      <div className="px-4 py-3 border-b border-surface-border">
-        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
-      </div>
-      <div className="px-4 py-3">{children}</div>
-    </Card>
-  );
-}
-
-// ── Empty ──────────────────────────────────────────────────────────────────
-
-function Empty({ message }: { message: string }) {
-  return (
-    <p className="text-[13px] text-muted-foreground italic">{message}</p>
-  );
-}
-
-// ── Row ────────────────────────────────────────────────────────────────────
-
-function Row({ children }: { children: React.ReactNode }) {
-  return (
-    <div className="flex items-center gap-2 py-1.5 border-b border-surface-border last:border-0 text-[13px]">
-      {children}
-    </div>
+    </StatusBadge>
   );
 }
 
@@ -129,122 +110,133 @@ function OverviewTab({ client }: { client: Client }) {
   return (
     <div className="space-y-4">
       {/* Company info */}
-      <SectionCard title="Company">
-        <p className="text-[13px] text-muted-foreground mb-3">
-          {client.industry ?? "—"}
-        </p>
-        {urls && (
-          <div className="flex flex-wrap gap-2">
-            {urls.website && (
-              <a
-                href={urls.website}
-                target="_blank"
-                rel="noopener noreferrer"
-                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:border-teal-500/40 transition-colors"
-              >
-                🌐 Website
-              </a>
-            )}
-            {urls.production && urls.production !== urls.website && (
-              <a
-                href={urls.production}
-                target="_blank"
-                rel="noopener noreferrer"
-                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:border-teal-500/40 transition-colors"
-              >
-                🚀 Production
-              </a>
-            )}
-            {urls.staging && (
-              <a
-                href={urls.staging}
-                target="_blank"
-                rel="noopener noreferrer"
-                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-surface-border bg-surfac

## Review Summary
Accounts app fully migrated to @repo/ui components; build passes, all 42 new UI tests pass, no inline button/card patterns remain

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