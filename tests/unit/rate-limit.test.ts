import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/server/security/rate-limit";

describe("local rate limit", () => {
  it("allows requests until the configured limit", () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);
  });
});
