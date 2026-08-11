/**
 * analytics.test.ts
 *
 * Verifies that POST /api/analytics/pageview silently drops requests that
 * come from an active admin session and records all other visits.
 *
 * The test is intentionally self-contained: it mocks @workspace/db so
 * it never needs a real Postgres connection, and it mocks adminPassword
 * so the login flow works without a seeded database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// ── DB mock ──────────────────────────────────────────────────────────────────
// Intercepts every insert call so we can assert whether a page_view row was
// (or was not) written, without touching a real database.
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue(undefined),
});

vi.mock("@workspace/db", () => ({
  db: { insert: mockInsert },
  pageViewsTable: {},
}));

// ── Admin-password mock ───────────────────────────────────────────────────────
// Makes POST /api/admin/login succeed unconditionally so the test can obtain
// a real session cookie without a seeded database.
vi.mock("../lib/adminPassword", () => ({
  verifyAdminPassword: vi.fn().mockResolvedValue(true),
  setAdminPassword: vi.fn().mockResolvedValue(undefined),
  hasActiveRecoveryCode: vi.fn().mockResolvedValue(false),
  generateRecoveryCode: vi.fn().mockResolvedValue("test-code"),
  verifyAndConsumeRecoveryCode: vi.fn().mockResolvedValue(false),
}));

// Set the required env var before the app module is loaded.
process.env.SESSION_SECRET = "test-secret-for-vitest";
process.env.ADMIN_PASSWORD = "test-password";

// Import the app *after* mocks are registered so it picks up mocked modules.
const { default: app } = await import("../app.js");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Obtain a session cookie with isAdmin = true via the login endpoint. */
async function getAdminCookie(): Promise<string> {
  const res = await request(app)
    .post("/api/admin/login")
    .send({ password: "test-password" })
    .set("Content-Type", "application/json");

  expect(res.status).toBe(200);
  const setCookie = res.headers["set-cookie"] as string[] | string | undefined;
  if (!setCookie) throw new Error("No Set-Cookie header in admin login response");
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find((c) => c.startsWith("connect.sid="));
  if (!sessionCookie) throw new Error("No connect.sid cookie found");
  // Return just the name=value part (everything before the first semicolon)
  return sessionCookie.split(";")[0]!;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/analytics/pageview — admin session filtering", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    mockInsert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  });

  it("returns 204 and does NOT insert a row when the request carries an admin session", async () => {
    const cookie = await getAdminCookie();

    const res = await request(app)
      .post("/api/analytics/pageview")
      .set("Cookie", cookie)
      .send({ path: "/products" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(204);
    // The DB insert must never have been called
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 204 and DOES insert a row when the request has no session", async () => {
    const res = await request(app)
      .post("/api/analytics/pageview")
      .send({ path: "/products" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(204);
    // The DB insert must have been called exactly once
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const valuesCall = mockInsert.mock.results[0]!.value.values;
    expect(valuesCall).toHaveBeenCalledWith({ path: "/products" });
  });
});
