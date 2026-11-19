import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BadgeCheck, Briefcase, CalendarDays, Clock, Languages, MapPin, MessageCircle, ShieldCheck, Star } from "lucide-react";
import { getRepository } from "@/services/data";
import { absoluteUrl, buildMetadata, jsonLd } from "@/lib/seo";
import { countLabel, formatDate, formatDuration, formatPrice, formatRating, priceWithUnit } from "@/utils/format";
import { providerTypeLabels } from "@/features/search/search-params";
import { Avatar } from "@/components/shared/avatar";
import { AvailabilityDot, VerifiedBadge } from "@/components/shared/status";
import { Stars } from "@/components/shared/rating";
import { PortfolioArt } from "@/components/shared/portfolio-art";
import { ServiceAreaMap } from "@/components/providers/service-area-map";
import { professionLine } from "@/components/providers/provider-card";
import { Breadcrumbs } from "@/components/seo/landing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function generateStaticParams() {
  return (await getRepository().listProviderSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getRepository().getProviderProfile((await params).slug);
  if (!p) return {};
  return buildMetadata({
    title: `${p.firstName} ${p.lastName} — ${p.category.name}, ${p.city.name}`,
    description: `${p.headline} Ocena ${formatRating(p.ratingAvg)} (${p.reviewCount} opinii), ${p.yearsExperience} lat doświadczenia. Ceny od ${formatPrice(p.priceFrom)}. Zarezerwuj termin online.`,
    path: `/specjalista/${p.slug}`,
  });
}

const dayNames = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

const sections = [
  ["o-mnie", "O mnie"],
  ["uslugi", "Usługi"],
  ["portfolio", "Portfolio"],
  ["opinie", "Opinie"],
  ["dostepnosc", "Dostępność"],
  ["obszar", "Obszar działania"],
] as const;

export default async function ProviderPage({ params }: { params: Promise<{ slug: string }> }) {
  const repo = getRepository();
  const p = await repo.getProviderProfile((await params).slug);
  if (!p) notFound();
  const cities = await repo.listCities();
  const name = `${p.firstName} ${p.lastName}`;
  const bookHref = `/specjalista/${p.slug}/rezerwacja`;
  const askHref = `/zlecenie?specjalista=${p.slug}&kategoria=${p.primaryCategory}&miasto=${p.citySlug}`;
  const maxBreakdown = Math.max(...Object.values(p.ratingBreakdown), 1);

  return (
    <div className="pb-28 md:pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: p.companyName ?? name,
            description: p.headline,
            url: absoluteUrl(`/specjalista/${p.slug}`),
            address: { "@type": "PostalAddress", addressLocality: p.city.name, addressRegion: "śląskie", addressCountry: "PL" },
            areaServed: { "@type": "GeoCircle", geoMidpoint: { "@type": "GeoCoordinates", latitude: p.city.lat, longitude: p.city.lng }, geoRadius: p.serviceRadiusKm * 1000 },
            priceRange: `od ${p.priceFrom} zł`,
            aggregateRating: { "@type": "AggregateRating", ratingValue: p.ratingAvg, reviewCount: p.reviewCount, bestRating: 5 },
            employee: { "@type": "Person", name, jobTitle: p.category.name },
          }),
        }}
      />

      <div className="container-page pt-6">
        <Breadcrumbs
          items={[
            { href: "/", label: "SWOJ" },
            { href: `/${p.citySlug}/${p.primaryCategory}`, label: `${p.category.name} ${p.city.name}` },
            { href: `/specjalista/${p.slug}`, label: name },
          ]}
        />
      </div>

      {/* Profile header */}
      <header className="container-page mt-5">
        <div className="card overflow-hidden">
          <div className="h-24 bg-[linear-gradient(120deg,var(--color-brand-100),var(--color-brand-50)_60%,var(--color-canvas))] sm:h-32" aria-hidden />
          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Avatar firstName={p.firstName} lastName={p.lastName} hue={p.avatarHue} size={112} className="ring-4 ring-surface" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[30px] font-bold leading-tight sm:text-[38px]">{name}</h1>
                    {p.plan !== "free" ? <Badge variant="solid" size="sm">{p.plan === "pro" ? "PRO" : "PRO+"}</Badge> : null}
                  </div>
                  <p className="text-lg font-medium text-ink-soft">{professionLine(p).replace(", ", " | ")}</p>
                  {p.companyName ? <p className="text-[15px] text-muted">{p.companyName}</p> : null}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={bookHref}>
                    <CalendarDays /> Zarezerwuj usługę
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href={askHref}>
                    <MessageCircle /> Wyślij zapytanie
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <a href="#opinie" className="inline-flex items-center gap-2 hover:underline">
                <Stars value={p.ratingAvg} />
                <span className="font-semibold">{formatRating(p.ratingAvg)}</span>
                <span className="text-muted">{countLabel(p.reviewCount, ["opinia", "opinie", "opinii"])}</span>
              </a>
              <span className="inline-flex items-center gap-1.5 text-ink-soft">
                <MapPin className="size-4 text-muted" aria-hidden />
                {p.city.name}
                {p.district ? `, ${p.district}` : ""} + {p.serviceRadiusKm} km
              </span>
              <AvailabilityDot status={p.availability} gender={p.gender} />
              {p.verified ? <VerifiedBadge label="Zweryfikowany profil" /> : null}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-6 sm:grid-cols-4">
              {[
                ["Doświadczenie", countLabel(p.yearsExperience, ["rok", "lata", "lat"])],
                ["Zrealizowane usługi", String(p.completedJobs)],
                ["Czas odpowiedzi", `do ${p.responseTimeHours} godz.`],
                ["Na SWOJ od", String(p.memberSince)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="font-display text-xl font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </header>

      {/* Section nav */}
      <nav aria-label="Sekcje profilu" className="sticky top-16 z-30 mt-6 border-y border-line bg-surface/95 backdrop-blur lg:top-[72px]">
        <ul className="container-page flex gap-1 overflow-x-auto scrollbar-none">
          {sections.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="block whitespace-nowrap border-b-2 border-transparent px-3 py-3.5 text-[15px] text-ink-soft hover:border-brand-300 hover:text-ink">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-12">
          <section id="o-mnie" className="scroll-mt-36" aria-labelledby="h-o-mnie">
            <h2 id="h-o-mnie" className="text-2xl font-semibold">O mnie</h2>
            <p className="mt-2 text-lg font-medium text-ink">{p.headline}</p>
            <p className="mt-3 max-w-[68ch] text-[17px] leading-relaxed text-ink-soft">{p.bio}</p>
          </section>

          <section aria-labelledby="h-dosw">
            <h2 id="h-dosw" className="text-2xl font-semibold">Doświadczenie</h2>
            <ol className="mt-5 space-y-5 border-l-2 border-line pl-6">
              {p.experience.map((e) => (
                <li key={`${e.company}-${e.from}`} className="relative">
                  <span className="absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-surface bg-brand-600" aria-hidden />
                  <p className="font-semibold">{e.role}</p>
                  <p className="text-ink-soft">{e.company}</p>
                  <p className="text-sm text-muted">
                    {e.from} – {e.to ?? "obecnie"}
                  </p>
                  <p className="mt-1 text-[15px] text-ink-soft">{e.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="h-umiej">
            <h2 id="h-umiej" className="text-2xl font-semibold">Umiejętności</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <li key={s} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[15px]">
                  {s}
                </li>
              ))}
            </ul>
            {p.certificates.length ? (
              <>
                <h3 className="mt-8 font-sans text-lg font-semibold tracking-normal">Certyfikaty i uprawnienia</h3>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {p.certificates.map((c) => (
                    <li key={c.name} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
                      <Award className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden />
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-muted">
                          {c.issuer}, {c.year}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          <section id="uslugi" className="scroll-mt-36" aria-labelledby="h-uslugi">
            <h2 id="h-uslugi" className="text-2xl font-semibold">Usługi</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {p.services.map((s) => (
                <li key={s.id} className="card flex flex-col p-5">
                  <h3 className="font-sans text-[17px] font-semibold tracking-normal">{s.name}</h3>
                  <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-ink-soft">{s.description}</p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-semibold">{priceWithUnit(s.priceFrom, s.priceUnit)}</p>
                      <p className="flex items-center gap-1 text-sm text-muted">
                        <Clock className="size-3.5" aria-hidden /> {formatDuration(s.durationMin, s.durationMax)}
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`${bookHref}?usluga=${s.id}`}>Zarezerwuj</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="h-cennik">
            <h2 id="h-cennik" className="text-2xl font-semibold">Cennik</h2>
            <table className="mt-5 w-full overflow-hidden rounded-3xl border border-line bg-surface text-[15px]">
              <caption className="sr-only">Cennik usług {name}</caption>
              <thead className="bg-canvas text-left text-sm text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Usługa</th>
                  <th scope="col" className="hidden px-5 py-3 font-medium sm:table-cell">Czas</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Cena</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {p.services.flatMap((s) => [
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-medium">{s.name}</td>
                    <td className="hidden px-5 py-3 text-ink-soft sm:table-cell">{formatDuration(s.durationMin, s.durationMax)}</td>
                    <td className="px-5 py-3 text-right font-medium">{priceWithUnit(s.priceFrom, s.priceUnit)}</td>
                  </tr>,
                  ...s.options.map((o) => (
                    <tr key={o.id} className="text-ink-soft">
                      <td className="px-5 py-2.5 pl-9 text-sm">+ {o.name}</td>
                      <td className="hidden sm:table-cell" />
                      <td className="px-5 py-2.5 text-right text-sm">+{formatPrice(o.price)}</td>
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
            <p className="mt-2 text-sm text-muted">Ceny brutto „od”. Ostateczna kwota zależy od zakresu prac i jest potwierdzana przed rozpoczęciem.</p>
          </section>

          <section id="portfolio" className="scroll-mt-36" aria-labelledby="h-portfolio">
            <h2 id="h-portfolio" className="text-2xl font-semibold">Portfolio</h2>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {p.portfolio.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                  <div className="aspect-[4/3]">
                    <PortfolioArt item={item} />
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-[15px] font-medium leading-snug">{item.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="opinie" className="scroll-mt-36" aria-labelledby="h-opinie">
            <h2 id="h-opinie" className="text-2xl font-semibold">Opinie</h2>
            <div className="mt-5 grid gap-6 rounded-3xl border border-line bg-surface p-6 sm:grid-cols-[180px_1fr]">
              <div>
                <p className="font-display text-5xl font-bold">{formatRating(p.ratingAvg)}</p>
                <Stars value={p.ratingAvg} size={18} className="mt-2" />
                <p className="mt-1 text-sm text-muted">{countLabel(p.reviewCount, ["opinia", "opinie", "opinii"])}</p>
              </div>
              <ul className="space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((n) => (
                  <li key={n} className="flex items-center gap-3 text-sm">
                    <span className="w-3 text-right">{n}</span>
                    <Star className="size-3.5 text-star" fill="currentColor" strokeWidth={0} aria-hidden />
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
                      <span className="block h-full rounded-full bg-star" style={{ width: `${(p.ratingBreakdown[n] / maxBreakdown) * 100}%` }} />
                    </span>
                    <span className="w-8 text-right text-muted">{p.ratingBreakdown[n]}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="mt-5 space-y-4">
              {p.reviews.map((r) => (
                <li key={r.id} className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars value={r.rating} />
                    <time dateTime={r.date} className="text-sm text-muted">
                      {formatDate(r.date)}
                    </time>
                  </div>
                  <p className="mt-3 text-[17px] leading-relaxed">„{r.text}”</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium">
                      {r.authorName}, {r.authorCity}
                    </span>
                    <span className="text-muted">{r.serviceName}</span>
                    {r.verifiedBooking ? (
                      <span className="inline-flex items-center gap-1 text-brand-700">
                        <ShieldCheck className="size-4" aria-hidden /> Potwierdzona rezerwacja
                      </span>
                    ) : null}
                  </div>
                  {r.reply ? (
                    <div className="mt-4 rounded-2xl bg-canvas p-4 text-[15px]">
                      <p className="font-medium">Odpowiedź specjalisty</p>
                      <p className="mt-1 text-ink-soft">{r.reply}</p>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
            {p.reviewCount > p.reviews.length ? (
              <p className="mt-4 text-sm text-muted">
                Pokazujemy {p.reviews.length} najnowszych z {p.reviewCount} opinii. Opinie może wystawić tylko osoba, która skorzystała z usługi.
              </p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <div className="card hidden p-6 lg:block">
            <p className="text-sm text-muted">Ceny od</p>
            <p className="font-display text-3xl font-bold">{formatPrice(p.priceFrom)}</p>
            <AvailabilityDot status={p.availability} gender={p.gender} className="mt-3" />
            <div className="mt-5 grid gap-2">
              <Button asChild size="lg">
                <Link href={bookHref}>Zarezerwuj termin</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={askHref}>Wyślij zapytanie</Link>
              </Button>
            </div>
            <p className="mt-3 text-center text-sm text-muted">Odpowiada zwykle w ciągu {p.responseTimeHours} godz.</p>
          </div>

          <section id="dostepnosc" className="card scroll-mt-36 p-6" aria-labelledby="h-dost">
            <h2 id="h-dost" className="font-sans text-lg font-semibold tracking-normal">Dostępność</h2>
            <dl className="mt-3 divide-y divide-line text-[15px]">
              {dayNames.map((d, i) => {
                const h = p.weeklyHours.find((w) => w.day === i);
                return (
                  <div key={d} className="flex justify-between py-2">
                    <dt className={h ? "" : "text-muted"}>{d}</dt>
                    <dd className={h ? "font-medium" : "text-muted"}>{h ? `${h.from}–${h.to}` : "nieczynne"}</dd>
                  </div>
                );
              })}
            </dl>
          </section>

          <section id="obszar" className="card scroll-mt-36 p-6" aria-labelledby="h-obszar">
            <h2 id="h-obszar" className="font-sans text-lg font-semibold tracking-normal">Obszar działania</h2>
            <p className="mb-4 mt-1 text-[15px] text-ink-soft">
              {p.city.name} i {p.serviceRadiusKm} km wokół
            </p>
            <ServiceAreaMap base={p.city} radiusKm={p.serviceRadiusKm} cities={cities} />
          </section>

          <section className="card p-6" aria-labelledby="h-info">
            <h2 id="h-info" className="font-sans text-lg font-semibold tracking-normal">Informacje o wykonawcy</h2>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li className="flex gap-3">
                <Briefcase className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                {providerTypeLabels[p.providerType]}
                {p.companyName ? ` — ${p.companyName}` : ""}
              </li>
              <li className="flex gap-3">
                <Languages className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                Języki: {p.languages.join(", ")}
              </li>
              <li className="flex gap-3">
                <BadgeCheck className={`mt-0.5 size-4 shrink-0 ${p.verified ? "text-brand-700" : "text-muted"}`} aria-hidden />
                {p.verified ? "Tożsamość i telefon zweryfikowane przez SWOJ" : "Profil w trakcie weryfikacji"}
              </li>
              {p.providerType === "sole_trader" || p.providerType === "company" ? (
                <li className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                  Wystawia faktury VAT
                </li>
              ) : null}
            </ul>
          </section>
        </aside>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <div className="mr-auto">
            <p className="text-xs text-muted">od</p>
            <p className="font-display text-lg font-semibold leading-none">{formatPrice(p.priceFrom)}</p>
          </div>
          <Button asChild variant="secondary">
            <Link href={askHref}>Zapytaj</Link>
          </Button>
          <Button asChild>
            <Link href={bookHref}>Zarezerwuj</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
