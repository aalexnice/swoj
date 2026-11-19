import { getRepository } from "@/services/data";
import { getCurrentProvider } from "@/features/dashboard/current-provider";
import { BookingStatusBadge, DemoNote, PageHeader } from "@/components/dashboard/widgets";
import { cn } from "@/lib/utils";
import { isoDayFromToday } from "@/utils/dates";

const dayNames = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];


export default async function CalendarPage() {
  const { provider } = await getCurrentProvider();
  const bookings = await getRepository().listBookings({ providerId: provider.id });
  const days = Array.from({ length: 14 }, (_, i) => isoDayFromToday(i));
  const serviceName = (id: string) => provider.services.find((s) => s.id === id)?.name ?? "Usługa";

  return (
    <>
      <PageHeader title="Kalendarz" description="Twoje godziny pracy i rezerwacje na najbliższe 2 tygodnie." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((d, i) => {
          const date = new Date(`${d}T12:00:00`);
          const weekday = (date.getDay() + 6) % 7;
          const hours = provider.weeklyHours.find((h) => h.day === weekday);
          const dayBookings = bookings.filter((b) => b.date === d && b.status !== "cancelled");
          return (
            <section key={d} className={cn("min-h-40 rounded-2xl border p-3", hours ? "border-line bg-surface" : "border-transparent bg-sunken")} aria-label={d}>
              <p className="text-sm font-semibold">
                {i === 0 ? "Dziś" : dayNames[weekday]} <span className="font-normal text-muted">{date.getDate()}.{String(date.getMonth() + 1).padStart(2, "0")}</span>
              </p>
              <p className="text-xs text-muted">{hours ? `${hours.from}–${hours.to}` : "Dzień wolny"}</p>
              <ul className="mt-3 space-y-2">
                {dayBookings.map((b) => (
                  <li key={b.id} className="rounded-xl border-l-4 border-brand-600 bg-brand-50 p-2 text-sm">
                    <p className="font-semibold">{b.time}</p>
                    <p className="leading-snug">{serviceName(b.serviceId)}</p>
                    <div className="mt-1">
                      <BookingStatusBadge status={b.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <DemoNote>Integracja z Google Calendar i blokowanie pojedynczych dni pojawią się po podłączeniu bazy danych (tabela availability).</DemoNote>
    </>
  );
}
