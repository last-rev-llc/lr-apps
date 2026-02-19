# lr-apps

Monorepo for all Last Rev / AlphaClaw apps.

## Architecture

- Each app lives in `apps/<app-name>/` as static HTML/CSS/JS
- Vercel serves via wildcard subdomain: `<app-name>.adam-harris.alphaclaw.app`
- `vercel.json` rewrites route each subdomain to its app folder
- Apps remain at root path (`/`) — no path prefixing needed

## Adding an app

1. Add the app folder under `apps/<app-name>/`
2. Run the rewrite generator to update `vercel.json`
3. Push to main
