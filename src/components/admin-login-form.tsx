"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogIn } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "登录失败");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card w-full max-w-sm p-7">
      <BrandMark size={48} className="mb-5" />
      <h1 className="text-xl font-semibold">管理后台</h1>
      <p className="mt-2 text-sm text-slate-400">使用管理员账号登录灵搜AI。</p>
      <div className="mt-6">
        <label className="label" htmlFor="email">邮箱</label>
        <input id="email" name="email" className="field" type="email" required autoComplete="username" />
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="password">密码</label>
        <input id="password" name="password" className="field" type="password" required autoComplete="current-password" />
      </div>
      {error && <p className="mt-4 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}
      <button className="button-primary mt-5 w-full" disabled={loading}>
        {loading ? <LoaderCircle size={16} className="animate-spin" /> : <LogIn size={16} />}
        {loading ? "正在登录" : "登录"}
      </button>
    </form>
  );
}
