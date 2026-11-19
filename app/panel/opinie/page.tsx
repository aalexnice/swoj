import { getRepository } from "@/services/data";
import { getCurrentProvider } from "@/features/dashboard/current-provider";
import { PageHeader, StatCard } from "@/components/dashboard/widgets";
import { DemoComposeSheet } from "@/components/dashboard/demo-actions";
import { Stars } from "@/components/shared/rating";
import { formatDate, formatRating } from "@/utils/format";

export default async function ReviewsPage() {
  const { provider } = await getCurrentProvider();
  const reviews = await getRepository().listReviews({ providerId: provider.id });
  return (
    <>
      <PageHeader title="Opinie" description="Odpowiadaj na opinie — klienci widzą, że dbasz o kontakt." />
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Średnia ocena" value={formatRating(provider.ratingAvg)} />
        <StatCard label="Wszystkie opinie" value={String(provider.reviewCount)} />
        <StatCard label="Z potwierdzoną rezerwacją" value={`${Math.round((reviews.filter((r) => r.verifiedBooking).length / Math.max(1, reviews.length)) * 100)}%`} />
      </div>
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Stars value={r.rating} />
              <span className="text-sm text-muted">{formatDate(r.date)}</span>
            </div>
            <p className="mt-3 text-[17px]">„{r.text}”</p>
            <p className="mt-2 text-sm text-muted">
              {r.authorName}, {r.authorCity} — {r.serviceName}
            </p>
            {r.reply ? (
              <p className="mt-4 rounded-2xl bg-canvas p-4 text-[15px] text-ink-soft">
                <span className="font-medium text-ink">Twoja odpowiedź: </span>
                {r.reply}
              </p>
            ) : (
              <div className="mt-4">
                <DemoComposeSheet trigger="Odpowiedz" title="Odpowiedź na opinię" placeholder="Dziękuję za opinię…" submitLabel="Opublikuj odpowiedź" doneLabel="Odpowiedź opublikowana" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
