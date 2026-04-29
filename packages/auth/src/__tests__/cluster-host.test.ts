import { describe, it, expect } from "vitest";
import {
  authHubOriginForHost,
  authHubUrl,
  isAuthHubOrigin,
} from "../cluster-host";

describe("authHubOriginForHost", () => {
  it("returns auth.apps.lastrev.com on the apps cluster", () => {
    expect(authHubOriginForHost("generations.apps.lastrev.com")).toBe(
      "https://auth.apps.lastrev.com",
    );
    expect(authHubOriginForHost("auth.apps.lastrev.com")).toBe(
      "https://auth.apps.lastrev.com",
    );
    expect(authHubOriginForHost("apps.lastrev.com")).toBe(
      "https://auth.apps.lastrev.com",
    );
  });

  it("returns auth.lastrev.com on the legacy cluster", () => {
    expect(authHubOriginForHost("sentiment.lastrev.com")).toBe(
      "https://auth.lastrev.com",
    );
    expect(authHubOriginForHost("auth.lastrev.com")).toBe(
      "https://auth.lastrev.com",
    );
  });

  it("preserves port for local apps and legacy clusters", () => {
    expect(authHubOriginForHost("generations.apps.lastrev.localhost:3000")).toBe(
      "http://auth.apps.lastrev.localhost:3000",
    );
    expect(authHubOriginForHost("apps.lastrev.localhost:4000")).toBe(
      "http://auth.apps.lastrev.localhost:4000",
    );
    expect(authHubOriginForHost("sentiment.lastrev.localhost:3000")).toBe(
      "http://auth.lastrev.localhost:3000",
    );
  });

  it("defaults the local-cluster port to :3000 when missing", () => {
    expect(authHubOriginForHost("generations.apps.lastrev.localhost")).toBe(
      "http://auth.apps.lastrev.localhost:3000",
    );
  });

  it("treats bare localhost / 127.0.0.1 as same-origin (login lives there in dev)", () => {
    expect(authHubOriginForHost("localhost:3000")).toBe(
      "http://localhost:3000",
    );
    expect(authHubOriginForHost("localhost")).toBe("http://localhost:3000");
    expect(authHubOriginForHost("127.0.0.1:3000")).toBe(
      "http://localhost:3000",
    );
  });

  it("treats Vercel preview hosts as same-origin", () => {
    expect(authHubOriginForHost("lr-apps-git-feat-x.vercel.app")).toBe(
      "https://lr-apps-git-feat-x.vercel.app",
    );
  });
});

describe("isAuthHubOrigin", () => {
  it("is true for the auth subdomain on every cluster", () => {
    expect(isAuthHubOrigin("auth.apps.lastrev.com")).toBe(true);
    expect(isAuthHubOrigin("auth.lastrev.com")).toBe(true);
    expect(isAuthHubOrigin("auth.apps.lastrev.localhost:3000")).toBe(true);
    expect(isAuthHubOrigin("auth.lastrev.localhost:3000")).toBe(true);
  });

  it("is true for localhost and Vercel previews", () => {
    expect(isAuthHubOrigin("localhost:3000")).toBe(true);
    expect(isAuthHubOrigin("127.0.0.1")).toBe(true);
    expect(isAuthHubOrigin("lr-apps-git-feat-x.vercel.app")).toBe(true);
  });

  it("is false for app subdomains where /login would loop", () => {
    expect(isAuthHubOrigin("generations.apps.lastrev.com")).toBe(false);
    expect(isAuthHubOrigin("sentiment.lastrev.com")).toBe(false);
    expect(isAuthHubOrigin("apps.lastrev.com")).toBe(false);
  });
});

describe("authHubUrl", () => {
  it("stays relative when already on the auth hub", () => {
    expect(authHubUrl("auth.apps.lastrev.com", "/login?redirect=foo")).toBe(
      "/login?redirect=foo",
    );
    expect(authHubUrl("localhost:3000", "/login?redirect=foo")).toBe(
      "/login?redirect=foo",
    );
  });

  it("produces an absolute auth-hub URL on app subdomains", () => {
    expect(
      authHubUrl("generations.apps.lastrev.com", "/login?redirect=generations"),
    ).toBe("https://auth.apps.lastrev.com/login?redirect=generations");

    expect(
      authHubUrl(
        "generations.apps.lastrev.localhost:3000",
        "/login?redirect=generations",
      ),
    ).toBe(
      "http://auth.apps.lastrev.localhost:3000/login?redirect=generations",
    );

    expect(authHubUrl("sentiment.lastrev.com", "/unauthorized?app=sentiment")).toBe(
      "https://auth.lastrev.com/unauthorized?app=sentiment",
    );
  });
});
