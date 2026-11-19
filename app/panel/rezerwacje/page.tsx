import { getRepository } from "@/services/data";
import { getCurrentProvider } from "@/features/dashboard/current-provider";
import { BookingStatusBadge, DataTable, DemoNote, PageHeader } from "@/components/dashboard/widgets";
import { DemoActionButton } from "@/components/dashboard/demo-actions";
import { formatPrice, formatShortDate } from "@/utils/format";
import { isoDayFromToday } from "@/utils/dates";

export default async function BookingsPage() {
  const { provider } = await getCurrentProvider();
  const bookings = await getRepository().listBookings({ providerId: provider.id });
  const serviceName = (id: string) => provider.services.find((s) => s.id === id)?.name ?? "Usługa";
  const today = isoDayFromToday();
  const upcoming = bookings.filter((b) => b.date >= today);
  const past = bookings.filter((b) => b.date < today).reverse();

  return (
    <>
      <PageHeader title="Rezerwacje" description="Potwierdzaj nowe terminy i sprawdzaj historię wizyt." />
      {[
        ["Nadchodzące", upcoming],
        ["Historia", past],
      ].map(([title, list]) => (
        <section key={title as string} className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">{title as string}</h2>
          <DataTable caption={title as string} head={["Termin", "Usługa", "Klient", "Kwota", "Status", ""]}>
            {(list as typeof bookings).map((b) => (
              <tr key={b.id}>
                <td className="whitespace-nowrap px-5 py-3.5">
                  <span className="font-medium first-letter:uppercase">{formatShortDate(b.date)}</span>
                  <span className="block text-sm text-muted">{b.time}</span>
                </td>
                <td className="px-5 py-3.5">{serviceName(b.serviceId)}</td>
                <td className="px-5 py-3.5">
                  {b.clientName}
                  <span className="block text-sm text-muted">{b.address}</span>
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 font-medium">{formatPrice(b.total)}</td>
                <td className="px-5 py-3.5">
                  <BookingStatusBadge status={b.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  {b.status === "pending" ? <DemoActionButton label="Potwierdź" doneLabel="Potwierdzono" /> : null}
                </td>
              </tr>
            ))}
          </DataTable>
        </section>
      ))}
      <DemoNote>Wersja demonstracyjna: potwierdzenie nie wysyła jeszcze SMS-a do klienta.</DemoNote>
    </>
  );
}
