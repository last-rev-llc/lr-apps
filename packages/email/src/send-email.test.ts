import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { EmailTemplate } from "./types";

const mockEmailsSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: (...args: unknown[]) => mockEmailsSend(...args) },
  })),
}));

vi.mock("@repo/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  },
}));

import { sendEmail } from "./send-email";
import { resetResendForTests } from "./resend-client";
import { log } from "@repo/logger";

interface Data {
  name: string;
}

const template: EmailTemplate<Data> = {
  subject: (d) => `Hello ${d.name}`,
  html: (d) => `<p>Hi ${d.name}</p>`,
  text: (d) => `Hi ${d.name}`,
};

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  resetResendForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  delete process.env.NODE_ENV;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("sendEmail (dev mode)", () => {
  it("logs the email and returns a dev id when no RESEND_API_KEY in dev", async () => {
    process.env.NODE_ENV = "development";

    const result = await sendEmail({
      to: "user@example.com",
      template,
      data: { name: "Ada" },
    });

    expect(result.id).toMatch(/^dev-/);
    expect(mockEmailsSend).not.toHaveBeenCalled();
    expect(log.info).toHaveBeenCalledWith(
      expect.stringContaining("email skipped"),
      expect.objectContaining({
        to: "user@example.com",
        subject: "Hello Ada",
        html: "<p>Hi Ada</p>",
        text: "Hi Ada",
      }),
    );
  });
});

describe("sendEmail (production / API key set)", () => {
  it("invokes resend.emails.send with rendered fields and default from", async () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_123";
    mockEmailsSend.mockResolvedValue({ data: { id: "msg_1" }, error: null });

    const result = await sendEmail({
      to: "user@example.com",
      template,
      data: { name: "Ada" },
    });

    expect(result).toEqual({ id: "msg_1" });
    expect(mockEmailsSend).toHaveBeenCalledWith({
      from: "noreply@lastrev.com",
      to: "user@example.com",
      subject: "Hello Ada",
      html: "<p>Hi Ada</p>",
      text: "Hi Ada",
      replyTo: undefined,
    });
  });

  it("uses EMAIL_FROM env var when no explicit from is given", async () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_123";
    process.env.EMAIL_FROM = "hello@example.com";
    mockEmailsSend.mockResolvedValue({ data: { id: "msg_2" }, error: null });

    await sendEmail({
      to: ["a@x.com", "b@x.com"],
      template,
      data: { name: "Bob" },
    });

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: "hello@example.com" }),
    );
  });

  it("propagates explicit from and replyTo overrides", async () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_123";
    mockEmailsSend.mockResolvedValue({ data: { id: "msg_3" }, error: null });

    await sendEmail({
      to: "x@x.com",
      from: "custom@x.com",
      replyTo: "reply@x.com",
      template,
      data: { name: "Z" },
    });

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "custom@x.com",
        replyTo: "reply@x.com",
      }),
    );
  });

  it("throws when Resend returns an error", async () => {
    process.env.NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_123";
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: "rate limited" },
    });

    await expect(
      sendEmail({ to: "x@x.com", template, data: { name: "Z" } }),
    ).rejects.toThrow("rate limited");
  });

  it("sends in dev mode when RESEND_API_KEY is set", async () => {
    process.env.NODE_ENV = "development";
    process.env.RESEND_API_KEY = "re_test_123";
    mockEmailsSend.mockResolvedValue({ data: { id: "msg_4" }, error: null });

    await sendEmail({ to: "x@x.com", template, data: { name: "Z" } });

    expect(mockEmailsSend).toHaveBeenCalledOnce();
  });
});
