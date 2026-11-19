import { getCurrentProvider } from "@/features/dashboard/current-provider";
import { PageHeader } from "@/components/dashboard/widgets";
import { PortfolioArt } from "@/components/shared/portfolio-art";
import { ImagePlus } from "lucide-react";

export default async function PortfolioPage() {
  const { provider } = await getCurrentProvider();
  return (
    <>
      <PageHeader title="Portfolio" description="Zdjęcia realizacji pokazują klientom, jak pracujesz." />
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <li>
          <label className="grid aspect-[4/3] h-full cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-line-strong text-muted hover:border-brand-400 hover:text-brand-700 focus-within:ring-2 focus-within:ring-brand-500">
            <span className="flex flex-col items-center gap-2 text-sm font-medium">
              <ImagePlus className="size-7" aria-hidden />
              Dodaj realizację
            </span>
            <input type="file" accept="image/*" className="sr-only" />
          </label>
        </li>
        {provider.portfolio.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="aspect-[4/3]">
              <PortfolioArt item={item} />
            </div>
            <div className="p-3">
              <p className="text-[15px] font-medium">{item.title}</p>
              <p className="text-sm text-muted">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
