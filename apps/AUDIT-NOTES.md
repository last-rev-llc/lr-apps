# App DRY Audit Notes

This document outlines DRY (Don't Repeat Yourself) violations found in React apps that require source rebuilds to fix properly. These apps use bundled CSS that duplicates shared theme.css patterns.

## Summary

**✅ FIXED: roblox-dances** - Plain HTML app, directly refactored to use shared patterns
**❌ NEEDS REBUILD: hspt-practice** - React app with bundled CSS containing major DRY violations  
**❌ NEEDS REBUILD: soccer-training** - React app with 7.3KB of custom CSS creating parallel design system

---

## hspt-practice App Issues

**File:** `apps/hspt-practice/assets/index-CQIcI2Mv.css` (bundled React CSS)

### DRY Violations:

1. **Reset Styles Duplication**
   - `*{box-sizing:border-box;margin:0;padding:0}` - theme.css already provides this
   - `body{font-family:-apple-system,BlinkMacSystemFont...}` - theme.css already provides this

2. **CSS Variable Name Mismatches**
   - Uses `--primary` instead of shared `--accent`
   - Uses `--surface` instead of shared `--card` 
   - Uses `--surface-alt` instead of shared `--bg` or darker `--card` variant
   - Uses `--text-muted` instead of shared `--muted`
   - Uses `--danger`, `--success`, `--warning` instead of shared `--red`, `--green`, `--yellow`

3. **Button Class Duplication**
   - Custom `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success` classes
   - These now exist in shared theme.css as `.btn-primary`, `.btn-secondary`, `.btn-danger`

4. **Utility Class Duplication**
   - Redefines `.flex`, `.flex-col`, `.items-center`, `.justify-between`, `.gap-*`, `.mb-*`, `.mt-*`, `.w-full`, `.text-center`
   - All these exist in shared theme.css

5. **Component Class Duplication**
   - Custom `.card` with different padding/styling than shared `.card`
   - Custom `.container` with different max-width than shared `.container`
   - Custom `.text-muted`, `.text-success`, etc. using wrong variable names

### Required Variable Mapping:
```
--primary → --accent
--surface → --card  
--surface-alt → --bg (or rgba variant)
--text-muted → --muted
--danger → --red
--success → --green  
--warning → --yellow
```

### Fix Strategy:
1. Update React source to use correct CSS variable names
2. Remove duplicate button classes, use shared `.btn` variants
3. Remove duplicate utility classes, rely on shared theme.css
4. Update `.container` to use shared max-width or create variant
5. Rebuild and redeploy

---

## soccer-training App Issues  

**File:** `apps/soccer-training/assets/index-HLm1aQI8.css` (bundled React CSS)

### MAJOR DRY Violations (7.3KB parallel design system):

1. **Reset Styles Duplication**
   - `*{box-sizing:border-box;margin:0;padding:0}` - theme.css already provides this
   - `body{font-family:-apple-system,BlinkMacSystemFont...}` - theme.css already provides this

2. **Custom CSS Variables (Should Use Shared)**
   - `:root { --soccer-green, --soccer-green-hover, --soccer-green-dim, --soccer-field }`
   - Should use shared `--green`, `--accent`, etc. instead

3. **Component Class Duplication**
   - Custom `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.btn-danger`, `.btn-block`
   - ALL of these have shared equivalents in theme.css
   - Custom `.tag` classes should use shared `.badge` or `.pill` patterns

4. **Layout Pattern Duplication**
   - Custom `.modal-overlay`, `.modal` - could use shared modal patterns
   - Custom `.search-input` - shared has `.search-input` already  
   - Custom `.container` equivalent (`.app-container`)

5. **Form Input Duplication**
   - Custom `input[type=text]`, `input[type=number]`, `textarea`, `select` styling
   - Should use shared form patterns

6. **CSS Variable Name Mismatches**
   - Uses `--surface`, `--surface-alt` instead of `--card`, `--bg`
   - Uses `--border`, `--text-muted` with DIFFERENT values than shared
   - Uses `--text` with different value than shared

### Required Variable Mapping:
```
--soccer-green → --green or --accent
--soccer-green-hover → --green (with :hover opacity)
--soccer-green-dim → rgba(var(--green), 0.15)
--soccer-field → --green (darker variant)
--surface → --card
--surface-alt → --bg or darker --card variant  
--border → --border (ensure same value)
--text → --text (ensure same value)
--text-muted → --muted
```

### Unique Patterns Worth Preserving:
- `.bottom-nav` mobile navigation pattern
- `.timer-display` and `.timer-controls` 
- `.stats-grid` and `.stat-card` layout
- `.calendar-grid` and calendar-specific classes
- Sport-specific classes: `.tag-speed`, `.tag-strength`, etc. (but should use shared color variables)

### Fix Strategy:
1. **Phase 1:** Update CSS variables to match shared theme.css names
2. **Phase 2:** Remove all duplicate classes (.btn, .card, .modal, etc.) and use shared
3. **Phase 3:** Abstract commonly-used patterns (.bottom-nav) to shared library if beneficial  
4. **Phase 4:** Rebuild and redeploy
5. **Phase 5:** Consider moving unique sport-specific components to shared if reusable

---

## Shared Library Enhancements Made

**Added to `apps/shared/theme.css`:**

1. **Button Classes** (were missing):
   ```css
   .btn, .btn-primary, .btn-secondary, .btn-danger, .btn-sm, .btn-block
   ```

2. **Code Block Classes**:
   ```css
   .code-block, .code-block pre, .code-block code
   ```

### Potential Future Additions:

Based on app analysis, consider adding to shared library:
- `.bottom-nav` mobile navigation pattern (from soccer-training)
- `.modal-overlay` and `.modal` classes  
- `.sidebar` layout component pattern (from roblox-dances)
- `.search-input` improvements (already exists but could be enhanced)

---

## Action Items

### Immediate:
- [x] **roblox-dances:** COMPLETED - Refactored to use shared patterns
- [x] **shared library:** COMPLETED - Added missing button and code-block classes

### Requires Development Access:
- [ ] **hspt-practice:** Update React source with correct variable names and rebuild
- [ ] **soccer-training:** Major refactor to eliminate parallel design system, then rebuild

### Priority: HIGH
These DRY violations create maintenance overhead and design inconsistency. Both React apps should be rebuilt with proper shared theme usage before adding new features.

---

*Generated during infrastructure audit - 2025-01-11*