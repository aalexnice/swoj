import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";

export const metadata = buildMetadata({
  title: "Jak to działa?",
  description: "Znajdź specjalistę, porównaj profile i zarezerwuj termin albo wyślij zapytanie. Tak działa SWOJ.",
  path: "/jak-to-dziala",
});

const clientSteps = [
  ["Czego potrzebujesz?", "Wpisz usługę albo opisz problem własnymi słowami, np. „cieknie kran w kuchni”."],
  ["Gdzie?", "Podaj miasto lub kod pocztowy. Pokażemy osoby, które do Ciebie dojadą."],
  ["Znajdź", "Zobacz specjalistów z okolicy: ich doświadczenie, oceny i ceny „od”."],
  ["Porównaj", "Przejrzyj profile, portfolio i prawdziwe opinie. Sprawdź, kto ma wolny termin."],
  ["Zarezerwuj", "Wybierz usługę i godzinę albo wyślij zapytanie z opisem i zdjęciami."],
];

const twoWays = [
  {
    t: "Rezerwacja",
    d: "Dla standardowych usług z jasną ceną: sprzątanie, montaż lampy, strzyżenie, spacer z psem.",
    s: ["Wybierasz usługę i opcje", "Wybierasz datę i godzinę", "Podajesz adres", "Specjalista potwierdza termin"],
    cta: ["/uslugi", "Znajdź usługę"],
  },
  {
    t: "Zapytanie",
    d: "Dla nietypowych zadań, które trzeba wycenić: remont łazienki, przeprowadzka, montaż kuchni.",
    s: ["Opisujesz zadanie i dodajesz zdjęcia", "Podajesz termin i budżet", "Specjaliści wysyłają propozycje", "Wybierasz najlepszą ofertę"],
    cta: ["/zlecenie", "Wyślij zapytanie"],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container-page pb-10 pt-10 sm:pt-16">
      <h1 className="max-w-3xl text-[36px] font-bold leading-[1.05] sm:text-[52px]">Jak to działa?</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">Nie musisz wiedzieć, jak działa marketplace. Wystarczy, że wiesz, czego potrzebujesz.</p>

      <ol className="mt-12 grid gap-4 md:grid-cols-5">
        {clientSteps.map(([t, d], i) => (
          <li key={t} className="rounded-3xl border border-line bg-surface p-5">
            <span className="font-display text-4xl font-bold text-brand-200">{i + 1}</span>
            <h2 className="mt-2 text-lg font-semibold">{t}</h2>
            <p className="mt-1 text-[15px] text-ink-soft">{d}</p>
          </li>
        ))}
      </ol>

      <section className="mt-16" aria-labelledby="dwa">
        <h2 id="dwa" className="section-title">Dwa sposoby zamówienia</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {twoWays.map((w) => (
            <div key={w.t} className="card flex flex-col p-7">
              <h3 className="text-2xl font-semibold">{w.t}</h3>
              <p className="mt-2 text-ink-soft">{w.d}</p>
              <ol className="mt-5 flex-1 space-y-2.5">
                {w.s.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-800">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <Button asChild className="mt-7 self-start">
                <Link href={w.cta[0]}>{w.cta[1]}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-8 rounded-[32px] border border-line bg-surface p-8 sm:p-10 lg:grid-cols-2" aria-labelledby="zaufanie">
        <h2 id="zaufanie" className="section-title">Jak dbamy o zaufanie</h2>
        <ul className="space-y-4 text-[17px]">
          <li><strong className="font-semibold">Weryfikacja profili.</strong> Sprawdzamy telefon i tożsamość, a w zawodach z uprawnieniami — certyfikaty.</li>
          <li><strong className="font-semibold">Opinie tylko po usłudze.</strong> Ocenić specjalistę może wyłącznie osoba, która skorzystała z rezerwacji.</li>
          <li><strong className="font-semibold">Jasne ceny.</strong> Każda usługa ma cenę „od” i szacowany czas, zanim się skontaktujesz.</li>
          <li><strong className="font-semibold">Zgłoszenia.</strong> Każdy profil i opinię możesz zgłosić do moderacji.</li>
        </ul>
      </section>
    </div>
  );
}
