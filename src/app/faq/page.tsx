import type { Metadata } from "next";
import { StoreShell } from "@/components/store-shell";
import { db } from "@/lib/db";
import { getPreferences } from "@/lib/preferences";

export const metadata: Metadata = { title: "常见问题" };
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const { locale } = await getPreferences();
  const faqs = await db.faq.findMany({ where: { status: "ACTIVE" }, orderBy: { sort: "asc" } });
  return (
    <StoreShell>
      <section className="container-shell py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-400">FAQ</p>
          <h1 className="mt-3 text-4xl font-semibold">{locale === "zh" ? "常见问题" : "Frequently asked questions"}</h1>
          <div className="mt-9 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.id} className="card group p-5">
                <summary className="cursor-pointer list-none pr-8 text-sm font-medium">
                  {locale === "zh" ? faq.questionZh : faq.questionEn}
                </summary>
                <div className="prose-copy mt-4 border-t border-white/8 pt-4 text-sm">{locale === "zh" ? faq.answerZh : faq.answerEn}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
