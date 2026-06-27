import { maskToken } from "../src/services/token-mask";

describe("maskToken", () => {
  it("masks middle of token, keeps first 2 and last 2", () => {
    expect(maskToken("ghp_abcdefghijklmnop")).toBe("gh****op");
  });

  it("returns **** for short tokens", () => {
    expect(maskToken("abc")).toBe("****");
  });

  it("returns **** for empty token", () => {
    expect(maskToken("")).toBe("****");
  });

  it("handles exactly 4 char token", () => {
    expect(maskToken("abcd")).toBe("****");
  });
});
