import { getRepository } from "@/services/data";
import { DataTable, PageHeader } from "@/components/dashboard/widgets";

export default async function AdminCities() {
  const repo = getRepository();
  const [cities, counts] = await Promise.all([repo.listCities(), repo.countProvidersByCity()]);
  return (
    <>
      <PageHeader title="Miasta" description={`${cities.length} miast województwa śląskiego`} />
      <DataTable caption="Miasta" head={["Miasto", "Odmiana", "Kody pocztowe", "Mieszkańcy", "Specjaliści w zasięgu"]}>
        {cities.map((c) => (
          <tr key={c.slug}>
            <td className="px-5 py-3 font-medium">{c.name}</td>
            <td className="px-5 py-3">{c.locative}</td>
            <td className="px-5 py-3 text-sm">{c.postalPrefixes.join(", ")}</td>
            <td className="px-5 py-3">{c.population.toLocaleString("pl-PL")}</td>
            <td className="px-5 py-3">{counts[c.slug] ?? 0}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
