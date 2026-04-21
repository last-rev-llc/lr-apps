# Preview deployments

Vercel publishes a preview URL for every PR. This document explains how
subdomain routing, Auth0 callbacks, and PR preview comments work in that
environment, and what manual setup is needed.

## URL format

Vercel preview URLs look like `<project-or-branch>-<hash>.vercel.app`,
e.g. `lr-apps-git-feat-x.vercel.app`. Each preview is a single hostname —
there are no per-app subdomains.

## Why subdomain routing cannot work on previews

Production routes apps by host: `sentiment.apps.lastrev.com` →
`/apps/sentiment`. Preview hosts are flat — every app would have to share
`*.vercel.app`. We cannot rewrite to the right route group from the host
alone.

## Override path: `?app=<slug>`

`proxy.ts` (apps/web/proxy.ts) has a branch that, when the host is a
preview host, looks for a `?app=<slug>` query param. If present, it
rewrites to `/${routeGroup}/${pathname}` exactly the same way the
production subdomain resolver does. If absent, the request falls through
to the root of the deployment (`NextResponse.next()`) — explicitly NOT
the `auth.lastrev.com` redirect that production uses for unknown
subdomains.

So to view the Sentiment app on a preview deployment:

```
https://lr-apps-git-feat-x.vercel.app/?app=sentiment
https://lr-apps-git-feat-x.vercel.app/dashboard?app=sentiment
```

The PR-comment workflow (see below) generates these URLs automatically.

## Auth0 setup for preview hosts

Auth0 only completes a login if the post-login callback URL is on its
Allowed Callback URLs list. Preview hostnames are randomly generated per
deploy, so we register a wildcard against the **staging tenant** (not the
production tenant — preview deploys must never authenticate against
prod).

1. Auth0 dashboard → staging tenant → Applications → your application →
   Settings.
2. **Allowed Callback URLs**: add
   - `https://*-last-rev-apps.vercel.app/auth/callback`
   - `https://staging.apps.lastrev.com/auth/callback`
3. **Allowed Logout URLs**: add the same two patterns minus
   `/auth/callback`.
4. **Allowed Web Origins**: same two origins.

Auth0 supports `*` as a single-label wildcard in subdomain position —
adjust the wildcard pattern if our Vercel project name changes.

The Vercel `Preview` env scope must point `AUTH0_DOMAIN`,
`AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` at the staging tenant; see
`environments.md`.

## PR preview comment

`.github/workflows/preview-comment.yml` runs on `pull_request` events and
posts a comment listing per-app preview URLs once the Vercel deployment
is ready. The comment links every registered app via the `?app=<slug>`
override.

## Manual verification checklist

After a new preview deploy:

- [ ] Open the bare preview URL — should render the marketing root, NOT
  redirect to `auth.lastrev.com`.
- [ ] Open `?app=sentiment` (or any registered slug) — should render the
  app shell.
- [ ] Click "Sign in" — Auth0 redirects to the staging tenant, not the
  production tenant.
- [ ] After login, the callback returns to the preview URL successfully.
- [ ] Verify a Stripe test-mode checkout completes and the webhook
  (configured against the staging webhook endpoint) records the event.
