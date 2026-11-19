import { ImageResponse } from "next/og";

export const alt = "SWOJ — Znajdź sprawdzonego człowieka do każdej usługi.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0b362d", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 44, fontWeight: 700 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <path d="M16 2.5c-6.9 0-12 5.1-12 11.7 0 8.2 9.3 14.6 11.2 15.8.5.3 1.1.3 1.6 0C18.7 28.8 28 22.4 28 14.2 28 7.6 22.9 2.5 16 2.5Z" fill="#3f9a83" />
            <path d="M10.5 15.2 16 10.6l5.5 4.6v5.6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-5.6Z" fill="#fff" />
          </svg>
          SWOJ
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Znajdź sprawdzonego człowieka do każdej usługi.</div>
          <div style={{ fontSize: 32, color: "#a9d6c8" }}>Specjaliści ze Śląska. Opinie, ceny i terminy w jednym miejscu.</div>
        </div>
      </div>
    ),
    size,
  );
}
