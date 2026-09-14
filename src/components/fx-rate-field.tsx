"use client";

import { useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useAdminToast } from "@/components/admin-toast";

export function FxRateField({ defaultValue }: { defaultValue: string }) {
  const toast = useAdminToast();
  const [value, setValue] = useState(defaultValue);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchLatest() {
    setLoading(true);
    setHint("");
    try {
      const response = await fetch("/api/admin/fx/usd-cny");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "获取汇率失败");
      setValue(String(result.rate));
      const text = result.date ? `已填入 ${result.date} 的最新汇率，保存后生效` : "已填入最新汇率，保存后生效";
      setHint(text);
      toast.success(text);
    } catch (error) {
      const text = error instanceof Error ? error.message : "获取汇率失败";
      setHint(text);
      toast.error(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label className="label" htmlFor="usdt_cny_rate">CNY / USDT 汇率</label>
      <div className="flex gap-2">
        <input
          id="usdt_cny_rate"
          name="usdt_cny_rate"
          className="field"
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="7.00"
          required
        />
        <button
          type="button"
          onClick={fetchLatest}
          disabled={loading}
          className="button-secondary shrink-0 px-4 disabled:opacity-50"
        >
          {loading ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          获取最新汇率
        </button>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        1 USD / USDT = 该数值人民币。可手动填写，也可一键拉取。未单独填写美元价的商品，前台 USD 会按此汇率换算。
      </p>
      {hint ? <p className="mt-2 text-xs text-sky-300">{hint}</p> : null}
    </div>
  );
}
