import Link from "next/link";
import { getCurrentProvider } from "@/features/dashboard/current-provider";
import { ProfileForm } from "@/features/dashboard/profile-form";
import { PageHeader } from "@/components/dashboard/widgets";
import { Avatar } from "@/components/shared/avatar";
import { VerifiedBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const { provider } = await getCurrentProvider();
  return (
    <>
      <PageHeader
        title="Profil"
        description="Tak widzą Cię klienci. Dobry opis i aktualne umiejętności zwiększają liczbę zapytań."
        action={
          <Button asChild variant="secondary">
            <Link href={`/specjalista/${provider.slug}`}>Podgląd profilu</Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <ProfileForm
          defaults={{ headline: provider.headline, bio: provider.bio, radiusKm: provider.serviceRadiusKm, skills: provider.skills.join(", ") }}
        />
        <aside className="card h-fit p-6 text-center">
          <Avatar firstName={provider.firstName} lastName={provider.lastName} hue={provider.avatarHue} size={96} className="mx-auto" />
          <p className="mt-4 text-lg font-semibold">
            {provider.firstName} {provider.lastName}
          </p>
          <p className="text-ink-soft">{provider.category.name}</p>
          {provider.verified ? <VerifiedBadge className="mt-2" label="Zweryfikowany profil" /> : null}
          <Button variant="secondary" size="sm" className="mt-5">
            Zmień zdjęcie
          </Button>
        </aside>
      </div>
    </>
  );
}
