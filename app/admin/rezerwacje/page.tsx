import { getRepository } from "@/services/data";
import { BookingStatusBadge, DataTable, PageHeader } from "@/components/dashboard/widgets";
import { formatPrice, formatShortDate } from "@/utils/format";

export default async function AdminBookings() {
  const repo = getRepository();
  const bookings = await repo.listBookings();
  const slugs = await repo.listProviderSlugs();
  const providers = (await Promise.all(slugs.map((s) => repo.getProviderProfile(s)))).filter((p) => p !== null);
  const byId = new Map(providers.map((p) => [p.id, p]));
  return (
    <>
      <PageHeader title="Rezerwacje" description={`${bookings.length} rezerwacji`} />
      <DataTable caption="Rezerwacje" head={["ID", "Termin", "Specjalista", "Usługa", "Klient", "Kwota", "Status"]}>
        {bookings.map((b) => {
          const p = byId.get(b.providerId);
          return (
            <tr key={b.id}>
              <td className="px-5 py-3 text-sm text-muted">{b.id}</td>
              <td className="whitespace-nowrap px-5 py-3">{formatShortDate(b.date)}, {b.time}</td>
              <td className="px-5 py-3">{p ? `${p.firstName} ${p.lastName}` : b.providerId}</td>
              <td className="px-5 py-3">{p?.services.find((s) => s.id === b.serviceId)?.name}</td>
              <td className="px-5 py-3">{b.clientName}</td>
              <td className="whitespace-nowrap px-5 py-3">{formatPrice(b.total)}</td>
              <td className="px-5 py-3"><BookingStatusBadge status={b.status} /></td>
            </tr>
          );
        })}
      </DataTable>
    </>
  );
}
