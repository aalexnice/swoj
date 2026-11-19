import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIService } from "@/services/ai/ai-service";
import { parseJson, rateLimit } from "@/lib/api";

const schema = z.object({ text: z.string().trim().min(3).max(500), citySlug: z.string().optional() });

/** Free text → structured intent (category, city, urgency, preferred date). */
export async function POST(request: Request) {
  const limited = await rateLimit(request, "ai", 30, 60_000);
  if (limited) return limited;
  const parsed = await parseJson(request, schema);
  if ("error" in parsed) return parsed.error;
  const result = await getAIService().interpretQuery(parsed.data.text, { citySlug: parsed.data.citySlug ?? null });
  return NextResponse.json(result);
}
