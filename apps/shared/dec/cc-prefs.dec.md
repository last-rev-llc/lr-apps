# cc-prefs / UserPrefs — DEC Spec

## Tag: `<cc-prefs>` (auto-initialized, no tag needed)

## Purpose
SyncDB-backed persistent user preferences with localStorage fallback. Provides `window.UserPrefs` API.

## JS API
```js
UserPrefs.get('theme', 'dark');       // get with default
UserPrefs.set('theme', 'light');      // set (writes to Supabase + localStorage)
UserPrefs.remove('theme');            // delete
UserPrefs.ready.then(() => render()); // wait for Supabase init
```

## Correct Usage
```js
// In a component's connectedCallback:
this._render(); // initial render with cached values
UserPrefs.ready.then(() => this._render()); // re-render after Supabase sync
```

## Common Mistakes (Error Corrections)

- ❌ **Not awaiting `UserPrefs.ready`** — initial values come from localStorage (fast), but Supabase values may differ. Always re-render after `ready`.
- ❌ **Using raw `localStorage` for preferences** — use `UserPrefs` so data syncs to Supabase.
- ❌ **Calling `UserPrefs.set()` in a render loop** — causes infinite Supabase writes. Only set on user actions.
- ❌ **Using unknown keys without adding to KNOWN_KEYS** — migration only covers known keys. New keys work but won't be migrated from existing localStorage.
