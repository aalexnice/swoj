import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/panel", "/admin", "/api", "/konto", "/logowanie", "/*/rezerwacja"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
