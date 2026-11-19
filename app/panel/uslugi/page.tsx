import { getCurrentProvider } from "@/features/dashboard/current-provider";
import { DataTable, DemoNote, PageHeader } from "@/components/dashboard/widgets";
import { DemoComposeSheet } from "@/components/dashboard/demo-actions";
import { formatDuration, priceWithUnit } from "@/utils/format";
import { categoriesBySlug } from "@/data/categories";

export default async function ServicesPage() {
  const { provider } = await getCurrentProvider();
  return (
    <>
      <PageHeader
        title="Usługi"
        description="To, co klienci mogą zarezerwować bezpośrednio z Twojego profilu."
        action={<DemoComposeSheet trigger="Dodaj usługę" title="Nowa usługa" withPrice placeholder="Nazwa i opis usługi" submitLabel="Zapisz usługę" doneLabel="Usługa dodana" />}
      />
      <DataTable caption="Usługi" head={["Usługa", "Kategoria", "Czas", "Cena", "Opcje"]}>
        {provider.services.map((s) => (
          <tr key={s.id}>
            <td className="px-5 py-3.5">
              <span className="font-medium">{s.name}</span>
              <span className="block max-w-md text-sm text-muted">{s.description}</span>
            </td>
            <td className="px-5 py-3.5">{categoriesBySlug.get(s.categorySlug)?.name}</td>
            <td className="whitespace-nowrap px-5 py-3.5">{formatDuration(s.durationMin, s.durationMax)}</td>
            <td className="whitespace-nowrap px-5 py-3.5 font-medium">{priceWithUnit(s.priceFrom, s.priceUnit)}</td>
            <td className="px-5 py-3.5 text-sm text-ink-soft">{s.options.length ? s.options.map((o) => o.name).join(", ") : "—"}</td>
          </tr>
        ))}
      </DataTable>
      <DemoNote>Edycja usług zapisuje dane w tabelach services i service_options po podłączeniu Supabase.</DemoNote>
    </>
  );
}
