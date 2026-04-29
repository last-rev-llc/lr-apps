"use client";

import { useState, useTransition } from "react";
import { Badge, Button, Card, CardContent, EmptyState, Input, PageHeader } from "@repo/ui";
import type { Tier } from "@repo/billing";
import type { FlagSummary } from "../lib/types";
import {
  addUserOverride,
  removeOverride,
  setGlobalFlag,
  setTierDefault,
} from "../lib/actions";

const TIERS: Tier[] = ["free", "pro", "enterprise"];

interface FlagsAppProps {
  initialFlags: FlagSummary[];
  knownKeys: string[];
}

export function FlagsApp({ initialFlags, knownKeys }: FlagsAppProps) {
  const [flags, setFlags] = useState<FlagSummary[]>(initialFlags);
  const [, startTransition] = useTransition();
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [emailInput, setEmailInput] = useState<Record<string, string>>({});

  function applyOptimistic(
    key: string,
    update: (flag: FlagSummary) => FlagSummary,
  ) {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? update(f) : f)),
    );
  }

  function handleErr(key: string, err?: string) {
    setErrorByKey((prev) => ({ ...prev, [key]: err ?? "" }));
  }

  function handleGlobal(key: string, enabled: boolean) {
    applyOptimistic(key, (f) => ({
      ...f,
      global: { id: f.global?.id ?? "pending", enabled },
    }));
    startTransition(async () => {
      const result = await setGlobalFlag(key, enabled);
      if (!result.ok) handleErr(key, result.error);
      else handleErr(key, "");
    });
  }

  function handleTier(key: string, tier: Tier, enabled: boolean) {
    applyOptimistic(key, (f) => ({
      ...f,
      tiers: { ...f.tiers, [tier]: { id: f.tiers[tier]?.id ?? "pending", enabled } },
    }));
    startTransition(async () => {
      const result = await setTierDefault(key, tier, enabled);
      if (!result.ok) handleErr(key, result.error);
      else handleErr(key, "");
    });
  }

  function handleAddOverride(key: string, enabled: boolean) {
    const email = (emailInput[key] ?? "").trim();
    if (!email) return;
    startTransition(async () => {
      const result = await addUserOverride(key, email, enabled);
      if (!result.ok) handleErr(key, result.error);
      else {
        handleErr(key, "");
        setEmailInput((prev) => ({ ...prev, [key]: "" }));
      }
    });
  }

  function handleRemove(key: string, rowId: string) {
    applyOptimistic(key, (f) => ({
      ...f,
      users: f.users.filter((u) => u.id !== rowId),
    }));
    startTransition(async () => {
      const result = await removeOverride(rowId);
      if (!result.ok) handleErr(key, result.error);
      else handleErr(key, "");
    });
  }

  if (flags.length === 0 && knownKeys.length === 0) {
    return (
      <EmptyState
        icon="🚩"
        title="No feature flags yet"
        description="Insert rows into feature_flags to start gating features."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="🚩 Feature Flags"
        subtitle={`${flags.length} flag${flags.length === 1 ? "" : "s"} configured`}
      />

      {flags.map((flag) => (
        <Card key={flag.key} className="p-4">
          <CardContent className="p-0 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">{flag.key}</span>
              {errorByKey[flag.key] ? (
                <Badge variant="secondary" className="text-xs text-red-400">
                  {errorByKey[flag.key]}
                </Badge>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20">Global</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(flag.global?.enabled)}
                  onChange={(e) => handleGlobal(flag.key, e.target.checked)}
                  data-testid={`global-${flag.key}`}
                />
                <span>{flag.global?.enabled ? "enabled" : "disabled"}</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground w-20">Tiers</span>
              {TIERS.map((tier) => (
                <label key={tier} className="flex items-center gap-2 text-sm capitalize">
                  <input
                    type="checkbox"
                    checked={Boolean(flag.tiers[tier]?.enabled)}
                    onChange={(e) => handleTier(flag.key, tier, e.target.checked)}
                    data-testid={`tier-${flag.key}-${tier}`}
                  />
                  <span>{tier}</span>
                </label>
              ))}
            </div>

            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">User overrides</span>
              {flag.users.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">none</div>
              ) : (
                <div className="space-y-1">
                  {flag.users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="font-mono flex-1 truncate">
                        {u.user_email ?? u.user_id}
                      </span>
                      <Badge variant="secondary">
                        {u.enabled ? "enabled" : "disabled"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(flag.key, u.id)}
                      >
                        remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  className="text-xs flex-1"
                  value={emailInput[flag.key] ?? ""}
                  onChange={(e) =>
                    setEmailInput((prev) => ({
                      ...prev,
                      [flag.key]: e.target.value,
                    }))
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddOverride(flag.key, true)}
                >
                  + enable
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddOverride(flag.key, false)}
                >
                  + disable
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
