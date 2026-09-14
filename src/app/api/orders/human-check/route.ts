import { NextResponse } from "next/server";
import { z } from "zod";
import { HumanCheckError, completeHumanChallenge, issueHumanChallenge } from "@/lib/human-check";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const completeSchema = z.object({
  challengeId: z.string().min(8).max(80),
});

export async function GET(request: Request) {
  const ip = requestIp(request);
  if (!rateLimit(`human-check-issue:${ip}`, 20, 60_000).allowed) {
    return NextResponse.json({ error: "操作过于频繁，请稍后再试" }, { status: 429 });
  }
  return NextResponse.json(issueHumanChallenge(ip));
}

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    if (!rateLimit(`human-check-complete:${ip}`, 20, 60_000).allowed) {
      return NextResponse.json({ error: "操作过于频繁，请稍后再试" }, { status: 429 });
    }
    const { challengeId } = completeSchema.parse(await request.json());
    return NextResponse.json(completeHumanChallenge(challengeId, ip));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "人工检测无效，请重新点击" }, { status: 422 });
    }
    const status = error instanceof HumanCheckError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "人工检测失败" }, { status });
  }
}
