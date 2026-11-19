import { getRepository } from "@/services/data";
import { DataTable, PageHeader } from "@/components/dashboard/widgets";
import { DemoActionButton } from "@/components/dashboard/demo-actions";
import { formatDate } from "@/utils/format";

export default async function AdminReviews() {
  const reviews = await getRepository().listReviews();
  return (
    <>
      <PageHeader title="Opinie" description={`${reviews.length} opinii w bazie demonstracyjnej`} />
      <DataTable caption="Opinie" head={["Ocena", "Treść", "Autor", "Data", "Rezerwacja", ""]}>
        {reviews.map((r) => (
          <tr key={r.id}>
            <td className="px-5 py-3 whitespace-nowrap">{"★".repeat(r.rating)}</td>
            <td className="max-w-md px-5 py-3">{r.text}</td>
            <td className="px-5 py-3">{r.authorName}, {r.authorCity}</td>
            <td className="whitespace-nowrap px-5 py-3 text-sm">{formatDate(r.date)}</td>
            <td className="px-5 py-3 text-sm">{r.verifiedBooking ? "Potwierdzona" : "—"}</td>
            <td className="px-5 py-3"><DemoActionButton label="Ukryj" doneLabel="Ukryto" variant="ghost" /></td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
