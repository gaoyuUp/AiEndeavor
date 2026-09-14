import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-5 text-center">
      <div>
        <p className="text-sm text-sky-400">404</p>
        <h1 className="mt-3 text-3xl font-semibold">页面不存在</h1>
        <p className="mt-3 text-sm text-slate-400">你访问的页面可能已移动或下架。</p>
        <Link href="/" className="button-secondary mt-6">返回首页</Link>
      </div>
    </main>
  );
}
