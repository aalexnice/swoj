import { buildMetadata } from "@/lib/seo";
import { PricingPlans } from "@/components/shared/pricing-plans";

export const metadata = buildMetadata({
  title: "Cennik dla specjalistów",
  description: "Darmowy profil specjalisty albo plan PRO i PRO+ z większą liczbą zapytań i wyróżnieniem w wynikach.",
  path: "/cennik",
});

const fees = [
  ["Prowizja od rezerwacji online", "0% w okresie startowym", "Docelowo 5% od rezerwacji opłaconej przez SWOJ."],
  ["Opłata za kontakt (lead)", "od 4 zł", "Tylko w planie Free, po wykorzystaniu limitu odpowiedzi na zapytania."],
  ["Wyróżniony profil", "od 29 zł / tydz.", "Pierwsze miejsca w wynikach w wybranym mieście i kategorii."],
  ["Opłata serwisowa klienta", "0 zł", "Klienci rezerwują bez dodatkowych opłat."],
];

export default function PricingPage() {
  return (
    <div className="container-page pb-10 pt-10 sm:pt-16">
      <h1 className="max-w-3xl text-[36px] font-bold leading-[1.05] sm:text-[52px]">Prosty cennik. Profil zawsze za darmo.</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        Zacznij bez opłat. Przejdź na PRO, kiedy chcesz odpowiadać na więcej zapytań i być wyżej w wynikach. Bez umowy — rezygnujesz w dowolnym momencie.
      </p>
      <div className="mt-10">
        <PricingPlans />
      </div>
      <section className="mt-16" aria-labelledby="oplaty">
        <h2 id="oplaty" className="text-2xl font-semibold">Pozostałe opłaty</h2>
        <div className="mt-5 overflow-hidden rounded-3xl border border-line bg-surface">
          <table className="w-full text-[15px]">
            <caption className="sr-only">Pozostałe opłaty</caption>
            <tbody className="divide-y divide-line">
              {fees.map(([name, price, desc]) => (
                <tr key={name}>
                  <th scope="row" className="px-5 py-4 text-left font-medium">
                    {name}
                    <span className="mt-0.5 block text-sm font-normal text-muted">{desc}</span>
                  </th>
                  <td className="px-5 py-4 text-right font-semibold whitespace-nowrap">{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">Ceny brutto. Płatności online zostaną uruchomione w kolejnej wersji serwisu.</p>
      </section>
    </div>
  );
}
