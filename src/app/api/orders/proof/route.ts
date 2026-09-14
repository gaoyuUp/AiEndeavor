import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertOrderAccess, StoreError } from "@/lib/orders";
import { MAX_PROOF_REJECTIONS } from "@/lib/proofs";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const maxFiles = 2;
const maxBytes = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    if (!rateLimit(`proof:${requestIp(request)}`, 10, 60_000).allowed) {
      return NextResponse.json({ error: "上传过于频繁，请稍后再试" }, { status: 429 });
    }
    const form = await request.formData();
    const orderNo = String(form.get("orderNo") ?? "");
    const queryPassword = String(form.get("queryPassword") ?? "");
    const files = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
    if (!orderNo || queryPassword.length < 6) throw new StoreError("订单号或查询密码不正确", 422);
    if (!files.length) throw new StoreError("请选择至少一张支付凭证", 422);

    const order = await assertOrderAccess(orderNo, queryPassword);
    if (order.orderStatus === "ABNORMAL" || order.proofRejections.length >= MAX_PROOF_REJECTIONS) {
      throw new StoreError("凭证已被驳回三次，请联系售后处理", 409);
    }
    if (order.orderStatus !== "PAYMENT_REVIEW" || !order.proofRequested) {
      throw new StoreError("当前订单暂不需要上传支付凭证", 409);
    }
    if (order.paymentProofs.length > 0) {
      throw new StoreError("凭证已提交，请等待管理员核对", 409);
    }
    if (files.length > maxFiles) {
      throw new StoreError(`最多上传 ${maxFiles} 张支付凭证`, 422);
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "payment-proofs");
    await mkdir(uploadDir, { recursive: true });
    const created = [];
    for (const file of files) {
      const ext = allowedTypes.get(file.type);
      if (!ext) throw new StoreError("仅支持 jpg、png、webp 图片", 422);
      if (file.size > maxBytes) throw new StoreError("单张凭证不能超过 2MB", 422);
      const filename = `${order.id}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
      created.push(await db.paymentProof.create({
        data: { orderId: order.id, imagePath: `/api/uploads/payment-proofs/${filename}` },
      }));
    }

    return NextResponse.json({
      ok: true,
      proofs: created.map((proof) => ({ id: proof.id, url: proof.imagePath, createdAt: proof.createdAt })),
    }, { status: 201 });
  } catch (error) {
    const status = error instanceof StoreError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "上传失败" }, { status });
  }
}
