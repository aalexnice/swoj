import Link from "next/link";
import { getRepository } from "@/services/data";
import { DataTable, PageHeader } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { providerTypeLabels } from "@/features/search/search-params";
import { formatRating } from "@/utils/format";

export default async function AdminProviders() {
  const repo = getRepository();
  const slugs = await repo.listProviderSlugs();
  const providers = (await Promise.all(slugs.map((s) => repo.getProviderProfile(s)))).filter((p) => p !== null);
  return (
    <>
      <PageHeader title="Specjaliści" description={`${providers.length} profili`} />
      <DataTable caption="Specjaliści" head={["Specjalista", "Kategoria", "Miasto", "Typ", "Ocena", "Plan", "Status"]}>
        {providers.map((p) => (
          <tr key={p.id}>
            <td className="px-5 py-3">
              <Link href={`/specjalista/${p.slug}`} className="font-medium hover:text-brand-700">
                {p.firstName} {p.lastName}
              </Link>
            </td>
            <td className="px-5 py-3">{p.category.name}</td>
            <td className="px-5 py-3">{p.city.name}</td>
            <td className="px-5 py-3 text-sm">{providerTypeLabels[p.providerType]}</td>
            <td className="px-5 py-3">★ {formatRating(p.ratingAvg)} <span className="text-sm text-muted">({p.reviewCount})</span></td>
            <td className="px-5 py-3"><Badge size="sm" variant={p.plan === "free" ? "neutral" : "brand"}>{p.plan === "free" ? "Free" : p.plan === "pro" ? "PRO" : "PRO+"}</Badge></td>
            <td className="px-5 py-3">{p.verified ? <Badge size="sm" variant="brand">Zweryfikowany</Badge> : <Badge size="sm" variant="warn">Oczekuje</Badge>}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
