import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const PUBLIC_SITEMAP_PATHS = [
  "",
  "/estate",
  "/experiences",
  "/gallery",
  "/pricing",
  "/location",
  "/policies",
  "/privacy",
  "/terms",
  "/contact",
  "/availability",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${siteConfig.url}${path}`,
  }));
}
