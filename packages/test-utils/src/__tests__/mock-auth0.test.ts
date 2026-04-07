import { describe, it, expect } from "vitest";
import { createMockAuth0, createMockAuth0Client } from "../mock-auth0";

describe("createMockAuth0", () => {
  it("returns a valid session with defaults", () => {
    const session = createMockAuth0();

    expect(session.user.sub).toBe("auth0|test-user-id");
    expect(session.user.email).toBe("test@example.com");
    expect(session.user.name).toBe("Test User");
    expect(session.user.email_verified).toBe(true);
    expect(session.accessToken).toBe("mock-access-token");
    expect(session.idToken).toBe("mock-id-token");
  });

  it("accepts top-level overrides", () => {
    const session = createMockAuth0({
      accessToken: "custom-token",
    });

    expect(session.accessToken).toBe("custom-token");
    // Other fields remain defaults
    expect(session.user.email).toBe("test@example.com");
  });

  it("deep-merges user overrides", () => {
    const session = createMockAuth0({
      user: { email: "custom@example.com", org_id: "org_123" },
    });

    expect(session.user.email).toBe("custom@example.com");
    expect(session.user.org_id).toBe("org_123");
    // Other user fields remain defaults
    expect(session.user.sub).toBe("auth0|test-user-id");
    expect(session.user.name).toBe("Test User");
  });
});

describe("createMockAuth0Client", () => {
  it("returns a client with vi.fn() stubs", () => {
    const client = createMockAuth0Client();

    expect(client.getSession).toBeDefined();
    expect(client.getAccessToken).toBeDefined();
    expect(client.handleAuth).toBeDefined();
  });

  it("getSession resolves to a valid session", async () => {
    const client = createMockAuth0Client();
    const session = await client.getSession();

    expect(session.user.sub).toBe("auth0|test-user-id");
    expect(session.accessToken).toBe("mock-access-token");
  });

  it("applies session overrides to the client", async () => {
    const client = createMockAuth0Client({
      user: { email: "admin@example.com" },
    });

    const session = await client.getSession();
    expect(session.user.email).toBe("admin@example.com");
  });

  it("getAccessToken resolves to the access token", async () => {
    const client = createMockAuth0Client({
      accessToken: "my-token",
    });

    const result = await client.getAccessToken();
    expect(result.accessToken).toBe("my-token");
  });
});
