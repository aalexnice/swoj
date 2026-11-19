import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <Logo className="justify-center" />
        <p className="mt-10 font-display text-7xl font-bold text-brand-200">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Nie ma tu takiej strony</h1>
        <p className="mt-2 text-ink-soft">Link mógł się zmienić albo profil został usunięty. Wyszukaj usługę albo wróć na stronę główną.</p>
        <div className="mt-8 flex justify-center gap-2">
          <Button asChild variant="secondary">
            <Link href="/">Strona główna</Link>
          </Button>
          <Button asChild>
            <Link href="/uslugi">Znajdź usługę</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
