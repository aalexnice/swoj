import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { getAuthService } from "@/services/auth/auth-service";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthService().getSession();
  return (
    <>
      <a href="#tresc" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2">
        Przejdź do treści
      </a>
      <SiteHeader user={user} />
      <main id="tresc">{children}</main>
      <SiteFooter />
      <MobileTabBar />
    </>
  );
}
