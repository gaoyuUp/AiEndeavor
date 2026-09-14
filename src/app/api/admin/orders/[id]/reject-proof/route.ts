import { unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { rejectPaymentProof, StoreError } from "@/lib/orders";

const schema = z.object({
  note: z.string().trim().max(200).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { id } = await params;
  try {
    const body = schema.parse(await request.json().catch(() => ({})));
    const result = await rejectPaymentProof(id, admin.id, body.note);
    for (const imagePath of result.imagePaths) {
      const filename = imagePath.split("/").pop();
      if (!filename) continue;
      await unlink(path.join(process.cwd(), "public", "uploads", "payment-proofs", filename)).catch(() => undefined);
    }
    return NextResponse.json({
      ok: true,
      rejectCount: result.rejectCount,
      abnormal: result.abnormal,
    });
  } catch (error) {
    const status = error instanceof StoreError ? error.status : error instanceof z.ZodError ? 422 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "驳回失败" }, { status });
  }
}
