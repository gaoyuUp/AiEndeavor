"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { MAX_PROOF_REJECTIONS, proofSrc } from "@/lib/proofs";

type Proof = { id: string; url: string; createdAt: string };
type Rejection = { id: string; note: string | null; createdAt: string };

export function PaymentProofUploader({
  orderNo,
  queryPassword,
  proofs,
  rejections,
  canUpload,
  orderStatus,
  locale,
  onUploaded,
}: {
  orderNo: string;
  queryPassword: string;
  proofs: Proof[];
  rejections: Rejection[];
  canUpload: boolean;
  orderStatus: string;
  locale: "zh" | "en";
  onUploaded: (proofs: Proof[]) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const remaining = Math.max(0, 2 - files.length);
  const locked = proofs.length > 0;
  const abnormal = orderStatus === "ABNORMAL" || rejections.length >= MAX_PROOF_REJECTIONS;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!files.length || !canUpload) return;
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("orderNo", orderNo);
      form.set("queryPassword", queryPassword);
      for (const file of files.slice(0, 2)) form.append("files", file);
      const response = await fetch("/api/orders/proof", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "上传失败");
      onUploaded(body.proofs);
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="notice-warning mt-5 rounded-xl p-5">
      <h3 className="text-sm font-semibold">{locale === "zh" ? "支付凭证" : "Payment proof"}</h3>

      {rejections.length > 0 && (
        <ol className="mt-3 space-y-2 text-xs leading-6">
          {rejections.map((item, index) => (
            <li key={item.id}>
              {locale === "zh"
                ? `第 ${index + 1} 次上传已被驳回（${new Date(item.createdAt).toLocaleString("zh-CN")}）`
                : `Upload #${index + 1} was rejected (${new Date(item.createdAt).toLocaleString()})`}
              {item.note ? `：${item.note}` : ""}
            </li>
          ))}
        </ol>
      )}

      {abnormal ? (
        <p className="mt-3 text-sm leading-6">
          {locale === "zh"
            ? "凭证已连续 3 次被驳回，当前订单已标记为异常，无法继续上传。请联系售后处理。"
            : "This order was marked abnormal after 3 rejected uploads. Please contact support."}
        </p>
      ) : locked ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {proofs.map((proof) => (
              <a key={proof.id} href={proofSrc(proof.url)} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-current/10 bg-black/10">
                <img src={proofSrc(proof.url)} alt={locale === "zh" ? "支付凭证" : "Payment proof"} className="aspect-[4/3] w-full object-cover" />
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 opacity-80">{locale === "zh" ? "凭证已提交，请等待管理员核对。核对完成前无法再次修改。" : "Proof submitted. You cannot change it until an admin reviews it."}</p>
        </>
      ) : canUpload ? (
        <form onSubmit={submit} className="mt-4 space-y-3">
          {rejections.length > 0 && (
            <p className="text-xs leading-5">
              {locale === "zh"
                ? `请重新上传正确的支付截图。还可尝试 ${MAX_PROOF_REJECTIONS - rejections.length} 次。`
                : `Please upload the correct screenshots. ${MAX_PROOF_REJECTIONS - rejections.length} attempt(s) left.`}
            </p>
          )}
          <div className="relative">
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={loading}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 2))}
            />
            <div className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed border-current/30 px-4 py-6 text-sm">
              <ImagePlus size={16} />
              {files.length
                ? (locale === "zh" ? `已选择 ${files.length} 张，点击可重新选择` : `${files.length} selected, click to change`)
                : (locale === "zh" ? `点击选择支付截图，最多 ${remaining} 张` : `Click to choose images, up to ${remaining}`)}
            </div>
          </div>
          {files.length > 0 && <p className="text-xs opacity-80">{files.map((file) => file.name).join("、")}</p>}
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button className="button-primary w-full disabled:opacity-50" disabled={loading || !files.length}>
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : null}
            {locale === "zh" ? "上传凭证" : "Upload proof"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
