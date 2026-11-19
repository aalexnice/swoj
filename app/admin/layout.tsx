import type { Metadata } from "next";
import { getCurrentAdmin } from "@/features/dashboard/current-provider";
import { AppShell, type NavItem } from "@/components/dashboard/app-shell";

export const metadata: Metadata = { title: "Panel administratora", robots: { index: false, follow: false } };

const nav: NavItem[] = [
  { href: "/admin", label: "Statystyki", icon: "stats", mobile: true },
  { href: "/admin/uzytkownicy", label: "Użytkownicy", icon: "users" },
  { href: "/admin/specjalisci", label: "Specjaliści", icon: "providers", mobile: true },
  { href: "/admin/uslugi", label: "Usługi", icon: "services" },
  { href: "/admin/rezerwacje", label: "Rezerwacje", icon: "bookings", mobile: true },
  { href: "/admin/zlecenia", label: "Zlecenia", icon: "requests" },
  { href: "/admin/opinie", label: "Opinie", icon: "reviews" },
  { href: "/admin/zgloszenia", label: "Zgłoszenia", icon: "reports", badge: 3 },
  { href: "/admin/weryfikacja", label: "Weryfikacja", icon: "verification", badge: 2, mobile: true },
  { href: "/admin/kategorie", label: "Kategorie", icon: "categories" },
  { href: "/admin/miasta", label: "Miasta", icon: "cities" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  return (
    <AppShell title="Admin" nav={nav} user={{ name: admin.name, subtitle: admin.email }}>
      {children}
    </AppShell>
  );
}
