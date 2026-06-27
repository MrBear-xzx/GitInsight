import { maskToken } from "../src/services/token-mask";

describe("PAT safety", () => {
  it("never logs raw pat token", () => {
    const token = "ghp_1234567890abcdef";
    const masked = maskToken(token);
    expect(masked).not.toContain(token);
    expect(masked.startsWith("gh")).toBe(true);
    expect(masked.endsWith("ef")).toBe(true);
  });
});

