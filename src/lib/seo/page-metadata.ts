import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/**
 * Shared Open Graph image. Declared once so every route advertises a real,
 * on-disk asset rather than each page repeating the path.
 */
export const SHARE_IMAGE = {
  url: "/images/brand/silver-oak-estate-og.webp",
  width: 1200,
  height: 630,
  alt: "Silver Oak Estate private farmhouse at twilight, with the residence lit and the pool beyond",
} as const;

/**
 * Builds page metadata with a canonical URL and route-specific social cards.
 *
 * Next.js shallow-merges metadata, so a page that declares `openGraph` replaces
 * the parent object entirely. Routing every page through this helper keeps the
 * shared fields (site name, locale, type, image) attached while still giving
 * each route its own title, description and URL in the share preview.
 *
 * @param absoluteTitle - use when the title already names the estate, so the
 * root title template does not append the site name a second time.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  // The share card always shows the full, self-describing title.
  const socialTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: "en_IN",
      title: socialTitle,
      description,
      url: path,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [SHARE_IMAGE.url],
    },
  };
}
