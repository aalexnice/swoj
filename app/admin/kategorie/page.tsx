import { getRepository } from "@/services/data";
import { DataTable, PageHeader } from "@/components/dashboard/widgets";
import { CategoryIcon } from "@/components/shared/category-icon";
import { formatPrice } from "@/utils/format";

export default async function AdminCategories() {
  const categories = await getRepository().listCategories();
  return (
    <>
      <PageHeader title="Kategorie" description={`${categories.length} kategorii`} />
      <DataTable caption="Kategorie" head={["Kategoria", "Slug", "Nagłówek SEO", "Średnia cena od", "Słowa kluczowe"]}>
        {categories.map((c) => (
          <tr key={c.slug}>
            <td className="px-5 py-3"><span className="inline-flex items-center gap-2 font-medium"><CategoryIcon name={c.icon} className="size-4 text-brand-700" />{c.name}</span></td>
            <td className="px-5 py-3 text-sm text-muted">{c.slug}</td>
            <td className="px-5 py-3">{c.seoPlural}</td>
            <td className="px-5 py-3">{formatPrice(c.avgPriceFrom)}</td>
            <td className="max-w-xs px-5 py-3 text-sm text-ink-soft">{c.keywords.slice(0, 5).join(", ")}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
