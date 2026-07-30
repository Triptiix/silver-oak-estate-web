import { publicInformation } from "@/config/public-information";
import { siteConfig } from "@/config/site";
import { SHARE_IMAGE } from "@/lib/seo/page-metadata";

/**
 * Conservative JSON-LD for the estate.
 *
 * Every value is read from the existing verified sources (`siteConfig` and
 * `publicInformation`). Fields that would require unverified data are
 * deliberately omitted: geo coordinates, aggregateRating, review, starRating,
 * openingHours, sameAs, priceRange, paymentAccepted, currenciesAccepted, and
 * any legal-entity or merchant-of-record identity.
 *
 * No `potentialAction` / `ReserveAction` / `Offer` is emitted: public online
 * booking is disabled and bookings are assisted-enquiry only, so advertising a
 * machine-readable booking action would be untrue.
 */
export function EstateStructuredData() {
  const { contact, location } = publicInformation;
  const address = location.postalAddress;

  const data = {
    "@context": "https://schema.org",
    "@type": ["LodgingBusiness", "EventVenue"],
    "@id": `${siteConfig.url}/#estate`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    image: `${siteConfig.url}${SHARE_IMAGE.url}`,
    email: contact.email,
    telephone: contact.primaryPhone.e164,
    address: {
      "@type": "PostalAddress",
      streetAddress: address.streetAddress,
      addressLocality: address.addressLocality,
      addressRegion: address.addressRegion,
      postalCode: address.postalCode,
      addressCountry: address.addressCountry,
    },
  };

  return (
    <script
      type="application/ld+json"
      // Escaping "<" prevents the serialized JSON from terminating the script
      // element early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
