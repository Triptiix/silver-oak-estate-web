import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";

import { Newsreader, Manrope } from "next/font/google";

const fontNewsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-newsreader",
});

const fontManrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: "/",
    locale: "en_IN",
    images: [
      {
        url: "/images/estate/home/hero-estate-exterior.webp",
        width: 3840,
        height: 2877,
        alt: "Exterior view of Silver Oak Estate private farmhouse in Sector 135, Noida",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/images/estate/home/hero-estate-exterior.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-[var(--background)] antialiased ${fontNewsreader.variable} ${fontManrope.variable}`}>
        {children}
      </body>
    </html>
  );
}
