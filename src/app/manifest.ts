import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Web app manifest.
 *
 * `display: "browser"` is deliberate: this phase adds no service worker, offline
 * mode, push notifications or install prompt, so the site must not present
 * itself as an installable standalone application.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: "Silver Oak",
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: "#f5f1e8", // --soe-color-canvas
    theme_color: "#0d0f0e", // --soe-color-night
    icons: [
      {
        src: "/icons/silver-oak-estate-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/silver-oak-estate-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
