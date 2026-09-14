import { HUMAN_CHECK_MIN_DWELL_MS, HUMAN_CHECK_TTL_MS } from "./human-check-constants";
import { hashToken, randomToken } from "./security";

export { HUMAN_CHECK_MIN_DWELL_MS, HUMAN_CHECK_TTL_MS };

type Challenge = {
  createdAt: number;
  completedAt?: number;
  consumed: boolean;
  ip: string;
};

type TokenRecord = {
  challengeId: string;
  createdAt: number;
  consumed: boolean;
  ip: string;
};

const globalStore = globalThis as unknown as {
  humanCheckChallenges?: Map<string, Challenge>;
  humanCheckTokens?: Map<string, TokenRecord>;
};

const challenges = globalStore.humanCheckChallenges ?? new Map<string, Challenge>();
const tokens = globalStore.humanCheckTokens ?? new Map<string, TokenRecord>();

if (process.env.NODE_ENV !== "production") {
  globalStore.humanCheckChallenges = challenges;
  globalStore.humanCheckTokens = tokens;
}

export class HumanCheckError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "HumanCheckError";
    this.status = status;
  }
}

function prune(now: number) {
  for (const [id, challenge] of challenges) {
    if (now - challenge.createdAt > HUMAN_CHECK_TTL_MS) challenges.delete(id);
  }
  for (const [hash, record] of tokens) {
    if (record.consumed || now - record.createdAt > HUMAN_CHECK_TTL_MS) tokens.delete(hash);
  }
}

export function issueHumanChallenge(ip: string, now = Date.now()) {
  prune(now);
  const challengeId = randomToken(16);
  challenges.set(challengeId, { createdAt: now, consumed: false, ip });
  return { challengeId };
}

export function completeHumanChallenge(challengeId: string, ip: string, now = Date.now()) {
  prune(now);
  const challenge = challenges.get(challengeId);
  if (!challenge || now - challenge.createdAt > HUMAN_CHECK_TTL_MS) {
    throw new HumanCheckError("人工检测已过期，请重新点击", 400);
  }
  if (challenge.consumed || challenge.completedAt) {
    throw new HumanCheckError("请勿重复点击，刷新页面后再试", 409);
  }
  if (now - challenge.createdAt < HUMAN_CHECK_MIN_DWELL_MS) {
    throw new HumanCheckError("请稍后再点击完成人工检测", 400);
  }

  const token = randomToken(24);
  challenge.completedAt = now;
  tokens.set(hashToken(token), { challengeId, createdAt: now, consumed: false, ip });
  return { token };
}

export function consumeHumanToken(token: string, now = Date.now()) {
  prune(now);
  const record = tokens.get(hashToken(token));
  if (!record || record.consumed || now - record.createdAt > HUMAN_CHECK_TTL_MS) {
    throw new HumanCheckError("请先点击完成人工检测", 403);
  }

  record.consumed = true;
  tokens.delete(hashToken(token));
  const challenge = challenges.get(record.challengeId);
  if (challenge) challenge.consumed = true;
  return true;
}

export function resetHumanCheckStore() {
  challenges.clear();
  tokens.clear();
}
