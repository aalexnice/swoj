const plnFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

export function formatPrice(value: number): string {
  return `${plnFormatter.format(value)} zł`;
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

/** Polish plural: pluralPl(5, ["opinia", "opinie", "opinii"]) → „opinii” */
export function pluralPl(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n);
  if (abs === 1) return forms[0];
  const last = abs % 10;
  const lastTwo = abs % 100;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms[1];
  return forms[2];
}

export function countLabel(n: number, forms: [string, string, string]): string {
  return `${n} ${pluralPl(n, forms)}`;
}

export function formatDuration(min: number, max: number): string {
  const fmt = (m: number) => {
    if (m < 60) return `${m} min`;
    const h = m / 60;
    if (h >= 24) {
      const d = Math.round(h / 8);
      return `${d} ${pluralPl(d, ["dzień", "dni", "dni"])} pracy`;
    }
    return `${Number.isInteger(h) ? h : h.toFixed(1).replace(".", ",")} godz.`;
  };
  if (min === max) return fmt(min);
  if (min < 60 || max >= 24 * 60) return `${fmt(min)} – ${fmt(max)}`;
  const a = min / 60;
  const b = max / 60;
  const f = (x: number) => (Number.isInteger(x) ? `${x}` : x.toFixed(1).replace(".", ","));
  return `${f(a)}–${f(b)} godz.`;
}

const dateFormatter = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "short" });

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatShortDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}

export function priceWithUnit(price: number, unit: string): string {
  return unit === "usługa" ? `od ${formatPrice(price)}` : `od ${formatPrice(price)} / ${unit}`;
}
