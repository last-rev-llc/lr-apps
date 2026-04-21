---
name: testing-patterns
description: TDD patterns, Jest testing conventions, and test quality standards. Use when writing any tests.
auto_load: true
priority: high
---

# Testing Patterns Skill

## Trigger
When writing tests or implementing features that need tests.

## TDD Flow

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while tests stay green

## Test Structure

```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should do expected behavior when given input', () => {
      // Arrange
      const input = createTestInput();

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });

    it('should throw when given invalid input', () => {
      expect(() => functionName(null)).toThrow();
    });
  });
});
```

## Rules

### Naming
- Describe behavior, not implementation
- Good: `should return 404 when user not found`
- Bad: `test getUserById`

### Isolation
- Each test is independent (no shared mutable state)
- Use `beforeEach` for setup, not `beforeAll` for mutable state
- Clean up after tests (close connections, clear timers)

### Mocking
- Mock external dependencies (APIs, databases, file system)
- Don't mock the thing you're testing
- Use `jest.mock()` at module level, `jest.spyOn()` for specific methods
- Reset mocks between tests: `jest.restoreAllMocks()` in `afterEach`

### What to Test
- Happy path (expected input -> expected output)
- Error cases (invalid input, missing data, network failures)
- Edge cases (empty arrays, null values, boundary conditions)
- Integration points (API endpoints with supertest)

### What NOT to Test
- Third-party library internals
- TypeScript type checking (the compiler does this)
- Simple getters/setters with no logic

### Anti-Patterns to Avoid
- No `waitForTimeout()` or `sleep()` in tests
- No hardcoded test IDs that depend on database state
- No tests that depend on execution order
- No `any` type assertions to make tests pass

### User interactions: `userEvent`, not `fireEvent`
`fireEvent` for user-style interactions (click, type, select, keyDown) skips React's interaction batching and produces `act()` warnings, even when the test still passes. Across recent runs this has been flagged 8+ times without being fixed. The rule:

- For anything a user does (click, type, hover, select, press a key, paste, drag): `userEvent.setup()` then `await user.click(...)`, `await user.keyboard(...)`, `await user.type(...)`.
- `fireEvent` is acceptable **only** for non-user events the runtime fires: `resize`, `scroll`, `load`, `error` on `<img>`, etc.

```typescript
// Bad — produces act() warnings, runs synchronously, skips batching
fireEvent.click(screen.getByRole('button'));

// Good
const user = userEvent.setup();
await user.click(screen.getByRole('button'));
```

### Test name integrity
If a test name promises a real boundary (`end-to-end`, `integration`, `real DB`, `full-stack`, `via real <X>`), the test body must actually exercise that boundary. A test named `end-to-end DB row write via real upsertSubscription` that calls `vi.mock('@repo/db/service-role')` is worse than no test — it gives false confidence. Either:

1. Hit the real boundary (in a CI job that provisions the dependency, e.g. the `rls-tests` job with Supabase running, gated by `describe.skipIf(!process.env.SUPABASE_TEST_URL)`), or
2. Rename the test to reflect that it's mocked (`upsertSubscription called with correct payload`).

This pattern shipped unfixed in #212, #213, #214.

### RLS / Supabase: seed `auth.users` before any FK-dependent insert
Tables like `app_permissions`, `subscriptions`, `audit_log` have FKs to `auth.users(id)`. Calling `.upsert()` on those tables before the referenced user exists silently no-ops on the FK violation — your RLS assertions then pass because zero rows are present, not because the policy worked. Two requirements:

1. Create users first, idempotently:
   ```typescript
   await admin.auth.admin.createUser({
     id: USER_A,
     email: 'a@test.local',
     email_confirm: true,
   });
   ```
   `createUser` is idempotent on `(id, email)`, so calling it in `beforeAll` is safe.
2. Surface seed errors loudly. Either chain `.throwOnError()` or check `if (error) throw error` after every seed upsert. A test that pass-for-wrong-reason is worse than a test that fails.

This pattern was flagged in #212, #213, #214, #215, #216.

### Don't put test files outside workspace packages
Test files under `scripts/__tests__/` (or any directory without a `package.json` and no entry in `pnpm-workspace.yaml`) are silently skipped by `turbo run test` and `pnpm test`. They only run if invoked directly, which means CI gives a false-positive green tick.

If you need to test a script in `scripts/`, either:
- Move the script into a workspace package and test it there, or
- Add `scripts/` to `pnpm-workspace.yaml` with its own `package.json` and `test` script.

Flagged in #208 and recurred in #209.

### Env-var test fixtures: widen the param, don't cast `process.env`
When testing a Zod env schema or `parseEnv`-style helper, type the source parameter as `Record<string, string | undefined>` instead of `NodeJS.ProcessEnv`. TS 5+ marks `NODE_ENV` as required on `ProcessEnv`, so `as NodeJS.ProcessEnv` casts on partial fixtures break under stricter lib upgrades.

```typescript
// Bad — breaks under TS 5 stricter ProcessEnv typing
parseEnv({ DATABASE_URL: 'x' } as NodeJS.ProcessEnv);

// Good — widen the function signature
export function parseEnv(source: Record<string, string | undefined>) { ... }
parseEnv({ DATABASE_URL: 'x' });
```

This caused a TS regression caught in review across #206–#210.
