import type { InterpretedQuery } from "@/types";
import { categories } from "@/data/categories";
import { cities } from "@/data/cities";
import { normalizeText } from "@/utils/slugify";

/**
 * AIService — turns a free-text need into structured search intent.
 *
 *   „Cieknie mi woda pod zlewem i potrzebuję kogoś jutro rano.”
 *   → { categorySlug: "hydraulik", urgency: "high", preferredDate: "jutro rano" }
 *
 * The MockAIService below is a deterministic keyword matcher. To plug in an LLM,
 * implement this interface (e.g. calling the Anthropic or OpenAI API from a server
 * route with AI_API_KEY) and return it from getAIService().
 */
export interface AIService {
  interpretQuery(text: string, context?: { citySlug?: string | null }): Promise<InterpretedQuery>;
}

const URGENT = ["pilne", "pilnie", "awaria", "natychmiast", "szybko", "dzisiaj", "dziś", "dzis", "teraz", "zalało", "zalalo", "cieknie", "nie działa", "nie dziala"];

const DATE_HINTS: { pattern: RegExp; label: string; urgency?: "high" | "normal" }[] = [
  { pattern: /\b(dzis|dzisiaj|teraz)\b/, label: "dziś", urgency: "high" },
  { pattern: /\bjutro rano\b/, label: "jutro rano", urgency: "high" },
  { pattern: /\bjutro\b/, label: "jutro", urgency: "high" },
  { pattern: /\bpojutrze\b/, label: "pojutrze" },
  { pattern: /\bw weekend\b|\bweekend\b|\bsobot|\bniedziel/, label: "weekend" },
  { pattern: /\bw tym tygodniu\b/, label: "w tym tygodniu" },
  { pattern: /\bw przyszlym tygodniu\b/, label: "w przyszłym tygodniu" },
];

// Stems let one keyword match several Polish inflections („hydraulika”, „hydraulikiem”).
function stem(word: string): string {
  const w = normalizeText(word);
  return w.length > 5 ? w.slice(0, w.length - 2) : w;
}

export class MockAIService implements AIService {
  async interpretQuery(text: string, context?: { citySlug?: string | null }): Promise<InterpretedQuery> {
    const normalized = ` ${normalizeText(text)} `;

    let best: { slug: string; score: number } | null = null;
    for (const category of categories) {
      let score = 0;
      for (const kw of [category.name, category.personNoun, ...category.keywords]) {
        const k = stem(kw);
        if (k.length >= 3 && normalized.includes(k)) score += k.length;
      }
      if (score > 0 && (!best || score > best.score)) best = { slug: category.slug, score };
    }

    let citySlug: string | null = context?.citySlug ?? null;
    for (const city of cities) {
      const name = stem(city.name);
      const loc = stem(city.locative.replace(/^w /, ""));
      if (normalized.includes(name) || normalized.includes(loc)) {
        citySlug = city.slug;
        break;
      }
    }

    let preferredDate: string | null = null;
    let urgency: InterpretedQuery["urgency"] = "normal";
    for (const hint of DATE_HINTS) {
      if (hint.pattern.test(normalized)) {
        preferredDate = hint.label;
        if (hint.urgency) urgency = hint.urgency;
        break;
      }
    }
    if (URGENT.some((u) => normalized.includes(normalizeText(u)))) urgency = "high";

    const category = categories.find((c) => c.slug === best?.slug);
    const city = cities.find((c) => c.slug === citySlug);
    const parts = [
      category ? category.name : null,
      city ? city.name : null,
      preferredDate ? `termin: ${preferredDate}` : null,
      urgency === "high" ? "pilne" : null,
    ].filter(Boolean);

    return {
      categorySlug: best?.slug ?? null,
      citySlug,
      urgency,
      preferredDate,
      summary: parts.join(" · "),
    };
  }
}

let instance: AIService | null = null;

export function getAIService(): AIService {
  // Integration point: return a real LLM-backed implementation when AI_API_KEY is configured.
  instance ??= new MockAIService();
  return instance;
}
