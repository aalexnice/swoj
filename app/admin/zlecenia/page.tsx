import { getRepository } from "@/services/data";
import { DataTable, PageHeader, RequestStatusBadge } from "@/components/dashboard/widgets";
import { formatDate, formatPrice } from "@/utils/format";

export default async function AdminRequests() {
  const repo = getRepository();
  const [requests, categories, cities] = await Promise.all([repo.listRequests(), repo.listCategories(), repo.listCities()]);
  return (
    <>
      <PageHeader title="Zlecenia" description={`${requests.length} zapytań od klientów`} />
      <DataTable caption="Zlecenia" head={["Tytuł", "Kategoria", "Miasto", "Budżet", "Oferty", "Dodano", "Status"]}>
        {requests.map((r) => (
          <tr key={r.id}>
            <td className="px-5 py-3 font-medium">{r.title}</td>
            <td className="px-5 py-3">{categories.find((c) => c.slug === r.categorySlug)?.name}</td>
            <td className="px-5 py-3">{cities.find((c) => c.slug === r.citySlug)?.name}</td>
            <td className="whitespace-nowrap px-5 py-3">{r.budget ? formatPrice(r.budget) : "—"}</td>
            <td className="px-5 py-3">{r.offersCount}</td>
            <td className="whitespace-nowrap px-5 py-3 text-sm">{formatDate(r.createdAt)}</td>
            <td className="px-5 py-3"><RequestStatusBadge status={r.status} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
