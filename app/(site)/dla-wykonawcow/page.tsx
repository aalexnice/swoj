import Link from "next/link";
import { CalendarDays, ClipboardList, Images, MessageSquareQuote, UserRound, Wallet } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { PricingPlans } from "@/components/shared/pricing-plans";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Dla wykonawców — zdobywaj klientów na Śląsku",
  description: "Załóż darmowy profil specjalisty: portfolio, cennik, kalendarz, rezerwacje online i zapytania od klientów z Twojej okolicy.",
  path: "/dla-wykonawcow",
});

const features = [
  { icon: UserRound, t: "Profil, który sprzedaje", d: "Doświadczenie, certyfikaty i opinie w jednym miejscu — jak CV i wizytówka naraz." },
  { icon: Images, t: "Portfolio", d: "Pokaż zdjęcia realizacji. Klienci chętniej wybierają, gdy widzą efekty pracy." },
  { icon: Wallet, t: "Cennik", d: "Ceny „od” i czas trwania usług. Mniej telefonów z pytaniem „ile to kosztuje?”." },
  { icon: CalendarDays, t: "Kalendarz i rezerwacje", d: "Klienci rezerwują wolne terminy sami. Ty tylko potwierdzasz." },
  { icon: ClipboardList, t: "Nowe zlecenia", d: "Zapytania od klientów z Twojej okolicy i kategorii trafiają prosto do panelu." },
  { icon: MessageSquareQuote, t: "Opinie", d: "Tylko od klientów, którzy skorzystali z usługi. Możesz na nie odpowiadać." },
];

export default function ForProvidersPage() {
  return (
    <div className="pb-10">
      <section className="bg-brand-900 text-white">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="text-[38px] font-bold leading-[1.03] text-white sm:text-[56px]">Masz fach w ręku?</h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">
              Stwórz profesjonalny profil i zacznij zdobywać nowych klientów ze Śląska. Założenie profilu zajmuje około 10 minut.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="inverse" size="lg">
                <Link href="/zaloz-profil">Utwórz profil specjalisty</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-white hover:bg-brand-800 hover:text-white">
                <Link href="/logowanie">Mam już konto</Link>
              </Button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            {[
              ["0 zł", "za profil i rezerwacje"],
              ["20", "miast na Śląsku"],
              ["15", "kategorii usług"],
              ["10 min", "na założenie profilu"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-3xl bg-brand-800 p-5">
                <dt className="sr-only">{l}</dt>
                <dd>
                  <span className="block font-display text-3xl font-bold">{v}</span>
                  <span className="text-brand-100">{l}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page mt-16" aria-labelledby="co">
        <h2 id="co" className="section-title">Wszystko, czego potrzebujesz, żeby pracować na swoim</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, t, d }) => (
            <li key={t} className="rounded-3xl border border-line bg-surface p-6">
              <Icon className="size-6 text-brand-700" aria-hidden />
              <h3 className="mt-4 font-sans text-lg font-semibold tracking-normal">{t}</h3>
              <p className="mt-1.5 text-ink-soft">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page mt-16" aria-labelledby="plany">
        <h2 id="plany" className="section-title">Plany</h2>
        <div className="mt-8">
          <PricingPlans />
        </div>
      </section>
    </div>
  );
}
