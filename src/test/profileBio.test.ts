import { describe, expect, it } from "vitest";
import { bioLength, limitBio } from "../lib/profileBio";

describe("profile bio limit", () => {
  it("allows exactly 500 characters", () => {
    expect(limitBio("a".repeat(500))).toBe("a".repeat(500));
  });
  it("limits longer input to 500 characters", () => {
    expect(limitBio("a".repeat(501))).toBe("a".repeat(500));
  });
  it("counts emoji as characters without splitting them", () => {
    expect(bioLength(limitBio("🧤".repeat(501)))).toBe(500);
    expect(limitBio("🧤".repeat(501))).toBe("🧤".repeat(500));
  });
});