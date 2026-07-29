import Link from "next/link";
import { EstateContainer } from "@/components/estate-ui/estate-container";
import { publicInformation } from "@/config/public-information";
import { siteConfig } from "@/config/site";

const estateLinks = [
  { href: "/estate", label: "The Estate" },
  { href: "/experiences", label: "Experiences" },
  { href: "/gallery", label: "Gallery" },
  { href: "/availability", label: "Availability" },
] as const;

const visitLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/location", label: "Location" },
  { href: "/policies", label: "Policies" },
] as const;

const informationLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
] as const;

const footerLinkClasses =
  "inline-flex min-h-11 items-center rounded-[var(--soe-radius-control)] font-soe-ui text-[length:var(--soe-text-sm)] text-[var(--soe-surface-text-secondary)] transition-colors duration-[var(--soe-duration-interface)] hover:text-[var(--soe-surface-text-primary)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--soe-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--soe-color-focus-offset)]";

export function SiteFooter() {
  return (
    <footer
      data-estate-theme="dark"
      className="border-t border-[var(--soe-color-gold)]/50 bg-[var(--soe-color-night)]"
    >
      <EstateContainer variant="visual" className="py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,0.75fr)] lg:gap-10">
          <div className="max-w-md">
            <p className="font-soe-display text-[length:var(--soe-text-2xl)] text-[var(--soe-surface-text-primary)]">
              {siteConfig.name}
            </p>
            <div className="my-5 h-px w-20 bg-[var(--soe-color-gold)]" />
            <p className="font-soe-body text-[length:var(--soe-text-sm)] leading-[var(--soe-leading-body)] text-[var(--soe-surface-text-secondary)]">
              A complete private 3 BHK farmhouse in Sector 135, Noida, with a
              pool, lawn and indoor gathering space for stays and approved
              private events.
            </p>
          </div>

          <FooterGroup title="Estate" links={estateLinks} />
          <FooterGroup title="Plan your visit" links={visitLinks} />

          <div>
            <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-gold)]">
              Information
            </p>
            <nav aria-label="Footer information" className="mt-3 flex flex-col">
              {informationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={footerLinkClasses}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={publicInformation.contact.mailtoHref}
                className={footerLinkClasses}
              >
                Email
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--soe-color-gold)]/35 pt-6">
          <p className="font-soe-ui text-[length:var(--soe-text-xs)] text-[var(--soe-surface-text-secondary)]">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
        </div>
      </EstateContainer>
    </footer>
  );
}

function FooterGroup({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div>
      <p className="font-soe-ui text-[length:var(--soe-text-xs)] font-semibold uppercase tracking-[var(--soe-tracking-eyebrow)] text-[var(--soe-color-gold)]">
        {title}
      </p>
      <nav aria-label={`Footer ${title}`} className="mt-3 flex flex-col">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={footerLinkClasses}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
