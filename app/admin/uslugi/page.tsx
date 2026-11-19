import { getRepository } from "@/services/data";
import { DataTable, PageHeader } from "@/components/dashboard/widgets";
import { priceWithUnit } from "@/utils/format";

export default async function AdminServices() {
  const repo = getRepository();
  const categories = await repo.listCategories();
  const slugs = await repo.listProviderSlugs();
  const providers = (await Promise.all(slugs.map((s) => repo.getProviderProfile(s)))).filter((p) => p !== null);
  const services = providers.flatMap((p) => p.services.map((s) => ({ ...s, owner: `${p.firstName} ${p.lastName}` })));
  return (
    <>
      <PageHeader title="Usługi" description={`${services.length} usług w cennikach specjalistów`} />
      <DataTable caption="Usługi" head={["Usługa", "Specjalista", "Kategoria", "Cena", "Opcje"]}>
        {services.map((s) => (
          <tr key={s.id}>
            <td className="px-5 py-3 font-medium">{s.name}</td>
            <td className="px-5 py-3">{s.owner}</td>
            <td className="px-5 py-3">{categories.find((c) => c.slug === s.categorySlug)?.name}</td>
            <td className="whitespace-nowrap px-5 py-3">{priceWithUnit(s.priceFrom, s.priceUnit)}</td>
            <td className="px-5 py-3">{s.options.length}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
