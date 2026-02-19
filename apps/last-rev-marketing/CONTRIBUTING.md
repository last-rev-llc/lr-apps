# Contributing — Last Rev Marketing Site

## Git Workflow (Worktrees)

We use Git worktrees to isolate work on parallel features without mixing commits.

### Branches

- **`main`** — Production. Only updated via merged PRs from `dev`.
- **`dev`** — Local working branch. This is what the alphaclaw-hosted site serves (`last-rev-marketing.adam-harris.alphaclaw.app`). Features merge here first.
- **`feature/*`** — Short-lived worktree branches for individual tasks.

### Daily Workflow

1. **New task** — Create a worktree off `dev`:
   ```bash
   cd apps/last-rev-marketing
   git worktree add ../last-rev-marketing--taskname -b feature/taskname dev
   ```

2. **Work** — Make commits in the worktree directory (`apps/last-rev-marketing--taskname/`).

3. **Done** — Merge into `dev` and clean up:
   ```bash
   cd apps/last-rev-marketing
   git merge feature/taskname
   git worktree remove ../last-rev-marketing--taskname
   git branch -d feature/taskname
   ```

4. **Ship** — When ready for production:
   ```bash
   git push origin dev
   gh pr create --base main --head dev --title "Description of changes"
   ```

5. **After merge** — Pull main locally, rebase dev if needed:
   ```bash
   git checkout main && git pull origin main
   git checkout dev && git rebase main
   ```

### Rules

- Never commit half-finished work to `dev` — that's what worktrees are for.
- Each feature worktree is independent. Multiple can exist at once.
- The `apps/last-rev-marketing/` directory stays on `dev` at all times.
- Worktree directories use the naming convention `last-rev-marketing--taskname`.
- Delete worktrees and their branches once merged into `dev`.
- Only push `dev` to origin when ready to create a PR.
