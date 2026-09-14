import { afterEach, describe, expect, it } from "vitest";
import { escapeHtml, getMailConfig, isMailConfigured } from "./mail";

const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const;
const snapshot = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = snapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("mail config", () => {
  it("reads SMTP settings from env", () => {
    process.env.SMTP_HOST = "smtp-relay.brevo.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_FROM = "灵搜AI <noreply@example.com>";
    expect(getMailConfig()).toEqual({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      user: "user@example.com",
      pass: "secret",
      from: "灵搜AI <noreply@example.com>",
    });
    expect(isMailConfigured()).toBe(true);
  });

  it("uses port 465 as implicit TLS", () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "user@example.com";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_FROM = "Site <noreply@example.com>";
    expect(getMailConfig().secure).toBe(true);
  });

  it("throws when SMTP env is missing", () => {
    for (const key of keys) delete process.env[key];
    expect(isMailConfigured()).toBe(false);
    expect(() => getMailConfig()).toThrow(/邮件服务未配置/);
  });

  it("escapes HTML in mail content", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });
});
