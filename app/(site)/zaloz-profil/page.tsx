import { getRepository } from "@/services/data";
import { buildMetadata } from "@/lib/seo";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";

export const metadata = buildMetadata({
  title: "Załóż profil specjalisty",
  description: "Stwórz darmowy profil specjalisty w 10 krokach: usługi, cennik, dostępność, zdjęcie, opis i portfolio.",
  path: "/zaloz-profil",
});

export default async function OnboardingPage() {
  const repo = getRepository();
  const [categories, cities] = await Promise.all([repo.listCategories(), repo.listCities()]);
  return (
    <div className="container-page pb-16 pt-8 sm:pt-12">
      <OnboardingWizard categories={categories} cities={cities} />
    </div>
  );
}
