"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Nie udało się wczytać strony</h1>
        <p className="mt-2 text-ink-soft">Spróbuj ponownie za chwilę. Jeśli problem się powtarza, napisz do nas: kontakt@swoj.pl.</p>
        <Button className="mt-6" onClick={reset}>
          Spróbuj ponownie
        </Button>
      </div>
    </div>
  );
}
