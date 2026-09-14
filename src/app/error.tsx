"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-5 text-center">
      <div>
        <p className="text-sm text-rose-300">发生错误</p>
        <h1 className="mt-3 text-3xl font-semibold">暂时无法加载页面</h1>
        <p className="mt-3 text-sm text-slate-400">请稍后重试，或联系网站客服。</p>
        <button onClick={reset} className="button-secondary mt-6">重新尝试</button>
      </div>
    </main>
  );
}
