import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

// /privacy and /terms are intentionally excluded while they remain review-draft
// placeholders (they are also noindex). They return to the sitemap once approved
// legal content is published.
const PUBLIC_SITEMAP_PATHS = [
  "",
  "/estate",
  "/experiences",
  "/gallery",
  "/pricing",
  "/location",
  "/policies",
  "/contact",
  "/availability",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${siteConfig.url}${path}`,
  }));
}
