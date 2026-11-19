import { getRepository } from "@/services/data";
import { DataTable, DemoNote, PageHeader } from "@/components/dashboard/widgets";
import { DemoActionButton } from "@/components/dashboard/demo-actions";

export default async function AdminVerification() {
  const repo = getRepository();
  const slugs = await repo.listProviderSlugs();
  const providers = (await Promise.all(slugs.map((s) => repo.getProviderProfile(s)))).filter((p) => p !== null && !p.verified);
  return (
    <>
      <PageHeader title="Weryfikacja" description="Profile oczekujące na sprawdzenie tożsamości i uprawnień." />
      <DataTable caption="Weryfikacja" head={["Specjalista", "Kategoria", "Miasto", "Dokumenty", ""]}>
        {providers.map((p) => (
          <tr key={p!.id}>
            <td className="px-5 py-3 font-medium">{p!.firstName} {p!.lastName}</td>
            <td className="px-5 py-3">{p!.category.name}</td>
            <td className="px-5 py-3">{p!.city.name}</td>
            <td className="px-5 py-3 text-sm">Dowód osobisty, numer telefonu</td>
            <td className="space-x-2 whitespace-nowrap px-5 py-3">
              <DemoActionButton label="Zatwierdź" doneLabel="Zatwierdzono" />
            </td>
          </tr>
        ))}
      </DataTable>
      <DemoNote>Dokumenty będą przechowywane w prywatnym buckecie Supabase Storage, widocznym tylko dla administratorów.</DemoNote>
    </>
  );
}
