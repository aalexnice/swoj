import { NextResponse } from "next/server";
import { getRepository } from "@/services/data";
import { assertSameOrigin, parseJson, rateLimit } from "@/lib/api";
import { bookingSchema } from "@/validation/schemas";

export async function POST(request: Request) {
  const forbidden = assertSameOrigin(request);
  if (forbidden) return forbidden;
  const limited = await rateLimit(request, "booking", 10, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, bookingSchema);
  if ("error" in parsed) return parsed.error;

  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.date < today) {
    return NextResponse.json({ error: "Wybrany termin już minął." }, { status: 422 });
  }

  try {
    const { id } = await getRepository().createBooking(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "SERVICE_NOT_FOUND") {
      return NextResponse.json({ error: "Ta usługa nie jest już dostępna." }, { status: 404 });
    }
    console.error("booking_failed", e);
    return NextResponse.json({ error: "Nie udało się wysłać rezerwacji. Spróbuj ponownie." }, { status: 500 });
  }
}
