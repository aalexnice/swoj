import type { Metadata } from "next";
import { getRepository } from "@/services/data";
import { getCurrentProvider } from "@/features/dashboard/current-provider";
import { AppShell, type NavItem } from "@/components/dashboard/app-shell";

export const metadata: Metadata = { title: "Panel specjalisty", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { provider } = await getCurrentProvider();
  const repo = getRepository();
  const [requests, bookings] = await Promise.all([
    repo.listRequests({ categorySlugs: [provider.primaryCategory, ...provider.secondaryCategories] }),
    repo.listBookings({ providerId: provider.id }),
  ]);
  const nav: NavItem[] = [
    { href: "/panel", label: "Dashboard", icon: "dashboard", mobile: true },
    { href: "/panel/profil", label: "Profil", icon: "profile" },
    { href: "/panel/uslugi", label: "Usługi", icon: "services" },
    { href: "/panel/kalendarz", label: "Kalendarz", icon: "calendar", mobile: true },
    { href: "/panel/zlecenia", label: "Zlecenia", icon: "requests", badge: requests.filter((r) => r.status === "open").length, mobile: true },
    { href: "/panel/rezerwacje", label: "Rezerwacje", icon: "bookings", badge: bookings.filter((b) => b.status === "pending").length, mobile: true },
    { href: "/panel/opinie", label: "Opinie", icon: "reviews" },
    { href: "/panel/portfolio", label: "Portfolio", icon: "portfolio" },
    { href: "/panel/ustawienia", label: "Ustawienia", icon: "settings" },
  ];
  return (
    <AppShell title="Panel" nav={nav} user={{ name: `${provider.firstName} ${provider.lastName}`, subtitle: `${provider.category.name}, ${provider.city.name}` }}>
      {children}
    </AppShell>
  );
}
