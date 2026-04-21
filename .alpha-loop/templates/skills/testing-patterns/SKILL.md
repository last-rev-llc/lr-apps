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

### Test-Name Integrity (CRITICAL)
A test's name is a contract with the reader about what it actually exercises. If you name a test `end-to-end`, `integration`, `real DB`, or `full-stack`, the test body MUST exercise that boundary. A test named `end-to-end DB row write via real upsertSubscription` that internally calls `vi.mock('@repo/db/service-role')` is worse than no test: it gives false confidence and hides a coverage gap behind a reassuring name.

- If you want real-boundary coverage, write the test in the right harness (e.g., the `rls-tests` CI job with Supabase running, gated by `describe.skipIf(!process.env.SUPABASE_TEST_URL)`).
- If you only need a unit test of the calling code's wiring, name it honestly: `upsertSubscription unit — mocks service-role client`.
- This pattern was flagged in 5 consecutive runs (#212, #213, #214, #215, #216). Don't ship another one.

### RLS / Integration Test Seeding
When writing tests against Supabase with FK-bearing tables (`app_permissions`, `subscriptions`, `audit_log`, and anything else referencing `auth.users(id)`):

1. **Seed `auth.users` first.** Call `admin.auth.admin.createUser` before any insert into FK-bearing tables. The call is idempotent on `(id, email)` so it's safe to run in `beforeAll`:

   ```ts
   const USER_A = '00000000-0000-0000-0000-000000000001';
   await admin.auth.admin.createUser({
     id: USER_A,
     email: 'a@test.local',
     email_confirm: true,
   });
   ```

2. **Always surface seed errors.** A silent `.upsert()` on a FK-bearing table that violates the FK constraint returns `error: { ... }` and zero rows. If you don't check for the error, downstream `SELECT` assertions pass because the rows were never inserted — not because RLS denied them. Use `.throwOnError()` or explicit error checking:

   ```ts
   // GOOD — surfaces FK violation as a test failure
   await admin
     .from('app_permissions')
     .upsert({ user_id: USER_A, app_slug: 'accounts' })
     .throwOnError();

   // BAD — FK violation silently makes this test pass for the wrong reason
   await admin.from('app_permissions').upsert({ user_id: USER_A, app_slug: 'accounts' });
   ```

3. **Gate the whole suite behind the env var.** `describe.skipIf(!process.env.SUPABASE_TEST_URL)` keeps `pnpm test` hermetic while the dedicated `rls-tests` CI job (which runs `supabase db reset` first) actually exercises the policies.

4. **Zero rows ≠ RLS denial.** Always verify your seed landed by asserting the admin client sees the row *before* testing that the user client doesn't. If the seed never inserted, both admin and user clients see zero rows, and the test passes vacuously.

### Isolation
- Each test is independent (no shared mutable state)
- Use `beforeEach` for setup, not `beforeAll` for mutable state
- Clean up after tests (close connections, clear timers)

### Mocking
- Mock external dependencies (APIs, databases, file system)
- Don't mock the thing you're testing
- Use `jest.mock()` at module level, `jest.spyOn()` for specific methods
- Reset mocks between tests: `jest.restoreAllMocks()` in `afterEach`
- **Never mock the boundary you claim to test.** If the test name promises integration, it must exercise that boundary. See Test-Name Integrity above.

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
- No `fireEvent` for user interactions — use `userEvent.setup()` + `await user.click()`
- No mislabelled tests — the name must match what the test actually exercises
- No seed upserts without error surfacing in RLS tests
