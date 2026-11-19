import { NextResponse } from "next/server";
import { getRepository } from "@/services/data";
import { assertSameOrigin, parseJson, rateLimit } from "@/lib/api";
import { requestSchema } from "@/validation/schemas";

export async function POST(request: Request) {
  const forbidden = assertSameOrigin(request);
  if (forbidden) return forbidden;
  const limited = await rateLimit(request, "request", 5, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, requestSchema);
  if ("error" in parsed) return parsed.error;

  const repo = getRepository();
  const [category, city] = await Promise.all([repo.getCategory(parsed.data.categorySlug), repo.getCity(parsed.data.citySlug)]);
  if (!category || !city) {
    return NextResponse.json({ error: "Wybierz kategorię i miasto z listy." }, { status: 422 });
  }

  try {
    const result = await repo.createRequest(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error("request_failed", e);
    return NextResponse.json({ error: "Nie udało się wysłać zapytania. Spróbuj ponownie." }, { status: 500 });
  }
}
