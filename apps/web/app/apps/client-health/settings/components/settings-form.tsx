"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardContent, Input, Label, PageHeader } from "@repo/ui";
import {
  updateAlertSettings,
  type FieldErrors,
  type UpdateAlertSettingsInput,
} from "../../lib/actions";
import type { AlertSettings } from "@/app/api/cron/check-status/alerting";

interface SettingsFormProps {
  initial: AlertSettings;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [emailEnabled, setEmailEnabled] = useState(initial.emailEnabled);
  const [alertEmail, setAlertEmail] = useState(initial.alertEmail ?? "");
  const [sslWarnDays, setSslWarnDays] = useState(String(initial.sslWarnDays));
  const [healthDropThreshold, setHealthDropThreshold] = useState(
    String(initial.healthDropThreshold),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setTopError(null);

    const sslWarnDaysNum = Number(sslWarnDays);
    const healthDropThresholdNum = Number(healthDropThreshold);
    const input: UpdateAlertSettingsInput = {
      emailEnabled,
      alertEmail: alertEmail.trim() || null,
      sslWarnDays: Number.isFinite(sslWarnDaysNum) ? sslWarnDaysNum : -1,
      healthDropThreshold: Number.isFinite(healthDropThresholdNum)
        ? healthDropThresholdNum
        : -1,
    };

    startTransition(async () => {
      const result = await updateAlertSettings(input);
      if (result.ok) {
        setSavedAt(Date.now());
        return;
      }
      setTopError(result.error);
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
    });
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PageHeader
        title="Alert Preferences"
        subtitle="Control how you receive client health alerts"
      />

      <Card>
        <CardContent className="p-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            data-testid="settings-form"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="emailEnabled" className="text-foreground">
                  Email alerts
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive an email when a client health issue is detected.
                </p>
              </div>
              <input
                id="emailEnabled"
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="h-4 w-4 accent-current text-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertEmail" className="text-foreground">
                Alert email override
              </Label>
              <Input
                id="alertEmail"
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="alerts@example.com (optional)"
                aria-invalid={Boolean(fieldErrors.alertEmail)}
                aria-describedby={
                  fieldErrors.alertEmail ? "alertEmail-error" : undefined
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use your account email.
              </p>
              {fieldErrors.alertEmail ? (
                <p
                  id="alertEmail-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {fieldErrors.alertEmail}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sslWarnDays" className="text-foreground">
                SSL expiry warning (days)
              </Label>
              <Input
                id="sslWarnDays"
                type="number"
                min={1}
                max={365}
                value={sslWarnDays}
                onChange={(e) => setSslWarnDays(e.target.value)}
                aria-invalid={Boolean(fieldErrors.sslWarnDays)}
                aria-describedby={
                  fieldErrors.sslWarnDays ? "sslWarnDays-error" : undefined
                }
              />
              <p className="text-xs text-muted-foreground">
                Send an alert when a certificate expires in fewer than this many days. (1–365)
              </p>
              {fieldErrors.sslWarnDays ? (
                <p
                  id="sslWarnDays-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {fieldErrors.sslWarnDays}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthDropThreshold" className="text-foreground">
                Health drop threshold
              </Label>
              <Input
                id="healthDropThreshold"
                type="number"
                min={1}
                max={100}
                value={healthDropThreshold}
                onChange={(e) => setHealthDropThreshold(e.target.value)}
                aria-invalid={Boolean(fieldErrors.healthDropThreshold)}
                aria-describedby={
                  fieldErrors.healthDropThreshold
                    ? "healthDropThreshold-error"
                    : undefined
                }
              />
              <p className="text-xs text-muted-foreground">
                Alert when a client&apos;s composite score drops by at least this much. (1–100)
              </p>
              {fieldErrors.healthDropThreshold ? (
                <p
                  id="healthDropThreshold-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {fieldErrors.healthDropThreshold}
                </p>
              ) : null}
            </div>

            {topError ? (
              <p className="text-sm text-destructive" role="alert">
                {topError}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save preferences"}
              </Button>
              {savedAt ? (
                <span className="text-xs text-muted-foreground">
                  Saved
                </span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
