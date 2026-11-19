import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Check, MapPin, MessageSquareQuote, Sparkles, Wallet } from "lucide-react";
import { getRepository } from "@/services/data";
import type { ProviderSummary } from "@/types";
import { siteConfig } from "@/config/site";
import { jsonLd } from "@/lib/seo";
import { countLabel, formatRating } from "@/utils/format";
import { HeroSearch } from "@/components/search/hero-search";
import { ProviderCard, professionLine } from "@/components/providers/provider-card";
import { Avatar } from "@/components/shared/avatar";
import { CategoryIcon } from "@/components/shared/category-icon";
import { availabilityText } from "@/components/shared/status";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const repo = getRepository();
  const [categories, cities, featured, cityCounts] = await Promise.all([
    repo.listCategories(),
    repo.listCities(),
    repo.getFeaturedProviders({ citySlug: "katowice", limit: 8 }),
    repo.countProvidersByCity(),
  ]);
  const heroPeople = [featured.find((p) => p.primaryCategory === "hydraulik"), featured[0], featured.find((p) => p.primaryCategory === "sprzatanie")]
    .filter((p, i, arr): p is ProviderSummary => Boolean(p) && arr.indexOf(p) === i)
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteConfig.name,
            url: siteConfig.url,
            potentialAction: { "@type": "SearchAction", target: `${siteConfig.url}/uslugi?q={search_term_string}`, "query-input": "required name=search_term_string" },
          }),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_80%_10%,var(--color-brand-100),transparent_70%)] opacity-70" />
        <div className="container-page relative grid gap-12 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-surface/80 px-3 py-1 text-sm text-brand-800">
              <MapPin className="size-4" aria-hidden />
              Działamy na Śląsku — od Częstochowy po Bielsko-Białą
            </p>
            <h1 className="mt-5 max-w-[14ch] text-[42px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[60px] lg:text-[68px]">
              Znajdź sprawdzonego człowieka do każdej usługi.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Specjaliści z Twojej okolicy. Opinie, ceny i dostępne terminy w jednym miejscu.
            </p>
            <div className="mt-8 max-w-[720px]">
              <HeroSearch />
            </div>
          </div>

          <div className="relative hidden lg:block" aria-label="Przykładowi specjaliści">
            <ul className="relative mt-6 space-y-4">
              {heroPeople.map((p, i) => (
                <li
                  key={p.id}
                  className="card animate-rise flex items-center gap-4 p-4 pr-5"
                  style={{ marginLeft: `${[24, 0, 48][i]}px`, animationDelay: `${0.15 + i * 0.12}s` }}
                >
                  <Avatar firstName={p.firstName} lastName={p.lastName} hue={p.avatarHue} size={52} />
                  <div className="min-w-0 text-[15px] leading-snug">
                    <Link href={`/specjalista/${p.slug}`} className="font-semibold text-ink hover:text-brand-700">
                      {p.firstName} {p.lastName}
                    </Link>
                    <p className="text-ink-soft">
                      {professionLine(p).toLowerCase()}, {countLabel(p.yearsExperience, ["rok", "lata", "lat"])} doświadczenia
                    </p>
                    <p className="mt-1 flex items-center gap-3 text-sm">
                      <span className="font-semibold"><span className="text-star" aria-hidden>★</span> {formatRating(p.ratingAvg)}</span>
                      <span className="text-muted">{countLabel(p.reviewCount, ["opinia", "opinie", "opinii"])}</span>
                      <span className="text-brand-700">{availabilityText(p.availability, p.gender, true)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 pl-6 text-sm text-muted">Nie szukasz „hydraulika za 100 zł”. Szukasz konkretnej osoby, której możesz zaufać.</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page" aria-labelledby="kategorie">
        <div className="flex items-end justify-between gap-4">
          <h2 id="kategorie" className="section-title">Czego potrzebujesz?</h2>
          <Link href="/uslugi" className="hidden text-[15px] font-medium text-brand-700 hover:underline sm:inline">
            Wszystkie usługi
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/kategoria/${c.slug}`}
                className="flex h-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-colors hover:border-brand-300 hover:bg-brand-50/50 sm:p-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <span className="text-[15px] font-medium leading-tight">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured providers */}
      <section className="container-page mt-20" aria-labelledby="polecani">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="polecani" className="section-title">Polecani specjaliści w Twojej okolicy</h2>
            <p className="mt-2 text-ink-soft">Najwyżej oceniani w Katowicach i okolicy, z wolnymi terminami.</p>
          </div>
          <Link href="/specjalisci" className="hidden shrink-0 text-[15px] font-medium text-brand-700 hover:underline sm:inline">
            Zobacz wszystkich
          </Link>
        </div>
        <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {featured.map((p) => (
            <ProviderCard key={p.id} provider={p} className="w-[86%] shrink-0 snap-start sm:w-auto" />
          ))}
        </div>
      </section>

      {/* Local */}
      <section className="container-page mt-20" aria-labelledby="slask">
        <div className="grid gap-8 rounded-[32px] border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 id="slask" className="section-title">Najpopularniejsze usługi na Śląsku</h2>
            <p className="mt-3 max-w-md text-ink-soft">
              Wybierz miasto, żeby zobaczyć specjalistów, którzy do Ciebie dojadą. Każdy profil pokazuje obszar działania.
            </p>
            <ul className="mt-6 space-y-2 text-[15px]">
              {[
                ["katowice", "hydraulik", "Hydraulik w Katowicach"],
                ["gliwice", "montaz-mebli", "Montaż mebli w Gliwicach"],
                ["jaworzno", "sprzatanie", "Sprzątanie w Jaworznie"],
                ["tychy", "elektryk", "Elektryk w Tychach"],
                ["sosnowiec", "malowanie", "Malowanie w Sosnowcu"],
              ].map(([city, cat, label]) => (
                <li key={label}>
                  <Link href={`/${city}/${cat}`} className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
                    {label}
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <ul className="flex flex-wrap content-start gap-2">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${c.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-4 py-2 text-[15px] text-ink transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  {c.name}
                  <span className="text-sm text-muted">{cityCounts[c.slug] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page mt-20" aria-labelledby="jak">
        <h2 id="jak" className="section-title">Jak to działa?</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { t: "Znajdź", d: "Wyszukaj usługę i wybierz lokalizację." },
            { t: "Wybierz", d: "Porównaj profile, opinie, ceny i dostępność." },
            { t: "Zarezerwuj", d: "Umów termin lub wyślij zapytanie." },
          ].map((s, i) => (
            <li key={s.t} className="relative rounded-3xl border border-line bg-surface p-6">
              <span className="font-display text-5xl font-bold text-brand-200">{i + 1}</span>
              <h3 className="mt-3 text-xl font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-ink-soft">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Describe your problem — AI-ready search */}
      <section className="container-page mt-20" aria-labelledby="opisz">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 id="opisz" className="section-title">Nie wiesz, jak to nazwać? Opisz problem.</h2>
            <p className="mt-3 max-w-lg text-ink-soft">
              Wpisz w wyszukiwarkę zwykłe zdanie. Rozpoznamy rodzaj usługi, miasto i termin, a na górze pokażemy osoby, które mogą przyjść najszybciej.
            </p>
          </div>
          <Link
            href={`/uslugi?q=${encodeURIComponent("Cieknie mi woda pod zlewem i potrzebuję kogoś jutro rano")}&miasto=Katowice`}
            className="card group block p-6 transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <p className="flex items-start gap-3 text-lg leading-snug">
              <MessageSquareQuote className="mt-1 size-5 shrink-0 text-brand-600" aria-hidden />
              „Cieknie mi woda pod zlewem i potrzebuję kogoś jutro rano.”
            </p>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-brand-800">
                <Sparkles className="size-3.5" aria-hidden /> Hydraulik
              </span>
              <span className="rounded-full bg-sunken px-3 py-1 text-ink-soft">Katowice</span>
              <span className="rounded-full bg-sunken px-3 py-1 text-ink-soft">Jutro rano</span>
              <span className="rounded-full bg-warn-soft px-3 py-1 text-warn">Pilne</span>
            </div>
            <span className="mt-5 inline-flex items-center gap-1 text-[15px] font-medium text-brand-700 group-hover:underline">
              Zobacz, kto może przyjść <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </Link>
        </div>
      </section>

      {/* Trust */}
      <section className="container-page mt-20" aria-labelledby="dlaczego">
        <h2 id="dlaczego" className="section-title">Dlaczego SWOJ?</h2>
        <ul className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BadgeCheck, t: "Sprawdzeni specjaliści", d: "Weryfikujemy profile i pomagamy Ci wybrać właściwą osobę." },
            { icon: MessageSquareQuote, t: "Prawdziwe opinie", d: "Opinie pochodzą od osób, które rzeczywiście skorzystały z usługi." },
            { icon: Wallet, t: "Ceny i dostępność", d: "Zobacz ceny i dostępne terminy przed kontaktem." },
            { icon: MapPin, t: "Lokalnie", d: "Znajdź specjalistów blisko Ciebie." },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="border-t-2 border-brand-700 pt-5">
              <Icon className="size-6 text-brand-700" aria-hidden />
              <h3 className="mt-3 font-sans text-lg font-semibold tracking-normal">{t}</h3>
              <p className="mt-1.5 text-ink-soft">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Provider CTA */}
      <section className="container-page mt-24" aria-labelledby="fach">
        <div className="relative overflow-hidden rounded-[32px] bg-brand-900 px-6 py-12 text-white sm:px-12 sm:py-16">
          <div aria-hidden className="absolute -right-24 -top-24 size-[420px] rounded-full border-[56px] border-brand-800" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h2 id="fach" className="font-display text-[34px] font-bold leading-[1.05] text-white sm:text-[48px]">Masz fach w ręku?</h2>
              <p className="mt-4 max-w-lg text-lg text-brand-100">Stwórz profesjonalny profil i zacznij zdobywać nowych klientów.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="inverse" size="lg">
                  <Link href="/zaloz-profil">Utwórz profil specjalisty</Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="text-white hover:bg-brand-800 hover:text-white">
                  <Link href="/dla-wykonawcow">Dowiedz się więcej</Link>
                </Button>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-[15px] text-brand-50">
              {["Darmowy profil", "Portfolio", "Opinie", "Kalendarz", "Rezerwacje", "Nowe zlecenia"].map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <Check className="size-4 text-brand-300" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
