import { afterEach, describe, expect, it } from "vitest";
import {
  HUMAN_CHECK_MIN_DWELL_MS,
  HUMAN_CHECK_TTL_MS,
  HumanCheckError,
  completeHumanChallenge,
  consumeHumanToken,
  issueHumanChallenge,
  resetHumanCheckStore,
} from "./human-check";

afterEach(() => {
  resetHumanCheckStore();
});

describe("human checkout check", () => {
  it("issues a one-time token after the user dwells and clicks", () => {
    const started = 1_000_000;
    const { challengeId } = issueHumanChallenge("1.1.1.1", started);
    const { token } = completeHumanChallenge(challengeId, "1.1.1.1", started + HUMAN_CHECK_MIN_DWELL_MS);
    expect(token.length).toBeGreaterThan(10);
    expect(consumeHumanToken(token, started + HUMAN_CHECK_MIN_DWELL_MS + 10)).toBe(true);
    expect(() => consumeHumanToken(token, started + HUMAN_CHECK_MIN_DWELL_MS + 20)).toThrow(HumanCheckError);
  });

  it("rejects an instant scripted click", () => {
    const started = 1_000_000;
    const { challengeId } = issueHumanChallenge("1.1.1.1", started);
    expect(() => completeHumanChallenge(challengeId, "1.1.1.1", started + 200)).toThrow(/稍后再点击/);
  });

  it("rejects a missing or expired token", () => {
    expect(() => consumeHumanToken("not-a-real-token")).toThrow(/人工检测/);
    const started = 1_000_000;
    const { challengeId } = issueHumanChallenge("1.1.1.1", started);
    const { token } = completeHumanChallenge(challengeId, "1.1.1.1", started + HUMAN_CHECK_MIN_DWELL_MS);
    expect(() => consumeHumanToken(token, started + HUMAN_CHECK_MIN_DWELL_MS + HUMAN_CHECK_TTL_MS + 1)).toThrow(HumanCheckError);
  });
});
