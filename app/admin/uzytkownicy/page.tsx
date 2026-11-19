import { getRepository } from "@/services/data";
import { demoAccounts } from "@/services/auth/auth-service";
import { DataTable, PageHeader } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";

const roleLabel = { client: "Klient", provider: "Specjalista", admin: "Administrator" } as const;

export default async function AdminUsers() {
  const repo = getRepository();
  const [bookings, slugs] = await Promise.all([repo.listBookings(), repo.listProviderSlugs()]);
  const clients = [...new Set(bookings.map((b) => b.clientName))].map((name) => ({ name, email: `${name.toLowerCase().replace(/\s+/g, ".").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l")}@example.pl`, role: "client" as const }));
  const users = [...demoAccounts.map((a) => ({ name: a.name, email: a.email, role: a.role })), ...clients];
  return (
    <>
      <PageHeader title="Użytkownicy" description={`${users.length + slugs.length} kont (w tym ${slugs.length} specjalistów)`} />
      <DataTable caption="Użytkownicy" head={["Imię i nazwisko", "E-mail", "Rola"]}>
        {users.map((u) => (
          <tr key={u.email}>
            <td className="px-5 py-3 font-medium">{u.name}</td>
            <td className="px-5 py-3">{u.email}</td>
            <td className="px-5 py-3"><Badge size="sm" variant={u.role === "admin" ? "solid" : u.role === "provider" ? "brand" : "neutral"}>{roleLabel[u.role]}</Badge></td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
