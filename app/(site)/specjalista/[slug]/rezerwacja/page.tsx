import { notFound } from "next/navigation";
import { getRepository } from "@/services/data";
import { buildMetadata } from "@/lib/seo";
import { BookingFlow } from "@/features/booking/booking-flow";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ usluga?: string }> };

export async function generateMetadata({ params }: Props) {
  const p = await getRepository().getProviderProfile((await params).slug);
  if (!p) return {};
  return buildMetadata({
    title: `Rezerwacja — ${p.firstName} ${p.lastName}`,
    description: `Zarezerwuj termin u: ${p.firstName} ${p.lastName}, ${p.category.name.toLowerCase()}, ${p.city.name}.`,
    path: `/specjalista/${p.slug}/rezerwacja`,
    noIndex: true,
  });
}

export default async function BookingPage({ params, searchParams }: Props) {
  const [{ slug }, { usluga }] = await Promise.all([params, searchParams]);
  const p = await getRepository().getProviderProfile(slug);
  if (!p) notFound();
  return (
    <div className="container-page pb-16 pt-6 sm:pt-10">
      <BookingFlow
        provider={{
          id: p.id,
          slug: p.slug,
          firstName: p.firstName,
          lastName: p.lastName,
          avatarHue: p.avatarHue,
          categoryName: p.category.name,
          cityName: p.city.name,
          weeklyHours: p.weeklyHours,
        }}
        services={p.services}
        initialServiceId={usluga}
      />
    </div>
  );
}
