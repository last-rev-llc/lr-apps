import { vi } from "vitest";

export interface MockAuth0Session {
  user: {
    sub: string;
    email: string;
    name: string;
    picture: string;
    email_verified: boolean;
    org_id?: string;
  };
  accessToken: string;
  accessTokenExpiresAt: number;
  idToken: string;
}

const DEFAULT_SESSION: MockAuth0Session = {
  user: {
    sub: "auth0|test-user-id",
    email: "test@example.com",
    name: "Test User",
    picture: "https://example.com/avatar.png",
    email_verified: true,
  },
  accessToken: "mock-access-token",
  accessTokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
  idToken: "mock-id-token",
};

/**
 * Creates a mock Auth0 session object matching the shape from `auth0.getSession()`.
 * Accepts partial overrides that are deep-merged with defaults.
 */
export function createMockAuth0(
  overrides?: Partial<MockAuth0Session> & {
    user?: Partial<MockAuth0Session["user"]>;
  },
): MockAuth0Session {
  return {
    ...DEFAULT_SESSION,
    ...overrides,
    user: {
      ...DEFAULT_SESSION.user,
      ...overrides?.user,
    },
  };
}

export interface MockAuth0Client {
  getSession: ReturnType<typeof vi.fn>;
  getAccessToken: ReturnType<typeof vi.fn>;
  handleAuth: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock Auth0 client with vi.fn() stubs for getSession, getAccessToken, handleAuth.
 * By default, getSession resolves to a valid session.
 */
export function createMockAuth0Client(
  sessionOverrides?: Partial<MockAuth0Session> & {
    user?: Partial<MockAuth0Session["user"]>;
  },
): MockAuth0Client {
  const session = createMockAuth0(sessionOverrides);

  return {
    getSession: vi.fn().mockResolvedValue(session),
    getAccessToken: vi.fn().mockResolvedValue({
      accessToken: session.accessToken,
    }),
    handleAuth: vi.fn().mockReturnValue(new Response(null, { status: 200 })),
  };
}
