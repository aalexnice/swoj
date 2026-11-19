const map: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
  Ą: "a", Ć: "c", Ę: "e", Ł: "l", Ń: "n", Ó: "o", Ś: "s", Ź: "z", Ż: "z",
};

/** URL-safe slug that transliterates Polish diacritics: „Ruda Śląska” → „ruda-slaska”. */
export function slugify(input: string): string {
  return input
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Lower-case and strip diacritics for fuzzy text matching. */
export function normalizeText(input: string): string {
  return slugify(input).replace(/-/g, " ");
}
