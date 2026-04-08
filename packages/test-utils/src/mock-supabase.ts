import { vi } from "vitest";

type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

function createChainableBuilder(
  resolvedValue: { data: unknown; error: null } = { data: [], error: null },
): MockQueryBuilder {
  const builder: MockQueryBuilder = {} as MockQueryBuilder;

  const chainMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "in",
    "order",
    "limit",
  ] as const;

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Terminal methods that resolve to data
  builder.single = vi.fn().mockResolvedValue(resolvedValue);
  builder.maybeSingle = vi.fn().mockResolvedValue(resolvedValue);

  // Make the builder itself thenable so `await supabase.from(...).select()` works
  builder.then = vi.fn().mockImplementation((resolve) => {
    return Promise.resolve(resolvedValue).then(resolve);
  });

  return builder;
}

export type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn>;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
  };
  rpc: ReturnType<typeof vi.fn>;
  /** Access the underlying query builder to customize return values */
  _builder: MockQueryBuilder;
};

/**
 * Creates a chainable mock Supabase client for testing.
 *
 * @example
 * ```ts
 * const { client, builder } = createMockSupabase();
 * builder.single.mockResolvedValue({ data: { id: '1' }, error: null });
 * ```
 */
export function createMockSupabase(
  defaultData: { data: unknown; error: null } = { data: [], error: null },
): MockSupabaseClient {
  const builder = createChainableBuilder(defaultData);

  return {
    from: vi.fn().mockReturnValue(builder),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _builder: builder,
  };
}
