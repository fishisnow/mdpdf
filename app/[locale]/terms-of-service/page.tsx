import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.terms" });
  return pageMetadata({
    locale,
    href: "/terms-of-service",
    title: t("title"),
    description: t("description"),
    type: "article",
  });
}

function Paragraphs({ values }: { values: string[] }) {
  return (
    <div className="mt-4 space-y-4">
      {values.map((value) => (
        <p key={value}>{value}</p>
      ))}
    </div>
  );
}

export default async function TermsOfServicePage() {
  const t = await getTranslations("terms");
  const c = await getTranslations("common");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-12 md:py-16">
      <nav className="mb-6">
        <Link href="/" className="text-sm text-foreground underline decoration-2 hover:underline">
          {c("backToHome")}
        </Link>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-heading sm:text-4xl">{t("h1")}</h1>
        <p className="mt-3 text-sm leading-7 text-foreground/70 sm:text-base">{t("intro1")}</p>
        <p className="mt-3 text-sm leading-7 text-foreground/70 sm:text-base">{t("intro2")}</p>
      </div>

      <div className="space-y-10 text-sm leading-7 text-foreground/80 sm:text-base">
        <section>
          <h2 className="text-xl font-heading">{t("s1Title")}</h2>
          <Paragraphs values={[t("s1P1")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s2Title")}</h2>
          <Paragraphs values={[t("s2P1"), t("s2P2")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s3Title")}</h2>
          <div className="mt-4 space-y-4">
            <p>{t("s3P1")}</p>
            <ul className="list-disc space-y-2 ps-6">
              {(t.raw("s3Items") as string[]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s4Title")}</h2>
          <Paragraphs values={[t("s4P1"), t("s4P2")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s5Title")}</h2>
          <Paragraphs values={[t("s5P1"), t("s5P2")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s6Title")}</h2>
          <Paragraphs values={[t("s6P1")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s7Title")}</h2>
          <Paragraphs values={[t("s7P1"), t("s7P2")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s8Title")}</h2>
          <Paragraphs values={[t("s8P1"), t("s8P2")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s9Title")}</h2>
          <Paragraphs values={[t("s9P1")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s10Title")}</h2>
          <Paragraphs values={[t("s10P1")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s11Title")}</h2>
          <Paragraphs values={[t("s11P1"), t("s11P2")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s12Title")}</h2>
          <Paragraphs values={[t("s12P1")]} />
        </section>
        <section>
          <h2 className="text-xl font-heading">{t("s13Title")}</h2>
          <Paragraphs values={[t("s13P1")]} />
        </section>
      </div>
    </main>
  );
}
