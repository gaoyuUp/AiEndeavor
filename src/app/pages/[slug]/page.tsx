import { notFound } from "next/navigation";
import { StoreShell } from "@/components/store-shell";
import { db } from "@/lib/db";
import { getPreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

export default async function ContentPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { locale }] = await Promise.all([params, getPreferences()]);
  const page = await db.contentPage.findFirst({ where: { slug, status: "ACTIVE" } });
  if (!page) notFound();
  return (
    <StoreShell>
      <article className="container-shell py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-semibold">{locale === "zh" ? page.titleZh : page.titleEn}</h1>
          <div className="prose-copy mt-8 text-sm">{locale === "zh" ? page.contentZh : page.contentEn}</div>
        </div>
      </article>
    </StoreShell>
  );
}
