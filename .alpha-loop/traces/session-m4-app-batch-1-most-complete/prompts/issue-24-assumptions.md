You just implemented GitHub issue #24: Command Center: component migration

## Original Requirements
## Summary
Migrate Command Center hub page and shared module chrome to `@repo/ui` components. Sub-module internals are deferred to M6.

## Details
- Replace inline buttons, cards, badges, inputs, navigation with `@repo/ui` equivalents
- Migrate dashboard grid layout and module navigation sidebar
- Preserve all existing functionality
- Leave unique components but ensure they use theme tokens
- This is the largest migration surface in the codebase

## Acceptance Criteria
- [ ] Hub page uses `@repo/ui` Card, Button, Badge components
- [ ] Sidebar navigation uses `@repo/ui` navigation components
- [ ] Module chrome (headers, breadcrumbs, layout) uses shared components
- [ ] No inline Tailwind button/card/badge patterns remain in hub/chrome code
- [ ] All existing functionality preserved
- [ ] `pnpm build` passes
- [ ] Visual appearance matches or improves current design

## Code Changes (first 5000 chars)
diff --git a/apps/web/app/apps/command-center/agents/components/agents-app.tsx b/apps/web/app/apps/command-center/agents/components/agents-app.tsx
index 7c8f3bd..6df7f50 100644
--- a/apps/web/app/apps/command-center/agents/components/agents-app.tsx
+++ b/apps/web/app/apps/command-center/agents/components/agents-app.tsx
@@ -1,7 +1,7 @@
 "use client";
 
 import { useState, useMemo } from "react";
-import { Badge, Card, CardContent, EmptyState, PageHeader, Search } from "@repo/ui";
+import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Search, StatCard } from "@repo/ui";
 import type { Agent, AgentStatus } from "../lib/types";
 
 type StatusFilter = "all" | AgentStatus;
@@ -76,17 +76,12 @@ export function AgentsApp({ initialAgents }: AgentsAppProps) {
       {/* Stats row */}
       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
         {[
-          { label: "Total", value: agents.length, color: "#e2e8f0" },
-          { label: "Active", value: counts.active, color: "#4ade80" },
-          { label: "Running", value: counts.running, color: "#fbbf24" },
-          { label: "Errors", value: counts.error, color: "#f87171" },
+          { label: "Total", value: agents.length },
+          { label: "Active", value: counts.active },
+          { label: "Running", value: counts.running },
+          { label: "Errors", value: counts.error },
         ].map((s) => (
-          <Card key={s.label} className="p-3">
-            <CardContent className="p-0 text-center">
-              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
-              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
-            </CardContent>
-          </Card>
+          <StatCard key={s.label} value={s.value} label={s.label} size="sm" />
         ))}
       </div>
 
@@ -95,17 +90,15 @@ export function AgentsApp({ initialAgents }: AgentsAppProps) {
         <Search value={search} onChange={setSearch} placeholder="Search agents…" className="flex-1 min-w-[200px]" />
         <div className="flex gap-1 flex-wrap">
           {STATUS_FILTERS.map((f) => (
-            <button
+            <Button
               key={f.value}
+              variant={statusFilter === f.value ? "outline" : "ghost"}
+              size="sm"
               onClick={() => setStatusFilter(f.value)}
-              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
-                statusFilter === f.value
-                  ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
-                  : "border-white/15 bg-white/5 text-white/50 hover:text-white"
-              }`}
+              className={statusFilter === f.value ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : ""}
             >
               {f.label}
-            </button>
+            </Button>
           ))}
         </div>
       </div>
@@ -139,9 +132,9 @@ export function AgentsApp({ initialAgents }: AgentsAppProps) {
                         >
                           {agent.status}
                         </Badge>
-                        <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
+                        <Badge variant="secondary" className="text-xs text-white/40 bg-white/5 border-0">
                           {agent.type}
-                        </span>
+                        </Badge>
                       </div>
                       {agent.description && (
                         <p className="text-xs text-white/50 mt-1">{agent.description}</p>
diff --git a/apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx b/apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx
index 14a296f..ad3088f 100644
--- a/apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx
+++ b/apps/web/app/apps/command-center/ai-scripts/components/ai-scripts-app.tsx
@@ -1,7 +1,7 @@
 "use client";
 
 import { useState, useMemo } from "react";
-import { Badge, Card, CardContent, EmptyState, PageHeader, Search } from "@repo/ui";
+import { Badge, Button, Card, CardContent, EmptyState, PageHeader, Search } from "@repo/ui";
 import type { AiScript, ScriptCategory } from "../lib/types";
 
 const CATEGORIES: Array<{ value: ScriptCategory; label: string }> = [
@@ -70,17 +70,15 @@ export function AiScriptsApp({ initialScripts }: AiScriptsAppProps) {
         <Search value={search} onChange={setSearch} placeholder="Search scripts…" className="flex-1 min-w-[200px]" />
         <div className="flex gap-1 flex-wrap">
           {CATEGORIES.map((c) => (
-            <button
+            <Button
               key={c.value}
+              variant={category === c.value ? "outline" : "ghost"}
+              size="sm"
               onClick={() => setCategory(c.value)}
-              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
-                category === c.value
-                  ? "border-purple

## Review Summary
Migration is functionally complete for hub page and sidebar layout; 5 new @repo/ui components are well-tested but unused in app code; several inline patterns remain in sub-module files

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