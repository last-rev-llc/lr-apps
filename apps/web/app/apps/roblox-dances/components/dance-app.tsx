"use client";

import { useState, useMemo } from "react";
import { createClient } from "@repo/db/client";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Button,
  Badge,
} from "@repo/ui";
import type { Dance, DanceSubmission, Difficulty, SortKey } from "../lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-500/15 text-green-400 border-green-500/30",
  intermediate: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  advanced: "bg-red-500/15 text-red-400 border-red-500/30",
  expert: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const DIFFICULTY_ORDER: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
  expert: 3,
};

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const filled = Math.round(rating);
  const cls = size === "md" ? "text-base" : "text-sm";
  return (
    <span className={`inline-flex gap-px ${cls}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= filled ? "text-yellow-400" : "text-white/20"}>
          ★
        </span>
      ))}
    </span>
  );
}

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex gap-px text-lg cursor-pointer">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={(hover || value) >= i ? "text-yellow-400" : "text-white/20"}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function PreviewBars({ seed }: { seed: number }) {
  return (
    <div className="flex gap-0.5 items-end h-6 mb-2">
      {Array.from({ length: 16 }, (_, i) => {
        const h = 4 + ((seed * (i + 1) * 7) % 20);
        return (
          <div
            key={i}
            className="w-1 rounded-sm bg-pink-400/50"
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}

// ─── Lua Highlighter ──────────────────────────────────────────────────────────

const LUA_KEYWORDS = new Set([
  "and", "break", "do", "else", "elseif", "end", "false", "for", "function",
  "if", "in", "local", "nil", "not", "or", "repeat", "return", "then", "true",
  "until", "while",
]);

const LUA_BUILTINS = new Set([
  "print", "pairs", "ipairs", "next", "type", "getmetatable", "setmetatable",
  "rawget", "rawset", "tostring", "tonumber", "require", "warn", "tick", "task",
  "game", "script", "workspace", "Instance", "CFrame", "Vector3", "Enum",
  "typeof", "pcall", "xpcall", "coroutine", "spawn", "wait", "delay", "error",
  "assert", "select", "unpack", "math", "RunService",
]);

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightLua(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      let r = "";
      let i = 0;
      while (i < line.length) {
        if (line[i] === "-" && line[i + 1] === "-") {
          r += `<span class="text-white/40 italic">${esc(line.slice(i))}</span>`;
          i = line.length;
        } else if (line[i] === '"' || line[i] === "'") {
          const q = line[i];
          let end = i + 1;
          while (end < line.length && line[end] !== q) {
            if (line[end] === "\\") end++;
            end++;
          }
          end = Math.min(end + 1, line.length);
          r += `<span class="text-yellow-300">${esc(line.slice(i, end))}</span>`;
          i = end;
        } else if (/[a-zA-Z_]/.test(line[i])) {
          let end = i + 1;
          while (end < line.length && /[a-zA-Z0-9_]/.test(line[end])) end++;
          const w = line.slice(i, end);
          if (LUA_KEYWORDS.has(w)) {
            r += `<span class="text-pink-400 font-semibold">${esc(w)}</span>`;
          } else if (LUA_BUILTINS.has(w)) {
            r += `<span class="text-green-400">${esc(w)}</span>`;
          } else {
            r += esc(w);
          }
          i = end;
        } else if (
          /[0-9]/.test(line[i]) ||
          (line[i] === "." && /[0-9]/.test(line[i + 1] ?? ""))
        ) {
          let end = i;
          while (end < line.length && /[0-9.xXa-fA-F]/.test(line[end])) end++;
          r += `<span class="text-blue-300">${esc(line.slice(i, end))}</span>`;
          i = end;
        } else {
          r += esc(line[i]);
          i++;
        }
      }
      return r;
    })
    .join("\n");
}

// ─── Lua Generator ────────────────────────────────────────────────────────────

function generateLuaScript(description: string): string {
  const lower = description.toLowerCase();

  const isFast = /fast|quick|rapid|energetic|spin|whirl/.test(lower);
  const isFluid = /fluid|smooth|wave|flow|glide/.test(lower);
  const isHip = /hip|sway|groove|funk|soul/.test(lower);
  const isArm = /arm|wave|swing|windmill|reach/.test(lower);

  const cycleDuration = isFast ? 0.8 : isFluid ? 2.0 : 1.2;
  const armSwing = isArm ? 80 : isHip ? 40 : 60;
  const hipSway = isHip ? 30 : 15;
  const bounce = isFluid ? 0.02 : 0.06;

  return `-- Generated Dance: ${description.slice(0, 60)}
-- Motor6D Procedural Animation (R15)
-- Generated by Roblox Dance Marketplace

local RunService = game:GetService("RunService")

local CYCLE_DURATION = ${cycleDuration}
local ARM_SWING      = ${armSwing}
local HIP_SWAY       = ${hipSway}
local BOUNCE_HEIGHT  = ${bounce}

local function getCharacter(script)
    local parent = script.Parent
    if parent:FindFirstChildOfClass("Humanoid") then return parent end
    local player = game:GetService("Players").LocalPlayer
    if player then return player.Character or player.CharacterAdded:Wait() end
    return parent
end

local function getMotors(character)
    local motors = {}
    for _, desc in ipairs(character:GetDescendants()) do
        if desc:IsA("Motor6D") then motors[desc.Name] = desc end
    end
    return motors
end

local character = getCharacter(script)
local motors = getMotors(character)
local startTime = tick()

RunService.PreSimulation:Connect(function()
    local elapsed = tick() - startTime
    local phase = (elapsed % CYCLE_DURATION) / CYCLE_DURATION
    local t = phase * math.pi * 2
    local sway = math.sin(t)
    local bounce = math.abs(math.sin(t)) * BOUNCE_HEIGHT

    -- Root bounce
    if motors.Root then
        motors.Root.Transform = CFrame.new(0, -bounce, 0)
            * CFrame.Angles(0, sway * math.rad(HIP_SWAY), 0)
    end

    -- Waist sway
    if motors.Waist then
        motors.Waist.Transform = CFrame.Angles(
            math.rad(5),
            sway * math.rad(HIP_SWAY * 0.8),
            sway * math.rad(${isFluid ? 8 : 4})
        )
    end

    -- Head counter-sway
    if motors.Neck then
        motors.Neck.Transform = CFrame.Angles(0, -sway * math.rad(10), 0)
    end

    -- Arms
    local armAngle = math.sin(t - 0.3) * math.rad(ARM_SWING)
    if motors.RightShoulder then
        motors.RightShoulder.Transform = CFrame.Angles(armAngle, 0, math.rad(15))
    end
    if motors.LeftShoulder then
        motors.LeftShoulder.Transform = CFrame.Angles(-armAngle, 0, math.rad(-15))
    end
    if motors.RightElbow then
        motors.RightElbow.Transform = CFrame.Angles(
            math.rad(-40) + math.sin(t) * math.rad(20), 0, 0
        )
    end
    if motors.LeftElbow then
        motors.LeftElbow.Transform = CFrame.Angles(
            math.rad(-40) + math.sin(t) * math.rad(20), 0, 0
        )
    end

    -- Legs
    local kneeBend = math.abs(math.sin(t)) * math.rad(${isFast ? 25 : 15})
    if motors.RightKnee then motors.RightKnee.Transform = CFrame.Angles(kneeBend, 0, 0) end
    if motors.LeftKnee then motors.LeftKnee.Transform = CFrame.Angles(kneeBend, 0, 0) end
    if motors.RightHip then
        motors.RightHip.Transform = CFrame.Angles(0, 0, sway * math.rad(6))
    end
    if motors.LeftHip then
        motors.LeftHip.Transform = CFrame.Angles(0, 0, sway * math.rad(6))
    end
end)`;
}

// ─── Code Viewer Panel ────────────────────────────────────────────────────────

function CodeViewer({
  dance,
  localRating,
  onRate,
  onClose,
}: {
  dance: Dance;
  localRating: number;
  onRate: (stars: number) => void;
  onClose: () => void;
}) {
  const lines = dance.code.split("\n");
  const lineNums = lines.map((_, i) => i + 1).join("\n");
  const highlighted = highlightLua(dance.code);

  function copyCode() {
    navigator.clipboard.writeText(dance.code).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-overlay">
      <div className="bg-background border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{dance.emoji}</span>
            <div>
              <div className="font-semibold text-base">{dance.name}</div>
              <Badge
                variant="outline"
                className={`text-[10px] mt-0.5 ${DIFFICULTY_COLORS[dance.difficulty]}`}
              >
                {dance.difficulty}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <p className="text-muted-foreground text-sm">{dance.description}</p>

          {/* Rating row */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Your Rating:</span>
            <StarInput value={localRating} onChange={onRate} />
          </div>

          {/* Code block */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.03]">
              <span className="text-xs text-muted-foreground">
                {dance.name}.lua &bull; {lines.length} lines
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="text-xs px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:border-pink-400/50 hover:text-pink-400 transition-colors"
              >
                📋 Copy Script
              </button>
            </div>
            <div className="flex overflow-auto max-h-[40vh]">
              <pre className="px-3 py-3 text-xs font-mono text-white/30 text-right select-none border-r border-white/10 flex-shrink-0 leading-relaxed">
                {lineNums}
              </pre>
              <pre
                className="px-4 py-3 text-xs font-mono leading-relaxed overflow-x-auto flex-1"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Lua syntax highlighting
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Catalog Tab ──────────────────────────────────────────────────────────────

function CatalogTab({ dances }: { dances: Dance[] }) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [sort, setSort] = useState<SortKey>("rating");
  const [selectedDance, setSelectedDance] = useState<Dance | null>(null);
  const [localRatings, setLocalRatings] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    let list = dances.filter((d) => {
      if (difficulty !== "all" && d.difficulty !== difficulty) return false;
      if (search) {
        const hay = `${d.name} ${d.description} ${d.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "rating":
          return (b.rating ?? 0) - (a.rating ?? 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        case "difficulty":
          return (DIFFICULTY_ORDER[a.difficulty] ?? 0) - (DIFFICULTY_ORDER[b.difficulty] ?? 0);
        default:
          return 0;
      }
    });

    return list;
  }, [dances, search, difficulty, sort]);

  async function handleRate(dance: Dance, stars: number) {
    setLocalRatings((prev) => ({ ...prev, [dance.id]: stars }));
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Input
          placeholder="Search dances…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] bg-white/5 border-white/10"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-pink-400"
        >
          <option value="all">All Difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-pink-400"
        >
          <option value="rating">Top Rated</option>
          <option value="name">Name A→Z</option>
          <option value="date">Newest</option>
          <option value="difficulty">Difficulty</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">🔍</div>
          <p>No dances match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dance) => (
            <button
              key={dance.id}
              type="button"
              onClick={() => setSelectedDance(dance)}
              className="text-left bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-pink-400/50 hover:bg-white/[0.08] hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-4xl flex-shrink-0">{dance.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm mb-0.5 text-foreground">{dance.name}</div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {dance.description}
                  </p>
                </div>
              </div>
              <PreviewBars seed={dance.code.length} />
              {dance.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {dance.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/10 text-pink-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`text-[11px] ${DIFFICULTY_COLORS[dance.difficulty]}`}
                >
                  {dance.difficulty}
                </Badge>
                <div className="flex items-center gap-1">
                  <StarDisplay rating={localRatings[dance.id] ?? dance.rating} />
                  <span className="text-[11px] text-muted-foreground">
                    ({dance.ratingCount})
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Code Viewer Modal */}
      {selectedDance && (
        <CodeViewer
          dance={selectedDance}
          localRating={localRatings[selectedDance.id] ?? 0}
          onRate={(stars) => handleRate(selectedDance, stars)}
          onClose={() => setSelectedDance(null)}
        />
      )}
    </div>
  );
}

// ─── Submit Tab ───────────────────────────────────────────────────────────────

function SubmitTab({
  submissions: initialSubmissions,
}: {
  submissions: DanceSubmission[];
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [desc, setDesc] = useState("");
  const [difficulty, setDifficulty] =
    useState<DanceSubmission["difficulty"]>("intermediate");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleSubmit() {
    if (!name.trim()) { showToast("Please enter a dance name"); return; }
    if (!desc.trim()) { showToast("Please enter a description"); return; }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const sub = {
        id: `sub-${Date.now()}`,
        name: name.trim(),
        emoji: emoji.trim() || "🎵",
        description: desc.trim(),
        difficulty,
        tags: JSON.stringify(
          tags.split(",").map((t) => t.trim()).filter(Boolean)
        ),
        submitted_by: "anonymous",
        status: "pending",
      };

      // biome-ignore lint/suspicious/noExplicitAny: Supabase insert
      await (supabase as any).from("dance_submissions").upsert(sub);

      const newSub: DanceSubmission = {
        ...sub,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        submittedBy: "anonymous",
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      setSubmissions((prev) => [newSub, ...prev]);
      setName("");
      setEmoji("");
      setDesc("");
      setTags("");
      showToast("Dance idea submitted!");
    } catch {
      showToast("Failed to submit. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-pink-500 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">📝 Submit a Dance Idea</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Dance Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Shuffle"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Emoji
              </label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🎵"
                maxLength={4}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the dance moves, style, and feel…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground resize-vertical focus:outline-none focus:ring-1 focus:ring-pink-400 placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as DanceSubmission["difficulty"])
              }
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-pink-400"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tags (comma-separated)
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="hip-hop, viral, party"
              className="bg-white/5 border-white/10"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
          >
            {submitting ? "Submitting…" : "Submit Dance Idea"}
          </Button>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div>
        <h3 className="font-semibold text-base mb-3">Recent Submissions</h3>
        {submissions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">No submissions yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.emoji || "🎵"}</span>
                    <span className="font-semibold text-sm">{s.name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      s.status === "approved"
                        ? "bg-green-500/15 text-green-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{s.description}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${DIFFICULTY_COLORS[s.difficulty]}`}
                  >
                    {s.difficulty}
                  </Badge>
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/10 text-pink-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generator Tab ────────────────────────────────────────────────────────────

function GeneratorTab() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [code, setCode] = useState("");

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setCode("");

    // Simulate generation delay then produce template-based script
    await new Promise((resolve) => setTimeout(resolve, 800));
    setCode(generateLuaScript(prompt.trim()));
    setGenerating(false);
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code).catch(() => {});
  }

  const lines = code.split("\n");
  const highlighted = code ? highlightLua(code) : "";

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">⚡ AI Script Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Describe a dance and we'll generate a Motor6D Luau script for your
            Roblox character.
          </p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Dance Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A smooth salsa dance with hip sways, arm extensions, and spinning turns…"
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground resize-vertical focus:outline-none focus:ring-1 focus:ring-pink-400 placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Motor6D script…
              </span>
            ) : (
              "Generate Script"
            )}
          </Button>
        </CardContent>
      </Card>

      {code && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Generated Script</h3>
            <button
              type="button"
              onClick={copyCode}
              className="text-xs px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:border-pink-400/50 hover:text-pink-400 transition-colors"
            >
              📋 Copy
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.03]">
              <span className="text-xs text-muted-foreground">
                generated.lua &bull; {lines.length} lines
              </span>
            </div>
            <div className="flex overflow-auto max-h-[50vh]">
              <pre className="px-3 py-3 text-xs font-mono text-white/30 text-right select-none border-r border-white/10 flex-shrink-0 leading-relaxed">
                {lines.map((_, i) => i + 1).join("\n")}
              </pre>
              <pre
                className="px-4 py-3 text-xs font-mono leading-relaxed overflow-x-auto flex-1"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Lua syntax highlighting
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

interface DanceAppProps {
  initialDances: Dance[];
  initialSubmissions: DanceSubmission[];
}

export function DanceApp({ initialDances, initialSubmissions }: DanceAppProps) {
  return (
    <Tabs defaultValue="catalog">
      <TabsList className="mb-6 bg-white/5 border border-white/10">
        <TabsTrigger value="catalog" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
          🎭 Catalog
        </TabsTrigger>
        <TabsTrigger value="submit" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
          📝 Submit
        </TabsTrigger>
        <TabsTrigger value="generator" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
          ⚡ Generator
        </TabsTrigger>
      </TabsList>

      <TabsContent value="catalog">
        <CatalogTab dances={initialDances} />
      </TabsContent>

      <TabsContent value="submit">
        <SubmitTab submissions={initialSubmissions} />
      </TabsContent>

      <TabsContent value="generator">
        <GeneratorTab />
      </TabsContent>
    </Tabs>
  );
}
