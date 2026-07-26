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
